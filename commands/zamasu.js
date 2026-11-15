"use strict";

const MESSAGE = "¦ 𝙎  ¦✘¦ 🏴 𝙃  ¦  𝘼  ¦✘¦ 🕳 𝙍  ¦  𝙈¦ 𝙎🌪¦ 𝙎  ¦✘¦ 🏴 𝙃  ¦  𝘼  ¦✘¦ 🕳 𝙍  ¦  𝙈¦ 𝙎🌪¦ 𝙎  ¦✘¦ 🏴 𝙃  ¦  𝘼  ¦✘¦ 🕳 𝙍  ¦  𝙈¦ 𝙎🌪¦ 𝙎  ¦✘¦ 🏴 𝙃  ¦  𝘼  ¦✘¦ 🕳 𝙍  ¦  𝙈¦ 𝙎🌪¦ 𝙎  ¦✘¦ 🏴 𝙃  ¦  𝘼  ¦✘¦ 🕳 𝙍  ¦  𝙈¦ 𝙎🌪";

const INTERVAL = 3 * 60 * 1000;

global.zamasuTimers ??= new Map();

module.exports = {
name: "زاماسو",
description: "تشغيل رسائل زاماسو كل 3 دقائق",

async run({ event, send, accountID }) {
    if (event.isGroup !== true) {
        return send("❌ هذا الأمر يعمل في المجموعات فقط.");
    }

    const key = `${accountID}:${event.threadID}`;

    if (global.zamasuTimers.has(key)) {
        return send("⚠️ زاماسو يعمل بالفعل في هذه المجموعة.");
    }

    await send(MESSAGE);

    const timer = setInterval(async () => {
        try {
            await send(MESSAGE);
        } catch (error) {
            console.error("[ZAMASU]", error);
        }
    }, INTERVAL);

    global.zamasuTimers.set(key, timer);
}

};
