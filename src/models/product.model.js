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
        name_slug: {
            type: String,
            trim: true,
            maxlength: [500, 'Name cannot be more than 100 characters'],
        },
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
        createDate: {
            type: String,
        },
        modifyDate: {
            type: String,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Please category'],
            ref: 'Category',
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

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;

// module.exports = new mongoose.model('Product', ProductSchema);
