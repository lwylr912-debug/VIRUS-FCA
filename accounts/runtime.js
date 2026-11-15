"use strict";

const path = require("path");
const login = require("fca-riyad");

const {
    MAX_ACCOUNTS,
    LOGIN_OPTIONS,
    SESSION_GUARD
} = require("./config");

const { getAccount, getAccounts } = require("./manager");
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

        let finished = false;

        function finish(api) {
            if (finished) return;
            finished = true;
            resolve(api);
        }

        try {
            login(
                { appState: account.appState },
                {
                    ...LOGIN_OPTIONS,
                    listenEvents: true,
                    autoReconnect: true
                },
                async (err, api) => {
                    if (err || !api) {
                        setStatus(id, "فشل تسجيل الدخول");

                        console.error(
                            `❌ الحساب ${id}:`,
                            err || "لا يوجد اتصال"
                        );

                        return finish(null);
                    }

                    try {
                        if (typeof api.sessionGuard === "function") {
                            api.sessionGuard(sessionFile, {
                                ...SESSION_GUARD
                            });
                        }

                        if (typeof api.connectE2EE === "function") {
                            try {
                                await api.connectE2EE();
                            } catch (error) {
                                console.error(
                                    `⚠️ E2EE للحساب ${id}:`,
                                    error.message
                                );
                            }
                        }

                        if (typeof api.listenE2EE !== "function") {
                            throw new Error(
                                "المكتبة لا توفر listenE2EE."
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

                            Promise.resolve(
                                onEvent(id, api, event)
                            ).catch((eventError) => {
                                console.error(
                                    `❌ معالجة رسالة الحساب ${id}:`,
                                    eventError
                                );
                            });
                        });

                        activeAccounts.set(id, api);
                        setStatus(id, "متصل");

                        console.log(`🟢 الحساب ${id} متصل`);

                        finish(api);

                    } catch (error) {
                        setStatus(id, "خطأ في التهيئة");

                        console.error(
                            `❌ تهيئة الحساب ${id}:`,
                            error
                        );

                        finish(null);
                    }
                }
            );
        } catch (error) {
            setStatus(id, "فشل تسجيل الدخول");

            console.error(
                `❌ تشغيل الحساب ${id}:`,
                error
            );

            finish(null);
        }
    });
}

async function startAll(onEvent) {
    if (typeof onEvent !== "function") {
        throw new Error("يجب توفير دالة استقبال الرسائل.");
    }

    const accounts = getAccounts()
        .filter(account => account.id <= MAX_ACCOUNTS);

    if (accounts.length === 0) {
        console.log("⚠️ لم يتم العثور على حسابات صالحة.");
        return [];
    }

    const results = [];

    for (const account of accounts) {
        const api = await startAccount(account.id, onEvent);

        results.push({
            id: account.id,
            connected: Boolean(api)
        });
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
