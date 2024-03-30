const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        default: null,
    },
});
const shopSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide name'],
            minlength: 3,
            maxlength: 50,
        },
        avatar: imageSchema,
        description: {
            type: String,
            minlength: 3,
            maxlength: 50,
        },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        follower: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        classify: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Classify',
            },
        ],
        product: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
        ],
        voucher: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Voucher',
            },
        ],
        status: {
            type: String,
            enum: ['active', 'banned', 'stop'],
            default: 'active', // Set the default status to "active"
        },
        addresses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Address',
            },
        ],
        email: {
            type: String,
            unique: true,
            required: [true, 'Please provide email'],
            // Custom Validators package
            validate: {
                // validator package
                validator: validator.isEmail,
                message: 'Please provide valid email',
            },
        },

        orders: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Order',
            },
        ],

        createDate: {
            type: Number,
        },
        modifyDate: {
            type: Number,
        },
    },
    // { timestamps: true },
);

shopSchema.pre('save', function (next) {
    const currentDate = new Date().getTime();
    this.createDate = this.createDate || currentDate;
    this.modifyDate = currentDate;
    next();
});

const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop;
