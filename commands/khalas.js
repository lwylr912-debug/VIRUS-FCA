"use strict";

module.exports = {
    name: "خلاص",

    async run({ event, args, send }) {
        if (event.isGroup !== true) {
            return send("❌ هذا الأمر يعمل في المجموعات فقط.");
        }

        if (!args || args[0] !== "ماتو") {
            return;
        }

        const threadID = event.threadID;
        const timer = global.zamasuTimers?.get(threadID);

        if (!timer) {
            return send("⚠️ زاماسو متوقف بالفعل.");
        }

        clearInterval(timer);
        global.zamasuTimers.delete(threadID);

        await send("🛑 تم إيقاف زاماسو!");
    }
};
