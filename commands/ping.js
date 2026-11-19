
"use strict";

module.exports = {
    name: "ping",
    description: "قياس سرعة استجابة البوت",

    async run({ send }) {
        const start = Date.now();
        const responseTime = Date.now() - start;

        return send(
            `🏓 PONG!\n⚡ سرعة الاستجابة: ${responseTime} ms`
        );
    }
};
