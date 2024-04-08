const express = require('express');
const route = express.Router();

const cartApi = require('../apis/cart.api');

const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');

route.delete('/', authenticateUser, authorizePermissions('user', 'vendor'), cartApi.clearCart);
route.post('/', authenticateUser, authorizePermissions('user', 'vendor'), cartApi.addProductToCart);
route.put('/', authenticateUser, authorizePermissions('user', 'vendor'), cartApi.deleteProductFromCart);
route.patch('/', authenticateUser, authorizePermissions('user', 'vendor'), cartApi.updateProductQuantity);

module.exports = route;
