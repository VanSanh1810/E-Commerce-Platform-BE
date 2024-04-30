const express = require('express');
const route = express.Router();

const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');

const statisticsApi = require('../apis/dataStatistics.api');

route.get('/product', authenticateUser, authorizePermissions('admin', 'vendor'), statisticsApi.productStat);
route.get('/user', authenticateUser, authorizePermissions('admin'), statisticsApi.userStat);
// route.patch('/:classifyId', authenticateUser, authorizePermissions('admin', 'vendor'), classifyApi.updateClassify);
// route.delete('/:classifyId', authenticateUser, authorizePermissions('admin', 'vendor'), classifyApi.deleteClassify);

// route.get('/:shopId', classifyApi.getShopClassify);
// route.post('/', authenticateUser, authorizePermissions('admin', 'vendor'), classifyApi.createClassify);

module.exports = route;
