
"use strict";

const fs = require("fs");
const path = require("path");

const { startAll, getApi } = require("./accounts/runtime");
const { getAccounts } = require("./accounts/manager");
const { getAllStatus } = require("./accounts/status");
const { selectAccount } = require("./accounts/selection");
const { getSelectedApi } = require("./accounts/controller");
const { createListener } = require("./accounts/listener");

// VIP LISTEN SYSTEM
const listenSystem = require("./accounts/listen-system");

const COMMANDS_DIR = path.join(__dirname, "commands");
const SETTINGS_DIR = path.join(__dirname, "account-settings");
const ADMINS_FILE = path.join(__dirname, "admins.json");

const OWNER_ID = String(process.env.OWNER_ID || "");
const PREFIX = "!";

const DEFAULT_SETTINGS = {
    enabled: false,
    message: "مرحباً بك 👋 أنا بوت VIRUS-FCA.",
    delay: 5
};

const commands = new Map();

if (!fs.existsSync(SETTINGS_DIR)) {
    fs.mkdirSync(SETTINGS_DIR, { recursive: true });
}

// ================================
// نظام الأدمن
// ================================

function loadAdmins() {
    try {
        if (!fs.existsSync(ADMINS_FILE)) {
            fs.writeFileSync(
                ADMINS_FILE,
                JSON.stringify({ admins: [] }, null, 2)
            );
        }

        const data = JSON.parse(
            fs.readFileSync(ADMINS_FILE, "utf8")
        );

        if (!data || !Array.isArray(data.admins)) {
            console.error("❌ ملف admins.json غير صالح.");
            return [];
        }

        return data.admins.map(id => String(id));

    } catch (error) {
        console.error("❌ خطأ في قراءة admins.json:", error.message);
        return [];
    }
}

function isOwner(senderID) {
    return OWNER_ID !== "" &&
        String(senderID) === OWNER_ID;
}

function isAdmin(senderID) {
    return loadAdmins().includes(String(senderID));
}

function isPrivileged(senderID) {
    return isOwner(senderID) || isAdmin(senderID);
}

function isPrivate(event) {
    return String(event.threadID) === String(event.senderID);
}

// ================================
// إعدادات مستقلة لكل حساب
// ================================

function settingsFile(id) {
    return path.join(SETTINGS_DIR, `account${id}.json`);
}

function loadSettings(id) {
    const file = settingsFile(id);

    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(
                file,
                JSON.stringify(DEFAULT_SETTINGS, null, 2)
            );

            return { ...DEFAULT_SETTINGS };
        }

        const data = JSON.parse(
            fs.readFileSync(file, "utf8")
        );

        return {
            ...DEFAULT_SETTINGS,
            ...data
        };

    } catch (error) {
        console.error(`Settings Error ${id}:`, error.message);
        return { ...DEFAULT_SETTINGS };
    }
}

function saveSettings(id, settings) {
    fs.writeFileSync(
        settingsFile(id),
        JSON.stringify(settings, null, 2)
    );
}

// ================================
// تحميل الأوامر
// ================================

function loadCommands() {
    if (!fs.existsSync(COMMANDS_DIR)) {
        fs.mkdirSync(COMMANDS_DIR, { recursive: true });
    }

    const files = fs.readdirSync(COMMANDS_DIR)
        .filter(file => file.endsWith(".js"));

    for (const file of files) {
        try {
            const command = require(
                path.join(COMMANDS_DIR, file)
            );

            if (!command.name || typeof command.run !== "function") {
                console.log(`⚠️ أمر غير صالح: ${file}`);
                continue;
            }

            commands.set(command.name.toLowerCase(), command);

            console.log(`✅ تم تحميل الأمر: ${command.name}`);

        } catch (error) {
            console.error(`❌ خطأ في ${file}:`, error);
        }
    }
}

// ================================
// إرسال الرسائل
// ================================

