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
        tag: {
            type: String,
            trim: true,
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
        routePath: {
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
// ProductSchema.virtual('ordersCountVirtual').get(function () {
//     return this.orders?.length ? this.orders.length : 0;
// });

ProductSchema.pre('remove', async function (next) {
    // Go to 'Reveiw; and delete all the review that are associated with this particular product
    await this.model('Review').deleteMany({ product: this._id });
});

ProductSchema.pre('save', async function (next) {
    if (this.isModified('variantDetail')) {
        try {
            const customFieldData = await fetchDataBasedOnVariantDetail(this.variantDetail);
            this.routePath = customFieldData;
        } catch (error) {
            next(error);
        }
    }
    const currentDate = new Date().getTime();
    this.createDate = this.createDate || currentDate;
    this.modifyDate = currentDate;
    next();
});

const fetchDataBasedOnVariantDetail = async (variantDetail) => {
    const data = [];
    if (!variantDetail || variantDetail.length === 0) {
        return null;
    }
    const accessDetails = async (node, depth, path) => {
        if (node.detail) {
            data.push({ path: [...path], detail: { ...node.detail } });
        } else {
            for (let i = 0; i < node.child.length; i++) {
                const tempArr = [...path, node.child[i]._id];
                await accessDetails(node.child[i], depth + 1, [...tempArr]);
            }
        }
    };
    for (let i = 0; i < variantDetail.length; i++) {
        await accessDetails(variantDetail[i], 0, [variantDetail[i]._id]);
    }
    return [...data];
};

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;

// module.exports = new mongoose.model('Product', ProductSchema);
