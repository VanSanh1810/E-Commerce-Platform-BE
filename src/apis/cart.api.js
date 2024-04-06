const User = require('../models/user.model');
const Cart = require('../models/cart.model');
const { StatusCodes } = require('http-status-codes');
const { arraysAreEqual } = require('../utils/index');

const addProductToCart = async (req, res, next) => {
    const { userId } = req.user;
    const { product, variant, quantity } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: 'No user found' } });
        }
        const cart = await Cart.findById(user.cart);
        if (!cart) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: 'No cart found' } });
        }
        //
        let itemsInCart = cart.items.length > 0 ? [...cart.items] : [];
        let index = null;
        index = itemsInCart.findIndex((cproduct) => cproduct.product === product && arraysAreEqual(cproduct.variant, variant));

        if (index !== -1) {
            // found a product
            itemsInCart[index].quantity += quantity ? quantity : 1;
        } else {
            itemsInCart = [
                ...itemsInCart,
                { product, variant: variant.length > 0 ? variant : [], quantity: quantity ? quantity : 1 },
            ];
        }
        cart.items = [...itemsInCart];
        await cart.save();
        return res.status(StatusCodes.OK).json({ status: 'sucess', data: { msg: 'Cart updated' } });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: err } });
    }
};

const deleteProductFromCart = async (req, res, next) => {
    const { userId } = req.user;
    const { id } = req.params;
};

const updateProductQuantity = async (req, res, next) => {
    const { role, userId } = req.user;
    const { id } = req.params;
};

module.exports = {
    addProductToCart,
    deleteProductFromCart,
    updateProductQuantity,
};
