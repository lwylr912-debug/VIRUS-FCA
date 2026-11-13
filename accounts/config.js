"use strict";

module.exports = {
    MAX_ACCOUNTS: 5,

    ACCOUNT_PREFIX: "account",

    ACCOUNT_DIRECTORY: __dirname,

    DEFAULT_ACCOUNT: 1,

    LOGIN_OPTIONS: {
        listenEvents: true
    },

    SESSION_GUARD: {
        interval: 180000,
        debounce: 30000
    }
};
