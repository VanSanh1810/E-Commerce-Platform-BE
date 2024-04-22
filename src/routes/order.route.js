const express = require('express');
const route = express.Router();
const { authorizePermissions, authenticateUser, authenticateUser2 } = require('../middlewares/authentication');

const orderApi = require('../apis/order.api');

route.get('/vnpay_ipn', orderApi.vnpINP);
route.post('/placeOrder', authenticateUser2, orderApi.placeOrder);

route.get('/:orderId', authenticateUser, orderApi.getSingleOrder);
route.get('/', authenticateUser, orderApi.getAllOrder);

module.exports = route;
