const express = require('express');
const route = express.Router();
const uploadI = require('../utils/upload');

const { authenticateUser, authorizePermissions, authenticateUser2 } = require('../middlewares/authentication');

const bannerApi = require('../apis/banner.api');

// route.get('/:id', cateApi.getSingleCategory);
// route.patch('/:id', authenticateUser, authorizePermissions('admin'), cateApi.updateCategory);

route.get('/details/:cateId', bannerApi.getBannerDetail);
route.delete('/:bannerId', authenticateUser, authorizePermissions('admin'), bannerApi.deleteBanner);
route.post('/:bannerId', authenticateUser, authorizePermissions('admin'), uploadI.single('images'), bannerApi.updateBanner);
route.get('/', authenticateUser2, bannerApi.getAllBanner);
route.post('/', authenticateUser, authorizePermissions('admin'), uploadI.single('images'), bannerApi.createBanner);

module.exports = route;
