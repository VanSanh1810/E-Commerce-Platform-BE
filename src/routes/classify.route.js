const express = require('express');
const route = express.Router();

const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');

const classifyApi = require('../apis/classify.api');

// route.get('/:id', cateApi.getSingleCategory);
route.patch('/:classifyId', authenticateUser, authorizePermissions('admin', 'vendor'), classifyApi.updateClassify);
route.delete('/:classifyId', authenticateUser, authorizePermissions('admin', 'vendor'), classifyApi.deleteClassify);

route.get('/:shopId', classifyApi.getShopClassify);
route.post('/', authenticateUser, authorizePermissions('admin', 'vendor'), classifyApi.createClassify);

module.exports = route;
