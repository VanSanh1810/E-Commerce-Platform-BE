const express = require('express');
const route = express.Router();
const uploadI = require('../utils/upload');

const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');

const shopApi = require('../apis/shop.api');

route.get('/:id', shopApi.getSingleShops);
route.patch('/:id', authenticateUser, authorizePermissions('admin'), shopApi.changeShopStatus);
route.get('/', shopApi.getAllShops);
route.post('/', authenticateUser, authorizePermissions('vendor', 'admin'), uploadI.single('images'), shopApi.updateSingleShop);

// route.get('/', authenticateUser, authorizePermissions('admin'), userApi.getAllUsers);

module.exports = route;
