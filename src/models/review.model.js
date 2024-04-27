const mongoose = require('mongoose');
const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
    },
});

const ReviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Please provide rating'],
    },
    comment: {
        type: String,
        required: [true, 'Please provide review text'],
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    variant: [
        {
            type: String,
        },
    ],
    images: [imageSchema],
    createDate: {
        type: String,
    },
    modifyDate: {
        type: String,
    },
});

// User can leave only one review for a product
// ReviewSchema.index({ product: 1, variant: 1, user: 1 }, { unique: true });

// Average rating
ReviewSchema.statics.calculateAverageRating = async function (productId) {
    const result = await this.aggregate([
        { $match: { product: productId } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                numOfReviews: { $sum: 1 },
            },
        },
    ]);

    try {
        await this.model('Product').findOneAndUpdate(
            { _id: productId },
            {
                // 👇 This is optional chaining in JavaScript
                averageRating: Math.ceil(result[0]?.averageRating || 0),
                numOfReviews: result[0]?.numOfReviews || 0,
            },
        );
    } catch (error) {
        console.log(error);
    }
};

ReviewSchema.post('save', async function () {
    await this.constructor.calculateAverageRating(this.product);
});
ReviewSchema.post('remove', async function () {
    await this.constructor.calculateAverageRating(this.product);
});

ReviewSchema.pre('save', async function (next) {
    const currentDate = new Date().getTime();
    this.createDate = this.createDate || currentDate;
    this.modifyDate = currentDate;
    next();
});

module.exports = mongoose.model('Review', ReviewSchema);
