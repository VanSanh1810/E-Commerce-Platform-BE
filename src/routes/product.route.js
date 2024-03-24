const express = require('express');
const route = express.Router();
const uploadI = require('../utils/upload');

const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');

const productApi = require('../apis/product.api');

// route.get('/:id', cateApi.getSingleCategory);
// route.patch('/:id', authenticateUser, authorizePermissions('admin'), cateApi.updateCategory);
// route.delete('/:id', authenticateUser, authorizePermissions('admin'), cateApi.deleteCategory);

// route.get('/', cateApi.getAllCategories);
// route.post('/', authenticateUser, authorizePermissions('admin'), cateApi.createCategory);

route.post('/', authenticateUser, authorizePermissions('admin'), uploadI.array('images'), productApi.createProduct);
route.get('/', productApi.getAllProducts);

route.get('/:id', productApi.getSingleProduct);
route.patch('/:id', authenticateUser, authorizePermissions('admin'), uploadI.array('images'), productApi.updateProduct);
route.delete('/:id', authenticateUser, authorizePermissions('admin'), productApi.deleteProduct);

module.exports = route;
