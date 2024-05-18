const { createJWT, isTokenValid, attachCookiesToResponse } = require('./jwt.util');
const createUserToken = require('./createUserToken.util');
const checkPermissions = require('./checkPerm.util');
const arraysAreEqual = require('./arrAreEqual');
const addTagHistory = require('./addHistoryProduct');

module.exports = {
    createJWT,
    isTokenValid,
    attachCookiesToResponse,
    createUserToken,
    checkPermissions,
    arraysAreEqual,
    addTagHistory,
};
