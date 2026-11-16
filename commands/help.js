"use strict";

module.exports = {
    name: "help",
    description: "عرض قائمة أوامر البوت",

    async run({ send, isPrivileged }) {
        let message =
            "╔═══『 ⚡ VIRUS-FCA 』═══╗\n\n" +
            "📌 الأوامر المتاحة:\n\n" +
            "🏓 !ping — سرعة البوت\n" +
            "⏱️ !uptime — مدة التشغيل\n" +
            "⚡ !power — التحكم عن بعد\n" +
            "👑 !زاماسو — تشغيل زاماسو\n" +
            "🛑 !خلاص ماتو — إيقاف زاماسو\n";

        if (isPrivileged) {
            message +=
                "\n👑 أوامر المالك والأدمن:\n\n" +
                "!accounts — عرض الحسابات\n" +
                "!select 1 — اختيار حساب\n" +
                "!damon تشغيل — تشغيل DAMON\n" +
                "!damon ايقاف — إيقاف DAMON\n" +
                "!damon رسالة النص — تغيير الرسالة\n" +
                "!damon وقت 5 — ضبط التوقيت\n" +
                "!damon حالة — عرض الحالة\n";
        }

        message += "\n╚══════════════════════╝";

        return send(message);
    }
};
