"use strict";

const { getApi } = require("./runtime");
const { getSelectedAccount } = require("./selection");
const { getStatus } = require("./status");

function getSelectedApi(userID) {
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
