const User = require('../models/user.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const { StatusCodes } = require('http-status-codes');
const { arraysAreEqual, addTagHistory } = require('../utils/index');

const addProductToCart = async (req, res, next) => {
    const { userId } = req.user;
    const { product, variant, quantity, stockLeft } = req.body;
    try {
        if (!product) {
            return res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'error', data: { msg: 'No user found' } });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: 'No user found' } });
        }
        const cart = await Cart.findById(user.cart);
        if (!cart) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: 'No cart found' } });
        }
        //
        let index = null;
        index = cart.items.findIndex(
            (cproduct) => cproduct.product.toString() === product && arraysAreEqual(cproduct.variant, variant),
        );

        if (index !== -1) {
            // found a product
            cart.items[index].quantity = cart.items[index].quantity + (quantity ? quantity : 1);
            if (stockLeft && cart.items[index].quantity > stockLeft) {
                cart.items[index].quantity = stockLeft;
            }
        } else {
            cart.items = [
                ...cart.items,
                {
                    product,
                    variant: variant ? variant : [],
                    quantity: quantity
                        ? stockLeft && quantity > stockLeft
                            ? stockLeft
                            : quantity
                        : stockLeft
                        ? stockLeft
                        : quantity,
                },
            ];
        }
        //
        const thisProduct = await Product.findById(product);
        await addTagHistory(thisProduct.tag, 10, user.id);
        //
        await cart.save();
        return res.status(StatusCodes.OK).json({ status: 'sucess', data: { msg: 'Cart updated' } });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: err } });
    }
};

const deleteProductFromCart = async (req, res, next) => {
    const { userId } = req.user;
    const { product, variant } = req.body;
    try {
        if (!product) {
            return res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'error', data: { msg: 'No product found' } });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: 'No user found' } });
        }
        const cart = await Cart.findById(user.cart);
        if (!cart) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: 'No cart found' } });
        }
        //
        const newCartItems = cart.items.filter(
            (cproduct) => cproduct.product.toString() !== product || !arraysAreEqual(cproduct.variant, variant),
        );
        cart.items = newCartItems ? [...newCartItems] : [];
        //
        const thisProduct = await Product.findById(product);
        await addTagHistory(thisProduct.tag, -10, user.id);
        //
        await cart.save();
        return res.status(StatusCodes.OK).json({ status: 'sucess', data: { msg: 'Cart updated' } });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: err } });
    }
};

const updateProductQuantity = async (req, res, next) => {
    const { userId } = req.user;
    const { product, variant, gap, stockLeft } = req.body;
    try {
        if (!product) {
            return res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'error', data: { msg: 'No user found' } });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: 'No user found' } });
        }
        const cart = await Cart.findById(user.cart);
        if (!cart) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: 'No cart found' } });
        }
        //
        let index = null;

        index = cart.items.findIndex(
            (cproduct) => cproduct.product.toString() === product && arraysAreEqual(cproduct.variant, variant),
        );

        if (index !== -1) {
            // found a product
            const q = cart.items[index].quantity + (gap ? gap : 0);
            if (q > 0) {
                cart.items[index].quantity = q;
            } else {
                cart.items[index].quantity = 1;
            }
            if (stockLeft && cart.items[index] > stockLeft) {
                cart.items[index].quantity = stockLeft;
            }
        } else {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: 'Item not found' } });
        }
        await cart.save();
        return res.status(StatusCodes.OK).json({ status: 'sucess', data: { msg: 'Cart updated' } });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: err } });
    }
};

const clearCart = async (req, res, next) => {
    const { userId } = req.user;
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
        cart.items = [];
        await cart.save();
        return res.status(StatusCodes.OK).json({ status: 'sucess', data: { msg: 'Cart clear' } });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: err } });
    }
};

module.exports = {
    addProductToCart,
    deleteProductFromCart,
    updateProductQuantity,
    clearCart,
};
