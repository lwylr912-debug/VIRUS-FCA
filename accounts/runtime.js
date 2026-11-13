"use strict";

const fs = require("fs");
const path = require("path");
const login = require("fca-riyad");

const { MAX_ACCOUNTS } = require("./config");
const { getAccount } = require("./manager");
const { setStatus } = require("./status");

const activeAccounts = new Map();

function startAccount(id, onEvent) {
    return new Promise((resolve) => {
        let account;

        try {
            account = getAccount(id);
        } catch (error) {
            setStatus(id, "غير جاهز");
            console.log(`⚠️ الحساب ${id}: ${error.message}`);
            return resolve(null);
        }

        const sessionFile = path.join(
            __dirname,
            `account${id}.json`
        );

        login(
            { appState: account.appState },
            {
                listenEvents: true,
                autoReconnect: true
            },
            async (err, api) => {
                if (err || !api) {
                    setStatus(id, "فشل تسجيل الدخول");
                    console.error(`❌ الحساب ${id}:`, err || "لا يوجد اتصال");
                    return resolve(null);
                }

                try {
                    api.sessionGuard(sessionFile, {
                        interval: 3 * 60 * 1000,
                        debounce: 30 * 1000
                    });

                    try {
                        await api.connectE2EE();
                    } catch (error) {
                        console.error(
                            `⚠️ E2EE للحساب ${id}:`,
                            error.message
                        );
                    }

                    api.listenE2EE((error, event) => {
                        if (error) {
                            console.error(
                                `❌ استقبال الحساب ${id}:`,
                                error
                            );
                            return;
                        }

                        if (!event || event.type !== "message") {
                            return;
                        }

                        onEvent(id, api, event);
                    });

                    activeAccounts.set(id, api);
                    setStatus(id, "متصل", api);

                    console.log(`🟢 الحساب ${id} متصل`);
                    resolve(api);

                } catch (error) {
                    setStatus(id, "خطأ في التهيئة");
                    console.error(`❌ الحساب ${id}:`, error);
                    resolve(null);
                }
            }
        );
    });
}

async function startAll(onEvent) {
    const results = [];

    for (let id = 1; id <= MAX_ACCOUNTS; id++) {
        const api = await startAccount(id, onEvent);
        results.push({ id, connected: Boolean(api) });
    }

    return results;
}

function getApi(id) {
    return activeAccounts.get(Number(id)) || null;
}

module.exports = {
    startAll,
    getApi,
    activeAccounts
};
