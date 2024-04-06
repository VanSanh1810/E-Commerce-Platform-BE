const mongoose = require('mongoose');
const validator = require('validator');

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
            minlength: 3,
            maxlength: 50,
            default: null,
        },
        avatar: imageSchema,
        description: {
            type: String,
            minlength: 3,
            maxlength: 50,
            default: null,
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
            enum: ['active', 'banned', 'stop', 'pending'],
            default: 'pending', // Set the default status to "pending"
            // on first create , shop nead to provide  full information to change to the active state
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

shopSchema.pre('save', function (next) {
    if (this.name && this.avatar && this.addresses && this.email){
        this.status = 'active'
    } next();
});

const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop;
