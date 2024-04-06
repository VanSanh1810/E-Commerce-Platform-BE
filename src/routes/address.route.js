const express = require('express');
const route = express.Router();

const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');

const addressApi = require('../apis/address.api');

route.get('/:id', authenticateUser, addressApi.getAddress);
route.get('/shop/:id', authenticateUser, addressApi.getShopAddress);
// route.patch('/:id', authenticateUser, authorizePermissions('admin'), cateApi.updateCategory);
// route.delete('/:id', authenticateUser, authorizePermissions('admin'), cateApi.deleteCategory);

// route.get('/', cateApi.getAllCategories);
route.patch('/:id', authenticateUser, authorizePermissions('user', 'vendor'), addressApi.updateAddress);
route.delete('/:id', authenticateUser, authorizePermissions('user', 'vendor'), addressApi.deleteAddress);
route.post('/', authenticateUser, authorizePermissions('user', 'vendor'), addressApi.addAddress);

module.exports = route;
