const Review = require('../models/review.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const { checkPermissions } = require('../utils');
const path = require('path');
const Order = require('../models/order.model');

// ** ===================  CREATE REVIEW  ===================
const createReview = async (req, res) => {
    const { rating, comment, orderId, productId, variant, productIndex } = req.body;
    const images = req.files;

    try {
        const review = new Review();
        review.rating = parseInt(rating);
        review.comment = comment;
        const imageData = images.map((image) => {
            return {
                url: `http://localhost:4000/public/uploads/${path.basename(image.path)}`, // Tạo URL cục bộ cho hình ảnh dựa trên đường dẫn tạm thời
            };
        });
        review.images = [...imageData];
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: 'No user found' });
        }
        review.user = user._id;
        review.name = user.name;
        review.product = productId;
        if (variant) {
            review.variant = [...JSON.parse(variant)];
        } else {
            review.variant = [];
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: 'No order found' });
        }
        const listItemsInOrder = [...order.items];
        listItemsInOrder[productIndex].review = review._id;
        order.items = [...listItemsInOrder];
        //
        await review.save();
        await order.save();

        return res.status(StatusCodes.OK).json({ review });
    } catch (e) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: e });
    }
};

// ** ===================  GET ALL REVIEWS  ===================
const getAllReviews = async (req, res) => {
    const review = await Review.find({}).populate({
        path: 'product',
        select: 'name company, price',
    });
    res.status(StatusCodes.OK).json({ total_review: review.length, review });
};

// ** ===================  GET SINGLE REVIEW  ===================
const getSingleReview = async (req, res) => {
    const { id } = req.params;
    try {
        const review = await Review.findById(id);
        if (!review) {
            throw new CustomError.NotFoundError(`No review with the the id ${reviewId}`);
        }
        res.status(StatusCodes.OK).json({ review });
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err });
    }
};

// ** ===================  UPDATE REVIEW  ===================
const updateReview = async (req, res) => {
    const { id: reviewId } = req.params;
    const { rating, title, comment } = req.body;
    // Check if review exists or not
    const review = await Review.findOne({ _id: reviewId });
    if (!review) {
        throw new CustomError.NotFoundError(`No review with the the id ${reviewId}`);
    }
    checkPermissions(req.user, review.user);

    review.rating = rating;
    review.title = title;
    review.comment = comment;

    await review.save();
    res.status(StatusCodes.OK).json({ msg: 'Success! Review has been updated' });
};

// ** ===================  DELETE REVIEW  ===================
const deleteReview = async (req, res) => {
    const { id: reviewId } = req.params;
    const review = await Review.findOne({ _id: reviewId });
    if (!review) {
        throw new CustomError.NotFoundError(`No review with the the id ${reviewId}`);
    }
    checkPermissions(req.user, review.user);
    await review.remove();
    res.status(StatusCodes.OK).json({ msg: 'Success! Review has been deleted' });
};

// ** =================== GET SINGLE PRODUCT REVIEW  ===================
const getSingleProductReviews = async (req, res) => {
    const { productId } = req.params;

    try {
        console.log(productId);
        const reviews = await Review.find({ product: productId });
        res.status(StatusCodes.OK).json({ total_reviews: reviews.length, reviews });
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err });
    }
};

module.exports = {
    createReview,
    getAllReviews,
    getSingleReview,
    updateReview,
    deleteReview,
    getSingleProductReviews,
};
