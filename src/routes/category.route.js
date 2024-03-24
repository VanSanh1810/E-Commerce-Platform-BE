const express = require('express');
const route = express.Router();

const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');

const cateApi = require('../apis/category.api');

route.get('/:id', cateApi.getSingleCategory);
route.patch('/:id', authenticateUser, authorizePermissions('admin'), cateApi.updateCategory);
route.delete('/:id', authenticateUser, authorizePermissions('admin'), cateApi.deleteCategory);

route.get('/', cateApi.getAllCategories);
route.post('/', authenticateUser, authorizePermissions('admin'), cateApi.createCategory);

module.exports = route;
