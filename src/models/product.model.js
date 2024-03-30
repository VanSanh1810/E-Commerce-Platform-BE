const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
    },
});

const ProductSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide product name'],
            trim: true,
            maxlength: [500, 'Name cannot be more than 120 characters'],
        },
        tag: [
            {
                type: String,
                trim: true,
                maxlength: [10, 'Tag cannot be more than 10 characters'],
            },
        ],
        stock: {
            type: Number,
            required: [true, 'Please provide stock value'],
            default: 0,
        },
        price: {
            type: Number,
            required: [false, 'Please provide price value'],
            default: null,
        },
        discountPrice: {
            type: Number,
            default: null,
        },
        description: {
            type: String,
            maxlength: [3000, 'Description can not be more than 3000 characters'],
        },
        images: [imageSchema],

        category: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Please category'],
            ref: 'Category',
        },
        classify: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Classify',
        },
        shop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shop',
        },
        review: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Review',
            },
        ],
        status: {
            type: String,
            enum: ['active', 'disabled', 'draft'],
            default: 'active', // Set the default status to "active"
        },
        variantData: [
            {
                type: Object,
            },
        ],
        variantDetail: {
            type: Object,
        },
        orders: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Order',
            },
        ],
        ordersCount: {
            type: Number,
            default: 0,
        },
        createDate: {
            type: String,
        },
        modifyDate: {
            type: String,
        },
    },
    { toJSON: { virtuals: true }, toObject: { virtuals: true } },
    { timestamps: true },
);

// If I want to search single product, in tha product I also want to have all reviews associated with that product.
ProductSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'product',
    justOne: false,
    // match: {rating: 5} // Get the reviews whose rating is only 5.
});
ProductSchema.virtual('ordersCountVirtual').get(function () {
    return this.orders.length;
});

ProductSchema.pre('remove', async function (next) {
    // Go to 'Reveiw; and delete all the review that are associated with this particular product
    await this.model('Review').deleteMany({ product: this._id });
});

ProductSchema.pre('save', function (next) {
    const currentDate = new Date().getTime();
    this.createDate = this.createDate || currentDate;
    this.modifyDate = currentDate;
    next();
});

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;

// module.exports = new mongoose.model('Product', ProductSchema);