async function sendMessage(api, event, text) {
    const threadID = event.threadID;

    if (
        event.isE2EE &&
        api.e2ee &&
        typeof api.e2ee.sendMessage === "function"
    ) {
        return api.e2ee.sendMessage(threadID, text);
    }

    return api.sendMessage(text, threadID);
}

// ================================
// عرض الحسابات
// ================================

async function showAccounts(api, event) {
    const statuses = getAllStatus();
    const available = getAccounts();

    let output = "╔═══『 VIRUS ACCOUNTS 』═══╗\n\n";

    for (const account of statuses) {
        const exists = available.some(a => a.id === account.id);

        output +=
            `${account.id}. الحساب ${account.id}\n` +
            `الحالة: ${
                !exists ? "⚪ غير مجهز" :
                account.status === "متصل" ? "🟢 متصل" :
                "🔴 غير متصل"
            }\n\n`;
    }

    output += "╚══════════════════════╝";

    return sendMessage(api, event, output);
}

// ================================
// اختيار الحساب
// ================================

async function handleSelect(api, event, message) {
    const senderID = String(event.senderID);

    if (!isPrivileged(senderID) || !isPrivate(event)) {
        return;
    }

    const parts = message.trim().split(/\s+/);

    if (parts.length !== 2) {
        return sendMessage(
            api,
            event,
            "طريقة الاستخدام:\n!select 1\n!select 2"
        );
    }

    const id = Number(parts[1]);
    const connected = Boolean(getApi(id));

    try {
        selectAccount(senderID, id, connected);

        return sendMessage(
            api,
            event,
            `✅ تم اختيار الحساب ${id} بنجاح.`
        );

    } catch (error) {
        return sendMessage(api, event, `❌ ${error.message}`);
    }
}

// ================================
// DAMON
// ================================

async function handleDamon(api, event, message) {
    const senderID = String(event.senderID);

    if (!isPrivileged(senderID) || !isPrivate(event)) {
        return;
    }

    let selected;

    try {
        selected = getSelectedApi(senderID, OWNER_ID);
    } catch (error) {
        return sendMessage(api, event, `❌ ${error.message}`);
    }

    const accountID = selected.accountID;
    const settings = loadSettings(accountID);

    const args = message.slice(6).trim();
    const parts = args.split(/\s+/);
    const action = (parts[0] || "").toLowerCase();

    async function reply(text) {
        return sendMessage(api, event, text);
    }

    if (action === "تشغيل" || action === "on") {
        settings.enabled = true;
        saveSettings(accountID, settings);

        return reply(`🟢 تم تشغيل DAMON للحساب ${accountID}.`);
    }

    if (action === "ايقاف" || action === "off") {
        settings.enabled = false;
        saveSettings(accountID, settings);

        return reply(`🔴 تم إيقاف DAMON للحساب ${accountID}.`);
    }

    if (action === "رسالة") {
        const newMessage = args.slice(action.length).trim();

        if (!newMessage) {
            return reply("❌ اكتب الرسالة بعد الأمر.");
        }

        settings.message = newMessage;
        saveSettings(accountID, settings);

        return reply("✅ تم تغيير رسالة DAMON.");
    }

    if (action === "وقت") {
        const seconds = Number(parts[1]);

        if (
            !Number.isInteger(seconds) ||
            seconds < 0 ||
            seconds > 3600
        ) {
            return reply("❌ حدد وقتاً من 0 إلى 3600 ثانية.");
        }

        settings.delay = seconds;
        saveSettings(accountID, settings);

        return reply(`⏱️ تم ضبط التأخير على ${seconds} ثانية.`);
    }

    if (action === "حالة") {
        return reply(
            `╔═══『 DAMON 』═══╗\n` +
            `الحساب: ${accountID}\n` +
            `الحالة: ${settings.enabled ? "🟢 يعمل" : "🔴 متوقف"}\n` +
            `التأخير: ${settings.delay} ثانية\n` +
            `رسالة الرد: ${settings.message}\n` +
            `╚══════════════╝`
        );
    }

    return reply(
        "⚙️ أوامر DAMON:\n\n" +
        "!damon تشغيل\n" +
        "!damon ايقاف\n" +
        "!damon رسالة النص\n" +
        "!damon وقت 5\n" +
        "!damon حالة"
    );
}

