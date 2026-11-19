
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
    const file = getFile(id);

    try {
        if (!fs.existsSync(file)) {
            save(id, { ...DEFAULT, users: [] });
            return { ...DEFAULT, users: [] };
        }

        const data = JSON.parse(
            fs.readFileSync(file, "utf8")
        );

        return {
            ...DEFAULT,
            ...data,
            users: Array.isArray(data.users)
                ? data.users.map(String)
                : []
        };

    } catch (error) {
        console.error("VIP LISTEN:", error.message);
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
    const data = load(id);
    data.message = String(message);
    save(id, data);
}

function setDelay(id, seconds) {
    seconds = Number(seconds);

    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 3600) {
        throw new Error("التأخير يجب أن يكون بين 0 و3600 ثانية.");
    }

    const data = load(id);
    data.delay = seconds;
    save(id, data);
}

function setCooldown(id, seconds) {
    seconds = Number(seconds);

    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 86400) {
        throw new Error("وقت الانتظار يجب أن يكون بين 0 و86400 ثانية.");
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

function processIncoming(id, api, event) {
    if (!event || !event.senderID || !event.threadID) {
        return;
    }

    // تجاهل رسائل المجموعات إذا حددت المكتبة أنها مجموعة
    if (event.isGroup === true) {
        return;
    }

    // عند غياب معلومة نوع المحادثة نستخدم فحص المعرفات
    if (
        event.isGroup !== false &&
        String(event.threadID) !== String(event.senderID)
    ) {
        return;
    }

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

    // منع تكرار الرد خلال فترة الانتظار
    cooldowns.set(key, now);

    setTimeout(async () => {
        try {
            const updated = load(id);

            if (
                !updated.enabled ||
                !updated.users.includes(sender)
            ) {
                return;
            }

            await api.sendMessage(
                String(updated.message),
                String(event.threadID)
            );

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
