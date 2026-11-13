"use strict";

function createListener(handler) {
    return async function (accountID, api, event) {
        if (!event || event.type !== "message") return;

        const message = (event.body || "").trim();

        if (!message || !event.threadID || !event.senderID) {
            return;
        }

        try {
            await handler({
                accountID,
                api,
                event,
                message
            });
        } catch (error) {
            console.error(
                `[ACCOUNT ${accountID}] Listener Error:`,
                error
            );
        }
    };
}

module.exports = {
    createListener
};
