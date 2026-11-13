"use strict";

const fs = require("fs");
const path = require("path");

const ACCOUNTS_DIR = __dirname;
const MAX_ACCOUNTS = 5;

function getAccounts() {
    const files = fs.readdirSync(ACCOUNTS_DIR)
        .filter(file => /^account[1-5]\.json$/i.test(file));

    return files.map(file => {
        const number = Number(file.match(/\d+/)[0]);

        return {
            id: number,
            name: `الحساب ${number}`,
            file: path.join(ACCOUNTS_DIR, file)
        };
    }).sort((a, b) => a.id - b.id);
}

function getAccount(id) {
    const number = Number(id);

    if (!Number.isInteger(number) || number < 1 || number > MAX_ACCOUNTS) {
        throw new Error("رقم الحساب يجب أن يكون من 1 إلى 5.");
    }

    const file = path.join(
        ACCOUNTS_DIR,
        `account${number}.json`
    );

    if (!fs.existsSync(file)) {
        throw new Error(`ملف الحساب ${number} غير موجود.`);
    }

    const appState = JSON.parse(
        fs.readFileSync(file, "utf8")
    );

    if (!Array.isArray(appState) || appState.length === 0) {
        throw new Error(`ملف الحساب ${number} غير صالح.`);
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
