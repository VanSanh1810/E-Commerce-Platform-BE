const express = require('express');
const route = express.Router();
const uploadI = require('../utils/upload');

const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');

const shopApi = require('../apis/shop.api');

route.patch('/', authenticateUser, authorizePermissions('vendor'), shopApi.updateSingleShop);

route.get('/:id', shopApi.getSingleShops);
route.get('/', shopApi.getAllShops);

// route.get('/', authenticateUser, authorizePermissions('admin'), userApi.getAllUsers);

module.exports = route;
