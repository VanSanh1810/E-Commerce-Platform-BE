const express = require('express');
const route = express.Router();
const uploadI = require('../utils/upload');

const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');

const reviewApi = require('../apis/review.api');
// route.patch('/:id', reviewApi.updateReview);

route.get('/product/:productId', reviewApi.getSingleProductReviews);
route.post('/:id', authenticateUser, authorizePermissions('admin'), reviewApi.deleteReview);
route.get('/:id', reviewApi.getSingleReview);
route.put('/:id', authenticateUser, uploadI.array('images'), reviewApi.updateReview);
route.post('/', authenticateUser, uploadI.array('images'), reviewApi.createReview);
route.get('/', reviewApi.getAllReviews);

module.exports = route;
