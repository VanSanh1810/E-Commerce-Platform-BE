const express = require('express');
const route = express.Router();

const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');

const statisticsApi = require('../apis/dataStatistics.api');

route.get('/product', authenticateUser, authorizePermissions('admin', 'vendor'), statisticsApi.productStat);
route.get('/user/:userId', authenticateUser, authorizePermissions('admin'), statisticsApi.singleUserStat);
route.get('/user', authenticateUser, authorizePermissions('admin'), statisticsApi.userStat);
route.get('/order', authenticateUser, authorizePermissions('vendor'), statisticsApi.orderStat);
route.get('/review', authenticateUser, authorizePermissions('vendor'), statisticsApi.reviewStat);
route.get('/sale', authenticateUser, authorizePermissions('vendor'), statisticsApi.saleStat);
route.get('/totalProduct', authenticateUser, authorizePermissions('vendor', 'admin'), statisticsApi.totalProduct);
route.get('/totalCate', authenticateUser, authorizePermissions('vendor', 'admin'), statisticsApi.totalCate);
route.get('/avgStar', authenticateUser, authorizePermissions('vendor', 'admin'), statisticsApi.avgStar);
route.get('/userAprBlk', authenticateUser, authorizePermissions('admin'), statisticsApi.userAprBlk);
route.get('/shopStat/:shopId', authenticateUser, authorizePermissions('admin'), statisticsApi.singleShopStat);
route.get('/shopStat', authenticateUser, authorizePermissions('admin'), statisticsApi.shopStat);
route.get('/bannerStat', authenticateUser, authorizePermissions('admin'), statisticsApi.bannerStat);
route.get('/reportStat', authenticateUser, authorizePermissions('admin'), statisticsApi.reportTypeCount);
route.get('/orderTypeCount', authenticateUser, authorizePermissions('vendor', 'admin'), statisticsApi.orderTypeCount);

module.exports = route;
