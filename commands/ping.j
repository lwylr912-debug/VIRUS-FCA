"use strict";

module.exports = {
    name: "ping",
    description: "قياس سرعة استجابة البوت",

    async run({ api, event }) {
        const start = Date.now();

        api.sendMessage(
            `🏓 PONG!\n⚡ سرعة الاستجابة: ${Date.now() - start} ms`,
            event.threadID
        );
    }
};
