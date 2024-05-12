const express = require('express');
const route = express.Router();
const uploadI = require('../utils/upload');

const { authenticateUser, authorizePermissions, authenticateUser2 } = require('../middlewares/authentication');

const productApi = require('../apis/product.api');

// route.get('/:id', cateApi.getSingleCategory);
// route.patch('/:id', authenticateUser, authorizePermissions('admin'), cateApi.updateCategory);
// route.delete('/:id', authenticateUser, authorizePermissions('admin'), cateApi.deleteCategory);

// route.get('/', cateApi.getAllCategories);
// route.post('/', authenticateUser, authorizePermissions('admin'), cateApi.createCategory);
route.get('/related/:productId', productApi.relatedProducts);
route.post('/disable/:id', authenticateUser, authorizePermissions('admin'), productApi.disableProduct);
route.get('/:id', productApi.getSingleProduct);
route.post('/:id', authenticateUser, authorizePermissions('admin', 'vendor'), uploadI.array('images'), productApi.updateProduct);
route.delete('/:id', authenticateUser, authorizePermissions('admin', 'vendor'), productApi.deleteProduct);

route.post('/', authenticateUser, authorizePermissions('admin', 'vendor'), uploadI.array('images'), productApi.createProduct);
route.get('/', authenticateUser2, productApi.getAllProducts);

module.exports = route;
