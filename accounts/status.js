"use strict";

const accountStatus = new Map();

function setStatus(id, status, api = null) {
    accountStatus.set(Number(id), {
        id: Number(id),
        status,
        api,
        updatedAt: Date.now()
    });
}

function getStatus(id) {
    return accountStatus.get(Number(id)) || {
        id: Number(id),
        status: "غير متصل",
        api: null
    };
}

function getAllStatus() {
    return Array.from({ length: 5 }, (_, index) => {
        return getStatus(index + 1);
    });
}

module.exports = {
    setStatus,
    getStatus,
    getAllStatus
};
