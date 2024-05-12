const express = require('express');
const route = express.Router();
const uploadI = require('../utils/upload');

const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');

const notifyApi = require('../apis/notification.api');

// route.get('/:id', reviewApi.getSingleReview);
// route.patch('/:id', reviewApi.updateReview);
// route.delete('/:id', reviewApi.deleteReview);

// route.get('/product/:productId', reviewApi.getSingleProductReviews);
route.get('/', authenticateUser, authorizePermissions('admin', 'vendor'), notifyApi.getAllNotify);
route.post('/', authenticateUser, authorizePermissions('admin', 'vendor'), notifyApi.markAtReadNotify);
route.delete('/:notiId', authenticateUser, authorizePermissions('admin', 'vendor'), notifyApi.deleteNotify);

module.exports = route;
