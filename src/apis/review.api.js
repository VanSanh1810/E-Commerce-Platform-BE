const Review = require('../models/review.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const { checkPermissions, addTagHistory } = require('../utils');
const path = require('path');
const Order = require('../models/order.model');
const { saveNotifyToDb } = require('../utils/notification.util');
const fs = require('fs');

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
        if (JSON.parse(variant)) {
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
        //
        //
        let ratingScore;
        switch (review.rating) {
            case 1:
                ratingScore = -50;
                break;
            case 2:
                ratingScore = -20;
                break;
            case 3:
                ratingScore = 0;
                break;
            case 4:
                ratingScore = 20;
                break;
            case 5:
                ratingScore = 50;
                break;
            default:
                ratingScore = 0;
                break;
        }
        const thisProduct = await Product.findById(review.product);
        await addTagHistory(thisProduct.tag, ratingScore, user.id);
        //
        //notification
        const vendor = await User.findOne({ shop: order.shop });
        await saveNotifyToDb([vendor._id], {
            title: `<p>You have new review with ${rating} star</p>`,
            target: { id: review._id, type: 'Review', secondId: thisProduct._id },
        });
        //
        return res.status(StatusCodes.OK).json({ review });
    } catch (e) {
        console.error(e);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: e });
    }
};

// ** ===================  GET ALL REVIEWS  ===================
const getAllReviews = async (req, res) => {
    const review = await Review.find({ hidden: false }).populate({
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
            throw new CustomError.NotFoundError(`No review with the the id ${id}`);
        }
        res.status(StatusCodes.OK).json({ review });
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err });
    }
};

// ** ===================  UPDATE REVIEW  ===================
const updateReview = async (req, res) => {
    const { id } = req.params;
    const { rating, comment, imgLeft } = req.body;
    const images = req.files;
    // Check if review exists or not
    const review = await Review.findById(id);
    if (!review) {
        res.status(StatusCodes.NOT_ACCEPTABLE).json({ msg: 'No review found' });
    }
    if (!review.user.equals(req.user.userId)) {
        res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'You dont have permission to update this review' });
    }

    if (rating) {
        review.rating = parseInt(rating);
    }
    if (comment) {
        review.comment = comment;
    }

    // Kiểm tra nếu có hình ảnh mới được tải lên hoặc ảnh cũ bị xóa
    if ((images && images.length > 0) || [...JSON.parse(imgLeft)] < review.images.length) {
        const updloadDir = './public/uploads';
        // old images
        const _imgLeft = [...JSON.parse(imgLeft)];
        for (let i = 0; i < review.images.length; i++) {
            if (!_imgLeft.includes(review.images[i].url)) {
                // not in old images will be removed
                const array = review.images[i].url.split('/');
                const imgName = array[array.length - 1];
                const imgPath = path.join(__dirname, '..', updloadDir, imgName);
                if (fs.existsSync(imgPath)) {
                    fs.unlinkSync(imgPath);
                    console.log(imgPath, '+ shop img deleted');
                } else {
                    console.log(imgPath, '+ no img deleted');
                }
            }
        }
        // Cập nhật mảng ảnh của sản phẩm với các đối tượng hình ảnh mới
        const currentImg = [...review.images];
        function removeCommonElements(arrayA, arrayB) {
            // Lọc các phần tử của mảng A không có trong mảng B
            const newArray = arrayA.filter((element) => arrayB.includes(element.url));
            return newArray;
        }
        const updatedImgArr = removeCommonElements(currentImg, _imgLeft);

        //new image
        const imageData = images.map((image) => {
            return {
                url: `http://localhost:4000/public/uploads/${path.basename(image.path)}`, // Tạo URL cục bộ cho hình ảnh dựa trên đường dẫn tạm thời
            };
        });
        review.images = [...updatedImgArr, ...imageData];
    }

    await review.save();
    res.status(StatusCodes.OK).json({ msg: 'Success! Review has been updated' });
};

// ** ===================  DELETE REVIEW  ===================
const deleteReview = async (req, res) => {
    const { id: reviewId } = req.params;
    const { isHidden } = req.body;
    try {
        const review = await Review.findOne({ _id: reviewId });
        if (!review) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(`No review with the the id ${reviewId}`);
        }
        // checkPermissions(req.user, review.user);
        review.hidden = !!isHidden;
        await review.save();
        res.status(StatusCodes.OK).json({ msg: 'Success! Review has been deleted' });
    } catch (e) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: e });
    }
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
