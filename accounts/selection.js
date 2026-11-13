"use strict";

const selectedAccounts = new Map();

function selectAccount(userID, accountID) {
    const id = Number(accountID);

    if (!Number.isInteger(id) || id < 1 || id > 5) {
        throw new Error("رقم الحساب يجب أن يكون بين 1 و5.");
    }

    selectedAccounts.set(String(userID), id);

    return id;
}

function getSelectedAccount(userID) {
    return selectedAccounts.get(String(userID)) || 1;
}

function clearSelection(userID) {
    selectedAccounts.delete(String(userID));
}

module.exports = {
    selectAccount,
    getSelectedAccount,
    clearSelection
};
