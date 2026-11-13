"use strict";

const fs = require("fs");
const path = require("path");
const login = require("fca-riyad");

const APPSTATE_FILE = path.join(__dirname, "appstate.json");
const SETTINGS_FILE = path.join(__dirname, "settings.json");
const COMMANDS_DIR = path.join(__dirname, "commands");

const OWNER_ID = process.env.OWNER_ID || "";
const PREFIX = "!";

const DEFAULT_SETTINGS = {
    enabled: false,
    message: "مرحباً بك 👋 أنا بوت VIRUS-FCA.",
    delay: 5
};

let settings = { ...DEFAULT_SETTINGS };
const commands = new Map();

// تحميل الإعدادات
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
        console.error("Settings Error:", error.message);
    }
}

function saveSettings() {
    fs.writeFileSync(
        SETTINGS_FILE,
        JSON.stringify(settings, null, 2)
    );
}

// تحميل الأوامر
function loadCommands() {
    if (!fs.existsSync(COMMANDS_DIR)) {
        fs.mkdirSync(COMMANDS_DIR, { recursive: true });
    }

    const files = fs.readdirSync(COMMANDS_DIR)
        .filter(file => file.endsWith(".js"));

    for (const file of files) {
        try {
            const command = require(path.join(COMMANDS_DIR, file));

            if (!command.name || typeof command.run !== "function") {
                console.log(`⚠️ أمر غير صالح: ${file}`);
                continue;
            }

            commands.set(command.name.toLowerCase(), command);
            console.log(`✅ تم تحميل الأمر: ${command.name}`);
        } catch (error) {
            console.error(`❌ خطأ في ${file}:`, error.message);
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// التحقق من ملف الجلسة
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
loadCommands();

console.log("⏳ جاري تشغيل VIRUS-FCA...");

login(
    { appState },
    { listenEvents: true },
    async (err, api) => {
        if (err) {
            console.error("❌ فشل تسجيل الدخول:", err);
            return;
        }

        console.log("✅ تم تسجيل الدخول!");

        try {
            api.sessionGuard(APPSTATE_FILE, {
                interval: 3 * 60 * 1000,
                debounce: 30 * 1000
            });

            await api.connectE2EE();
            console.log("🔐 تمت تهيئة E2EE");
        } catch (error) {
            console.error("⚠️ خطأ E2EE:", error.message);
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

            // تشغيل أوامر البوت
            if (message.startsWith(PREFIX)) {
                const input = message.slice(PREFIX.length).trim();
                const parts = input.split(/\s+/);
                const commandName = (parts.shift() || "").toLowerCase();
                const args = parts;

                const command = commands.get(commandName);

                if (command) {
                    try {
                        await command.run({
                            api,
                            event,
                            args,
                            send
                        });
                    } catch (error) {
                        console.error("Command Error:", error);
                        await send("❌ حدث خطأ أثناء تنفيذ الأمر.");
                    }

                    return;
                }
            }

            // أوامر DAMON للمالك فقط
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
                        return send("❌ حدد وقتاً من 0 إلى 3600 ثانية.");
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

                if (!settings.enabled) return;

                await send(settings.message);
            }
        });

        console.log("🚀 VIRUS-FCA جاهز!");
    }
);
