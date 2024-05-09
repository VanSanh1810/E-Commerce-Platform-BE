const express = require('express');
const route = express.Router();
const uploadI = require('../utils/upload');

const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');

const reportApi = require('../apis/report.api');

// route.get('/:id', reviewApi.getSingleReview);
// route.patch('/:id', reviewApi.updateReview);
// route.delete('/:id', reviewApi.deleteReview);

// route.get('/product/:productId', reviewApi.getSingleProductReviews);
route.post('/:reportId', authenticateUser, authorizePermissions('admin'), reportApi.markAtReadReport);
route.post('/', authenticateUser, reportApi.pushReport);
route.get('/', authenticateUser, authorizePermissions('admin'), reportApi.getAllReports);

module.exports = route;
