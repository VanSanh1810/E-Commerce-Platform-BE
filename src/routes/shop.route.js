const express = require('express');
const route = express.Router();
const uploadI = require('../utils/upload');

const { authenticateUser, authorizePermissions, authenticateUser2 } = require('../middlewares/authentication');

const shopApi = require('../apis/shop.api');

route.put('/follow/:id', authenticateUser, shopApi.followShop);
route.get('/:id', authenticateUser2, shopApi.getSingleShops);
route.patch('/:id', authenticateUser, authorizePermissions('admin', 'vendor'), shopApi.changeShopStatus);
route.get('/', shopApi.getAllShops);
route.post('/', authenticateUser, authorizePermissions('vendor', 'admin'), uploadI.single('images'), shopApi.updateSingleShop);

// route.get('/', authenticateUser, authorizePermissions('admin'), userApi.getAllUsers);

module.exports = route;
