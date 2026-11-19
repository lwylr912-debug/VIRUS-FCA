"use strict";

const listen = require("../accounts/listen-system");

module.exports = {
    name: "listen",

    async run({ args, send, accountID, isPrivileged }) {
        if (!isPrivileged) {
            return send("❌ هذا الأمر للمالك والأدمن فقط.");
        }

        const action = (args[0] || "").toLowerCase();
        const value = args.slice(1).join(" ").trim();

        try {
            if (action === "on") {
                listen.setEnabled(accountID, true);
                return send("🟢 تم تشغيل VIP LISTEN.");
            }

            if (action === "off") {
                listen.setEnabled(accountID, false);
                return send("🔴 تم إيقاف VIP LISTEN.");
            }

            if (action === "add") {
                listen.addUser(accountID, value);
                return send(`✅ تمت إضافة ID: ${value}`);
            }

            if (action === "remove") {
                listen.removeUser(accountID, value);
                return send(`✅ تمت إزالة ID: ${value}`);
            }

            if (action === "message") {
                if (!value) {
                    return send("❌ اكتب نص الرسالة.");
                }

                listen.setMessage(accountID, value);
                return send("✅ تم تغيير رسالة الاستماع.");
            }

            if (action === "time") {
                const seconds = Number(value);

                if (!Number.isInteger(seconds) ||
                    seconds < 0 || seconds > 3600) {
                    return send("❌ الوقت من 0 إلى 3600 ثانية.");
                }

                listen.setDelay(accountID, seconds);
                return send(`⏱️ تم ضبط الانتظار: ${seconds} ثانية.`);
            }

            if (action === "cooldown") {
                const seconds = Number(value);

                if (!Number.isInteger(seconds) ||
                    seconds < 0 || seconds > 86400) {
                    return send("❌ المدة من 0 إلى 86400 ثانية.");
                }

                listen.setCooldown(accountID, seconds);
                return send(`✅ تم ضبط منع التكرار: ${seconds} ثانية.`);
            }

            if (action === "list") {
                const data = listen.load(accountID);

                return send(
                    "👥 قائمة VIP LISTEN:\n\n" +
                    (data.users.length
                        ? data.users.map((id, i) =>
                            `${i + 1}. ${id}`
                        ).join("\n")
                        : "القائمة فارغة.")
                );
            }

            if (action === "status") {
                const data = listen.load(accountID);

                return send(
                    "╔══『 VIP LISTEN 』══╗\n" +
                    `الحساب: ${accountID}\n` +
                    `الحالة: ${data.enabled ? "🟢 يعمل" : "🔴 متوقف"}\n` +
                    `عدد الأشخاص: ${data.users.length}\n` +
                    `الانتظار: ${data.delay} ثانية\n` +
                    `منع التكرار: ${data.cooldown} ثانية\n` +
                    `الرسالة: ${data.message}\n` +
                    "╚══════════════════╝"
                );
            }

            return send(
                "⚙️ أوامر VIP LISTEN:\n\n" +
                "!listen add ID\n" +
                "!listen remove ID\n" +
                "!listen message النص\n" +
                "!listen time 30\n" +
                "!listen cooldown 300\n" +
                "!listen on\n" +
                "!listen off\n" +
                "!listen list\n" +
                "!listen status"
            );

        } catch (error) {
            return send("❌ " + error.message);
        }
    }
};
