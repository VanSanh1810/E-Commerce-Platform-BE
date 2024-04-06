const express = require('express');
const route = express.Router();
const uploadI = require('../utils/upload');

const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');

const shopApi = require('../apis/shop.api');

// route.patch('/updateUserPassword', authenticateUser, userApi.updateUserPassword);

route.get('/', shopApi.getAllShops);
// route.patch('/:id', authenticateUser, userApi.updateUserData);

// route.get('/', authenticateUser, authorizePermissions('admin'), userApi.getAllUsers);

module.exports = route;
