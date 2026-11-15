"use strict";

const accountStatus = new Map();

function setStatus(id, status) {
const accountID = Number(id);

accountStatus.set(accountID, {
    id: accountID,
    status,
    updatedAt: Date.now()
});

}

function getStatus(id) {
const accountID = Number(id);

return accountStatus.get(accountID) || {
    id: accountID,
    status: "غير متصل",
    updatedAt: null
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
