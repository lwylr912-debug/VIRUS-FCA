"use strict";

module.exports = {
    name: "uptime",
    description: "عرض مدة تشغيل البوت",

    async run({ send }) {
        const uptime = Math.floor(process.uptime());

        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;

        const message =
            `╔═══『 ♛ VIRUS-FCA 』═══╗\n\n` +
            `🟢 الحالة: يعمل\n` +
            `⏱️ مدة التشغيل:\n` +
            `📅 الأيام: ${days}\n` +
            `🕐 الساعات: ${hours}\n` +
            `⏳ الدقائق: ${minutes}\n` +
            `⚡ الثواني: ${seconds}\n\n` +
            `╚══════════════════╝`;

        await send(message);
    }
};
