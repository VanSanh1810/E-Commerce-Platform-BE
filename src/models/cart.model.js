const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true }, // Tham chiếu đến model User hoặc User ID
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Tham chiếu đến model Product hoặc Product ID
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
        },
    ],
    total: { type: Number, default: 0 },
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