// ================================
// معالجة الرسائل
// ================================

async function handleMessage({
    accountID,
    api,
    event,
    message
}) {
    const senderID = String(event.senderID);
    const privileged = isPrivileged(senderID);
    const privateChat = isPrivate(event);

    // VIP LISTEN SYSTEM
    // يستمع فقط للأشخاص الموجودين في القائمة
    try {
        listenSystem.processIncoming(
            accountID,
            api,
            event
        );
    } catch (error) {
        console.error(
            `[VIP LISTEN ${accountID}]`,
            error
        );
    }

    // عرض الحسابات
    if (
        privileged &&
        privateChat &&
        message.toLowerCase() === "!accounts"
    ) {
        return showAccounts(api, event);
    }

    // اختيار الحساب
    if (
        privileged &&
        privateChat &&
        message.toLowerCase().startsWith("!select ")
    ) {
        return handleSelect(api, event, message);
    }

    // DAMON
    if (
        privileged &&
        privateChat &&
        message.toLowerCase().startsWith("!damon")
    ) {
        return handleDamon(api, event, message);
    }

    // تنفيذ الأوامر
    if (message.startsWith(PREFIX)) {
        const input = message.slice(PREFIX.length).trim();
        const parts = input.split(/\s+/);

        const commandName = (parts.shift() || "").toLowerCase();
        const args = parts;

        const command = commands.get(commandName);

        if (command) {
            let commandApi = api;
            let commandAccountID = accountID;

            if (privileged && privateChat) {
                try {
                    const selected = getSelectedApi(
                        senderID,
                        OWNER_ID
                    );

                    commandApi = selected.api;
                    commandAccountID = selected.accountID;

                } catch (error) {
                    return sendMessage(
                        api,
                        event,
                        `❌ ${error.message}`
                    );
                }
            }

            const send = async text => {
                return sendMessage(api, event, text);
            };

            try {
                await command.run({
                    api: commandApi,
                    event,
                    args,
                    send,
                    accountID: commandAccountID,
                    isOwner: isOwner(senderID),
                    isAdmin: isAdmin(senderID),
                    isPrivileged: privileged
                });

            } catch (error) {
                console.error(
                    `Command Error (${commandName}):`,
                    error
                );

                await send("❌ حدث خطأ أثناء تنفيذ الأمر.");
            }

            return;
        }
    }

    // الرد التلقائي المستقل لكل حساب
    const settings = loadSettings(accountID);

    if (!settings.enabled) return;

    await new Promise(resolve =>
        setTimeout(resolve, settings.delay * 1000)
    );

    const updatedSettings = loadSettings(accountID);

    if (!updatedSettings.enabled) return;

    await sendMessage(
        api,
        event,
        updatedSettings.message
    );
}

// ================================
// تشغيل النظام
// ================================

async function main() {
    if (!OWNER_ID) {
        console.error("❌ يجب ضبط OWNER_ID أولاً.");
        process.exit(1);
    }

    loadCommands();

    console.log(`👑 Owner ID: ${OWNER_ID}`);
    console.log(`🛡️ عدد الأدمن: ${loadAdmins().length}`);

    console.log("⏳ جاري تشغيل VIRUS-FCA...");

    const listener = createListener(handleMessage);

    try {
        const results = await startAll(listener);

        console.log("\n══════ نتائج تشغيل الحسابات ══════");

        for (const result of results) {
            console.log(
                `الحساب ${result.id}: ${
                    result.connected ? "🟢 متصل" : "🔴 غير متصل"
                }`
            );
        }

        console.log("══════════════════════════════════");

        if (!results.some(result => result.connected)) {
            console.error("❌ لم يتصل أي حساب.");
            return;
        }

        console.log("🚀 VIRUS-FCA بدأ التشغيل.");

    } catch (error) {
        console.error("❌ خطأ تشغيل النظام:", error);
    }
}

main();
