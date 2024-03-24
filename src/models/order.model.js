const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, // Reference to the User model or User ID
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Reference to the Product model or Product ID
            color: { type: mongoose.Schema.Types.ObjectId, ref: 'Color' },
            variation: { type: mongoose.Schema.Types.ObjectId, ref: 'Variation' },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
        },
    ],
    name: { type: String },
    total: { type: Number, default: 0 },
    totalItem: { type: Number, default: 0 },
    voucher: { type: String },
    taxFee: { type: Number, default: 0 },
    shippingAddress: { type: String, required: true },
    shippingCost: { type: Number, default: 0 },
    phoneNumber: {
        type: String,
    },
    email: {
        type: String,
    },
    paymentMethod: { type: String, required: true },
    status: { type: String, default: 'Pending' }, // You can have various status like 'Pending', 'Shipped', 'Delivered', etc.
    createDate: {
        type: String,
    },
    modifyDate: {
        type: String,
    },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
