
"use strict";

function createListener(handler) {
    return async function (accountID, api, event) {
        if (!event || event.type !== "message") return;

        const message = String(event.body || "").trim();

        console.log(
            "[LISTENER DEBUG] " +
            JSON.stringify({
                accountID,
                threadID: event.threadID,
                senderID: event.senderID,
                body: event.body,
                messageLength: message.length
            })
        );

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
