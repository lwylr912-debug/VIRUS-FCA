"use strict";

const OWNER_ID = process.env.OWNER_ID || "";

module.exports = {
    name: "power",
    description: "التحكم عن بعد في محادثات البوت",

    async run({ api, event, args, send }) {
        const senderID = String(event.senderID);
        const threadID = String(event.threadID);

        // المالك فقط
        if (!OWNER_ID || senderID !== OWNER_ID) {
            return send("⛔ ليس لديك صلاحية استعمال POWER.");
        }

        // التحكم من الخاص فقط
        if (threadID !== senderID) {
            return send("❌ استعمل POWER من الخاص مع البوت.");
        }

        const action = (args[0] || "").toLowerCase();

        if (!action) {
            return send(
                "╔═══『 ⚡ POWER 』═══╗\n\n" +
                "📌 أوامر التحكم:\n\n" +
                "!power groups\n" +
                "!power chats\n" +
                "!power info ID\n" +
                "!power send ID الرسالة\n" +
                "!power name ID الاسم\n\n" +
                "╚══════════════════╝"
            );
        }

        try {
            // عرض المجموعات
            if (action === "groups") {
                const list = await api.getThreadList(100, null, ["INBOX"]);

                const groups = list.filter(item =>
                    item.isGroup === true ||
                    (item.participantIDs && item.participantIDs.length > 2)
                );

                if (!groups.length) {
                    return send("❌ لم يتم العثور على مجموعات.");
                }

                let output = "╔═══『 👥 GROUPS 』═══╗\n\n";

                groups.slice(0, 40).forEach((group, index) => {
                    output +=
                        `${index + 1}. ${group.name || "بدون اسم"}\n` +
                        `🆔 ${group.threadID}\n\n`;
                });

                output += `📊 العدد: ${groups.length}\n`;
                output += "╚══════════════════╝";

                return send(output);
            }

            // عرض المحادثات الخاصة
            if (action === "chats") {
                const list = await api.getThreadList(100, null, ["INBOX"]);

                const chats = list.filter(item =>
                    item.isGroup === false ||
                    (item.participantIDs && item.participantIDs.length <= 2)
                );

                if (!chats.length) {
                    return send("❌ لم يتم العثور على محادثات خاصة.");
                }

                let output = "╔═══『 💬 PRIVATE 』═══╗\n\n";

                chats.slice(0, 40).forEach((chat, index) => {
                    output +=
                        `${index + 1}. ${chat.name || "محادثة خاصة"}\n` +
                        `🆔 ${chat.threadID}\n\n`;
                });

                output += `📊 العدد: ${chats.length}\n`;
                output += "╚══════════════════╝";

                return send(output);
            }

            // معلومات محادثة
            if (action === "info") {
                const targetID = args[1];

                if (!targetID) {
                    return send("❌ الاستعمال: !power info ID");
                }

                const info = await api.getThreadInfo(targetID);

                return send(
                    `╔═══『 📋 INFO 』═══╗\n\n` +
                    `الاسم: ${info.threadName || info.name || "بدون اسم"}\n` +
                    `🆔 ID: ${info.threadID || targetID}\n` +
                    `👥 الأعضاء: ${info.participantIDs?.length || 0}\n` +
                    `╚══════════════════╝`
                );
            }

            // إرسال رسالة إلى محادثة
            if (action === "send") {
                const targetID = args[1];
                const text = args.slice(2).join(" ");

                if (!targetID || !text) {
                    return send("❌ الاستعمال:\n!power send ID الرسالة");
                }

                await api.sendMessage(text, targetID);

                return send("✅ تم إرسال الرسالة إلى المحادثة المطلوبة.");
            }

            // تغيير اسم مجموعة
            if (action === "name") {
                const targetID = args[1];
                const newName = args.slice(2).join(" ");

                if (!targetID || !newName) {
                    return send("❌ الاستعمال:\n!power name ID الاسم");
                }

                await api.setTitle(newName, targetID);

                return send("✅ تم إرسال طلب تغيير اسم المجموعة.");
            }

            return send(
                "❌ أمر غير معروف.\n" +
                "اكتب !power لعرض قائمة الأوامر."
            );

        } catch (error) {
            console.error("[POWER ERROR]", error);

            return send(
                "❌ تعذر تنفيذ العملية.\n" +
                `السبب: ${error.message || "خطأ غير معروف"}`
            );
        }
    }
};
