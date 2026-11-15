"use strict";

module.exports = {
name: "خلاص",
description: "إيقاف رسائل زاماسو",

async run({ event, args, send, accountID }) {
    if (event.isGroup !== true) {
        return send("❌ هذا الأمر يعمل في المجموعات فقط.");
    }

    if (!args || args[0] !== "ماتو") {
        return send("⚠️ استخدم: !خلاص ماتو");
    }

    const key = `${accountID}:${event.threadID}`;
    const timer = global.zamasuTimers?.get(key);

    if (!timer) {
        return send("⚠️ زاماسو متوقف بالفعل.");
    }

    clearInterval(timer);
    global.zamasuTimers.delete(key);

    await send("🛑 تم إيقاف زاماسو!");
}

};
