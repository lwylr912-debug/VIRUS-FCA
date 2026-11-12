"use strict";

const fs = require("fs");
const path = require("path");
const login = require("fca-riyad");

const APPSTATE_FILE = path.join(__dirname, "appstate.json");
const SETTINGS_FILE = path.join(__dirname, "settings.json");

const OWNER_ID = process.env.OWNER_ID || "";
const PREFIX = "!";

const DEFAULT_SETTINGS = {
    enabled: false,
    message: "مرحباً بك 👋 أنا بوت VIRUS-FCA.",
    delay: 5
};

let settings = { ...DEFAULT_SETTINGS };

function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            settings = {
                ...DEFAULT_SETTINGS,
                ...JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"))
            };
        } else {
            saveSettings();
        }
    } catch (error) {
        console.error("خطأ في إعدادات البوت:", error.message);
    }
}

function saveSettings() {
    fs.writeFileSync(
        SETTINGS_FILE,
        JSON.stringify(settings, null, 2)
    );
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

if (!fs.existsSync(APPSTATE_FILE)) {
    console.error("❌ ملف appstate.json غير موجود!");
    process.exit(1);
}

let appState;

try {
    appState = JSON.parse(
        fs.readFileSync(APPSTATE_FILE, "utf8")
    );
} catch (error) {
    console.error("❌ ملف appstate.json غير صالح!");
    process.exit(1);
}

loadSettings();

console.log("⏳ جاري تشغيل VIRUS-FCA...");

login(
    { appState },
    { listenEvents: true },
    async (err, api) => {
        if (err) {
            console.error("❌ فشل تسجيل الدخول:", err);
            return;
        }

        console.log("✅ تم تسجيل الدخول بنجاح!");

        try {
            api.sessionGuard(APPSTATE_FILE);
            await api.connectE2EE();
            console.log("🔐 تمت تهيئة E2EE");
        } catch (error) {
            console.error("⚠️ تعذر تهيئة E2EE:", error.message);
        }

        api.listenE2EE(async (error, event) => {
            if (error) {
                console.error("خطأ استقبال:", error);
                return;
            }

            if (!event || event.type !== "message") return;

            const message = (event.body || "").trim();
            const threadID = event.threadID;
            const senderID = event.senderID;

            if (!message || !threadID || !senderID) return;

            async function send(text) {
                if (event.isE2EE) {
                    await api.e2ee.sendMessage(threadID, text);
                } else {
                    api.sendMessage(text, threadID);
                }
            }

            // أوامر المالك
            if (message.toLowerCase().startsWith("!damon")) {
                if (!OWNER_ID || senderID !== OWNER_ID) return;

                const args = message.slice(6).trim();
                const parts = args.split(/\s+/);
                const action = parts[0];

                if (action === "تشغيل" || action === "on") {
                    settings.enabled = true;
                    saveSettings();
                    return send("🟢 تم تشغيل DAMON.");
                }

                if (action === "ايقاف" || action === "off") {
                    settings.enabled = false;
                    saveSettings();
                    return send("🔴 تم إيقاف DAMON.");
                }

                if (action === "رسالة") {
                    const newMessage = args.slice(action.length).trim();

                    if (!newMessage) {
                        return send("❌ اكتب الرسالة بعد الأمر.");
                    }

                    settings.message = newMessage;
                    saveSettings();

                    return send("✅ تم تغيير رسالة الرد.");
                }

                if (action === "وقت") {
                    const seconds = Number(parts[1]);

                    if (!Number.isInteger(seconds) || seconds < 0 || seconds > 3600) {
                        return send("❌ حدد وقتاً بالثواني من 0 إلى 3600.");
                    }

                    settings.delay = seconds;
                    saveSettings();

                    return send(`⏱️ تم ضبط التأخير على ${seconds} ثانية.`);
                }

                if (action === "حالة") {
                    return send(
                        `╔═══『 DAMON 』═══╗\n` +
                        `الحالة: ${settings.enabled ? "🟢 يعمل" : "🔴 متوقف"}\n` +
                        `التأخير: ${settings.delay} ثانية\n` +
                        `رسالة الرد: ${settings.message}\n` +
                        `╚══════════════╝`
                    );
                }

                return send(
                    "⚙️ أوامر DAMON:\n\n" +
                    "!damon تشغيل\n" +
                    "!damon ايقاف\n" +
                    "!damon رسالة النص\n" +
                    "!damon وقت 5\n" +
                    "!damon حالة"
                );
            }

            // الرد التلقائي
            if (settings.enabled) {
                await sleep(settings.delay * 1000);

                // التأكد من أن الرد التلقائي لم يتوقف أثناء الانتظار
                if (!settings.enabled) return;

                await send(settings.message);
            }
        });

        console.log("🚀 VIRUS-FCA جاهز!");
    }
);
