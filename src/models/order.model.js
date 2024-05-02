const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    code: { type: String, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', require: false }, // Reference to the User model or User ID
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', require: true },
    items: [
        {
            idToSnapshot: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductSnapshot', required: true }, // Reference to the Product model or Product ID
            image: { type: Object, required: true },
            name: { type: mongoose.Schema.Types.String, required: true },
            variant: { type: Object },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', default: null, required: false },
        },
    ],
    name: { type: String, required: true },
    note: { type: String, default: '' },
    total: { type: Number, default: 0 },
    totalItem: { type: Number, default: 0 },
    voucher: { type: String, default: null },
    shippingCost: { type: Number, default: 0 },
    address: { type: Object, required: true },
    phoneNumber: {
        type: String,
        required: true,
    },
    email: {
        type: String,
    },
    paymentMethod: { type: Boolean, default: true },
    status: {
        type: String,
        enum: ['Pending', 'Fail', 'Confirmed', 'Shipped', 'Delivered', 'Done', 'Cancel'],
        default: 'Pending',
    }, // You can have various status like 'Pending', 'Shipped', 'Delivered', etc.
    onlPayStatus: { type: String, enum: ['Pending', 'Fail', 'Confirmed', 'None'], default: 'None' },
    paymentUrl: { type: String, default: '' },
    createDate: {
        type: String,
    },
    modifyDate: {
        type: String,
    },
});

orderSchema.pre('save', async function (next) {
    const currentDate = new Date().getTime();
    this.createDate = this.createDate || currentDate;
    this.modifyDate = currentDate;
    next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
