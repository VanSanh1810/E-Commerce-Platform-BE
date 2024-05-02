const express = require('express');
const route = express.Router();
const uploadI = require('../utils/upload');

const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');

const reviewApi = require('../apis/review.api');

// route.get('/:id', reviewApi.getSingleReview);
// route.patch('/:id', reviewApi.updateReview);
// route.delete('/:id', reviewApi.deleteReview);

route.get('/:id', reviewApi.getSingleReview);
route.get('/product/:productId', reviewApi.getSingleProductReviews);

route.post('/', authenticateUser, uploadI.array('images'), reviewApi.createReview);
route.get('/', reviewApi.getAllReviews);

module.exports = route;
