"use strict";

const { spawn } = require("child_process");
const path = require("path");

const MAX_RESTARTS = 25;
const BASE_DELAY_MS = 3000;
const MAX_DELAY_MS = 5 * 60 * 1000;
const BACKOFF_MULT = 1.8;
const RESET_STABLE_MS = 10 * 60 * 1000;

let restarts = 0;
let currentDelay = BASE_DELAY_MS;
let child = null;
let stableTimer = null;
let shuttingDown = false;

const ts = () => new Date().toTimeString().slice(0, 8);

const log = (msg) => {
    console.log(`${ts()} [VIRUS-WATCHDOG] ${msg}`);
};

function start() {
    if (shuttingDown) return;

    if (restarts >= MAX_RESTARTS) {
        log(`تم بلوغ الحد الأقصى لإعادة التشغيل (${MAX_RESTARTS}).`);
        process.exit(1);
    }

    restarts++;

    log(`تشغيل VIRUS-FCA... المحاولة ${restarts}`);

    let restartScheduled = false;

    child = spawn(
        process.execPath,
        [
            "--max-old-space-size=400",
            path.join(__dirname, "index.js")
        ],
        {
            stdio: "inherit",
            env: { ...process.env }
        }
    );

    if (stableTimer) clearTimeout(stableTimer);

    stableTimer = setTimeout(() => {
        restarts = 0;
        currentDelay = BASE_DELAY_MS;
        log("البوت مستقر، تم تصفير عداد المحاولات.");
    }, RESET_STABLE_MS);

    function scheduleRestart(code, signal) {
        if (restartScheduled || shuttingDown) return;

        restartScheduled = true;

        if (stableTimer) {
            clearTimeout(stableTimer);
            stableTimer = null;
        }

        child = null;

        log(`توقف البوت: code=${code}, signal=${signal}`);

        const delay = code === 0 ? 1000 : currentDelay;

        log(`إعادة التشغيل بعد ${Math.round(delay / 1000)} ثانية.`);

        setTimeout(() => {
            if (code !== 0) {
                currentDelay = Math.min(
                    currentDelay * BACKOFF_MULT,
                    MAX_DELAY_MS
                );
            } else {
                restarts = 0;
                currentDelay = BASE_DELAY_MS;
            }

            start();
        }, delay);
    }

    child.on("exit", (code, signal) => {
        scheduleRestart(code, signal);
    });

    child.on("error", (err) => {
        log(`خطأ في تشغيل البوت: ${err.message}`);
        scheduleRestart("ERROR", "SPAWN");
    });
}

function shutdown(signal) {
    if (shuttingDown) return;

    shuttingDown = true;

    log(`استقبال ${signal}، إيقاف البوت...`);

    if (stableTimer) clearTimeout(stableTimer);

    if (child) {
        child.kill("SIGTERM");

        setTimeout(() => {
            if (child) child.kill("SIGKILL");
            process.exit(0);
        }, 5000);
    } else {
        process.exit(0);
    }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start();
