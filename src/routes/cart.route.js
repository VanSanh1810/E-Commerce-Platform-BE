const express = require('express');
const route = express.Router();

const cartApi = require('../apis/cart.api');

route.post('/', cartApi.addProductToCart);
route.delete('/', cartApi.deleteProductFromCart);
route.patch('/', cartApi.updateProductQuantity);
// route.post('/logout', authApi.logout);

// route.post('/validate', authApi.validateToken);

module.exports = route;
