
"use strict";

const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "listen-data");

if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR, { recursive: true });
}

const cooldowns = new Map();

const DEFAULT = {
    enabled: false,
    users: [],
    message: "مرحباً بك ❤️ سأرد عليك قريباً.",
    delay: 5,
    cooldown: 300
};

function getFile(id) {
    return path.join(DIR, `account${id}.json`);
}

function load(id) {
    try {
        const file = getFile(id);

        if (!fs.existsSync(file)) {
            const data = { ...DEFAULT, users: [] };
            save(id, data);
            return data;
        }

        const data = JSON.parse(fs.readFileSync(file, "utf8"));

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            throw new Error("ملف الإعدادات غير صالح.");
        }

        return {
            ...DEFAULT,
            ...data,
            enabled: data.enabled === true,
            users: Array.isArray(data.users)
                ? data.users.map(String)
                : []
        };

    } catch (error) {
        console.error("VIP LISTEN LOAD:", error.message);
        return { ...DEFAULT, users: [] };
    }
}

function save(id, data) {
    fs.writeFileSync(
        getFile(id),
        JSON.stringify(data, null, 2)
    );
}

function addUser(id, userID) {
    const data = load(id);
    userID = String(userID);

    if (!/^\d+$/.test(userID)) {
        throw new Error("ID غير صالح.");
    }

    if (data.users.includes(userID)) {
        throw new Error("هذا الشخص موجود مسبقاً.");
    }

    data.users.push(userID);
    save(id, data);
}

function removeUser(id, userID) {
    const data = load(id);
    userID = String(userID);

    if (!data.users.includes(userID)) {
        throw new Error("هذا الشخص غير موجود.");
    }

    data.users = data.users.filter(x => x !== userID);
    save(id, data);
}

function setMessage(id, message) {
    message = String(message).trim();

    if (!message) {
        throw new Error("الرسالة لا يمكن أن تكون فارغة.");
    }

    const data = load(id);
    data.message = message;
    save(id, data);
}

function setDelay(id, seconds) {
    seconds = Number(seconds);

    if (!Number.isInteger(seconds) || seconds < 0 || seconds > 3600) {
        throw new Error("التأخير يجب أن يكون بين 0 و3600 ثانية.");
    }

    const data = load(id);
    data.delay = seconds;
    save(id, data);
}

function setCooldown(id, seconds) {
    seconds = Number(seconds);

    if (!Number.isInteger(seconds) || seconds < 0 || seconds > 86400) {
        throw new Error("مدة الانتظار يجب أن تكون بين 0 و86400 ثانية.");
    }

    const data = load(id);
    data.cooldown = seconds;
    save(id, data);
}

function setEnabled(id, enabled) {
    const data = load(id);
    data.enabled = Boolean(enabled);
    save(id, data);
}

function isPrivate(event) {
    if (!event || !event.threadID || !event.senderID) {
        return false;
    }

    if (event.isGroup === true) {
        return false;
    }

    if (event.isGroup === false) {
        return true;
    }

    return String(event.threadID) === String(event.senderID);
}

function processIncoming(id, api, event) {
    if (!isPrivate(event)) return;

    if (!api || typeof api.sendMessage !== "function") {
        return;
    }

    const data = load(id);
    const sender = String(event.senderID);

    if (!data.enabled || !data.users.includes(sender)) {
        return;
    }

    const key = `${id}:${sender}`;
    const now = Date.now();
    const last = cooldowns.get(key) || 0;

    if (now - last < data.cooldown * 1000) {
        return;
    }

    cooldowns.set(key, now);

    setTimeout(async () => {
        try {
            const updated = load(id);

            if (!updated.enabled || !updated.users.includes(sender)) {
                return;
            }

            if (
                event.isE2EE &&
                api.e2ee &&
                typeof api.e2ee.sendMessage === "function"
            ) {
                await api.e2ee.sendMessage(
                    event.threadID,
                    updated.message
                );
            } else {
                await api.sendMessage(
                    updated.message,
                    event.threadID
                );
            }

        } catch (error) {
            console.error(
                `[VIP LISTEN ${id}] Send Error:`,
                error.message
            );
        }
    }, data.delay * 1000);
}

module.exports = {
    load,
    save,
    addUser,
    removeUser,
    setMessage,
    setDelay,
    setCooldown,
    setEnabled,
    processIncoming
};
