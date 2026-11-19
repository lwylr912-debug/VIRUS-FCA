
"use strict";

const fs = require("fs");
const path = require("path");

const { getApi } = require("./runtime");
const { getSelectedAccount } = require("./selection");
const { getStatus } = require("./status");

const ADMINS_FILE = path.join(__dirname, "..", "admins.json");

function isAdmin(userID) {
    try {
        if (!fs.existsSync(ADMINS_FILE)) return false;

        const data = JSON.parse(
            fs.readFileSync(ADMINS_FILE, "utf8")
        );

        if (!data || !Array.isArray(data.admins)) return false;

        return data.admins.map(String).includes(String(userID));
    } catch (error) {
        console.error("Controller Admin Error:", error.message);
        return false;
    }
}

function getSelectedApi(userID, ownerID) {
    const authorized =
        String(userID) === String(ownerID) ||
        isAdmin(userID);

    if (!ownerID || !authorized) {
        throw new Error("ليس لديك صلاحية التحكم بالحسابات.");
    }

    const accountID = getSelectedAccount(userID);
    const status = getStatus(accountID);

    if (status.status !== "متصل") {
        throw new Error(`الحساب ${accountID} غير متصل.`);
    }

    const api = getApi(accountID);

    if (!api) {
        throw new Error(`اتصال الحساب ${accountID} غير متاح.`);
    }

    return {
        accountID,
        api
    };
}

module.exports = {
    getSelectedApi
};
