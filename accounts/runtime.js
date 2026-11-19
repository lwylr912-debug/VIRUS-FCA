
"use strict";

const login = require("@dongdev/fca-unofficial");

const {
  MAX_ACCOUNTS,
  LOGIN_OPTIONS
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
      activeAccounts.delete(id);
      setStatus(id, "غير جاهز");
      console.log(`⚠️ الحساب ${id}: ${error.message}`);
      return resolve(null);
    }

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
        (err, api) => {
          if (err || !api) {
            activeAccounts.delete(id);
            setStatus(id, "فشل تسجيل الدخول");
            console.error(
              `❌ الحساب ${id}:`,
              err || "لا يوجد اتصال"
            );
            return finish(null);
          }

          try {
            if (typeof api.listenMqtt !== "function") {
              throw new Error("المكتبة لا توفر listenMqtt.");
            }

            api.listenMqtt((error, event) => {
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

              Promise.resolve()
                .then(() => onEvent(id, api, event))
                .catch((eventError) => {
                  console.error(
                    `❌ معالجة رسالة الحساب ${id}:`,
                    eventError
                  );
                });
            });

            activeAccounts.set(id, api);
            setStatus(id, "متصل");

            console.log(`🟢 الحساب ${id} متصل عبر MQTT`);

            finish(api);
          } catch (error) {
            activeAccounts.delete(id);
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
      activeAccounts.delete(id);
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
