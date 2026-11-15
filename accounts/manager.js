"use strict";

const fs = require("fs");
const path = require("path");

const ACCOUNTS_DIR = __dirname;
const MAX_ACCOUNTS = 5;

// قراءة بيانات الحساب
function readAccount(id) {
const file = path.join(
ACCOUNTS_DIR,
"account${id}.json"
);

if (!fs.existsSync(file)) {
    console.log(`⚠️ ملف account${id}.json غير موجود.`);
    return null;
}

try {
    const content = fs.readFileSync(file, "utf8").trim();

    if (!content) {
        console.log(`⚠️ ملف الحساب ${id} فارغ.`);
        return null;
    }

    const appState = JSON.parse(content);

    if (!Array.isArray(appState) || appState.length === 0) {
        console.log(`⚠️ بيانات الحساب ${id} ليست Array صالحة.`);
        return null;
    }

    return appState;

} catch (error) {
    console.error(
        `❌ خطأ في قراءة الحساب ${id}:`,
        error.message
    );

    return null;
}

}

// جلب جميع الحسابات الصالحة من ناحية بنية الملف
function getAccounts() {
const accounts = [];

for (let id = 1; id <= MAX_ACCOUNTS; id++) {
    const appState = readAccount(id);

    if (appState) {
        accounts.push({
            id,
            name: `الحساب ${id}`,
            file: path.join(
                ACCOUNTS_DIR,
                `account${id}.json`
            )
        });
    }
}

console.log(
    `📊 عدد ملفات الحسابات الصالحة بنيوياً: ${accounts.length}`
);

return accounts;

}

// جلب حساب محدد
function getAccount(id) {
const number = Number(id);

if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > MAX_ACCOUNTS
) {
    throw new Error(
        "رقم الحساب يجب أن يكون من 1 إلى 5."
    );
}

const appState = readAccount(number);

if (!appState) {
    throw new Error(
        `الحساب ${number} غير موجود أو ملفه غير صالح.`
    );
}

return {
    id: number,
    name: `الحساب ${number}`,
    appState
};

}

module.exports = {
MAX_ACCOUNTS,
getAccounts,
getAccount
};
