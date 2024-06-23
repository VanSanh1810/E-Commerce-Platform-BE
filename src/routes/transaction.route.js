const express = require('express');
const route = express.Router();

const transactionApi = require('../apis/transaction.api');

route.get('/:transactionId', transactionApi.getTransactionOrders);

module.exports = route;
