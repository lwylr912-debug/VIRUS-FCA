"use strict";

const OWNER_ID = String(process.env.OWNER_ID || "");

module.exports = {
name: "power",
description: "التحكم عن بعد باستخدام الحساب المختار",

async run({ api, event, args, send, accountID }) {
    const senderID = String(event.senderID);
    const threadID = String(event.threadID);

    if (!OWNER_ID || senderID !== OWNER_ID) {
        return send("⛔ ليس لديك صلاحية استعمال POWER.");
    }

    if (threadID !== senderID) {
        return send("❌ استعمل POWER من الخاص مع البوت.");
    }

    if (!api || !accountID) {
        return send("❌ لم يتم تحديد حساب صالح.");
    }

    const action = (args[0] || "").toLowerCase();

    if (!action) {
        return send(
            `╔═══『 ⚡ POWER 』═══╗\n\n` +
            `الحساب المختار: ${accountID}\n\n` +
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
        if (action === "groups") {
            const list = await api.getThreadList(100, null, ["INBOX"]);

            const groups = list.filter(item =>
                item.isGroup === true ||
                (item.participantIDs && item.participantIDs.length > 2)
            );

            if (!groups.length) {
                return send("❌ لم يتم العثور على مجموعات.");
            }

            let output = `╔═══『 👥 GROUPS 』═══╗\n`;
            output += `الحساب: ${accountID}\n\n`;

            groups.slice(0, 40).forEach((group, index) => {
                output +=
                    `${index + 1}. ${group.name || "بدون اسم"}\n` +
                    `🆔 ${group.threadID}\n\n`;
            });

            output += `📊 العدد: ${groups.length}\n`;
            output += "╚══════════════════╝";

            return send(output);
        }

        if (action === "chats") {
            const list = await api.getThreadList(100, null, ["INBOX"]);

            const chats = list.filter(item =>
                item.isGroup === false ||
                (item.participantIDs && item.participantIDs.length <= 2)
            );

            if (!chats.length) {
                return send("❌ لم يتم العثور على محادثات خاصة.");
            }

            let output = `╔═══『 💬 PRIVATE 』═══╗\n`;
            output += `الحساب: ${accountID}\n\n`;

            chats.slice(0, 40).forEach((chat, index) => {
                output +=
                    `${index + 1}. ${chat.name || "محادثة خاصة"}\n` +
                    `🆔 ${chat.threadID}\n\n`;
            });

            output += `📊 العدد: ${chats.length}\n`;
            output += "╚══════════════════╝";

            return send(output);
        }

        if (action === "info") {
            const targetID = args[1];

            if (!targetID) {
                return send("❌ الاستعمال: !power info ID");
            }

            const info = await api.getThreadInfo(targetID);

            return send(
                `╔═══『 📋 INFO 』═══╗\n\n` +
                `الحساب: ${accountID}\n` +
                `الاسم: ${info.threadName || info.name || "بدون اسم"}\n` +
                `🆔 ID: ${info.threadID || targetID}\n` +
                `👥 الأعضاء: ${info.participantIDs?.length || 0}\n` +
                `╚══════════════════╝`
            );
        }

        if (action === "send") {
            const targetID = args[1];
            const text = args.slice(2).join(" ");

            if (!targetID || !text) {
                return send("❌ الاستعمال:\n!power send ID الرسالة");
            }

            await api.sendMessage(text, targetID);

            return send("✅ تم إرسال الرسالة من الحساب المختار.");
        }

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
            "❌ أمر غير معروف.\nاكتب !power لعرض قائمة الأوامر."
        );

    } catch (error) {
        console.error(`[POWER ACCOUNT ${accountID}]`, error);

        return send(
            "❌ تعذر تنفيذ العملية.\n" +
            `السبب: ${error.message || "خطأ غير معروف"}`
        );
    }
}

};
