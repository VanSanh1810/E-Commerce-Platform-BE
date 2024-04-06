const User = require('../models/user.model');
const Cart = require('../models/cart.model');
const Shop = require('../models/shop.model');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { createUserToken, attachCookiesToResponse, isTokenValid } = require('../utils');
const { format } = require('date-fns');
const { use } = require('express/lib/router');
// Register User
const register = async (req, res) => {
    const { name, email, password } = req.body;
    console.log(name, email, password);

    // Kiểm tra định dạng email
    const emailSuffix = '@gmail.com';
    if (!email.endsWith(emailSuffix)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            status: 'error',
            data: 'Invalid email format. Only @gmail.com addresses are allowed.',
        });
    }

    const emailAlreadyExists = await User.findOne({ email });
    if (emailAlreadyExists) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            status: 'error',
            data: 'Email already exists',
        });
    }
    const currentDate = new Date();
    // Add first registered user as admin
    const isFirstAccount = (await User.countDocuments({})) === 0;
    const role = isFirstAccount ? 'admin' : 'user';

    const user = await User.create({ name, email, password, role, createDate: currentDate, modifyDate: currentDate });
    const cart = await Cart.create({ user: user.id, items: [] });
    user.cart = cart._id;
    user.save();

    // Create token user
    const tokenUser = createUserToken(user);
    attachCookiesToResponse({ res, user: tokenUser });

    // Send success response with user data
    res.status(StatusCodes.OK).json({
        status: 'success',
        data: {
            user: tokenUser,
        },
    });
};

// Login User
const login = async (req, res) => {
    try {
        const { email, password, isAdminPage } = req.body;

        if (!email || !password) {
            throw new CustomError.BadRequestError('Please provide email and password');
        }

        const user = await User.findOne({ email });

        if (!user) {
            throw new CustomError.UnauthorizedError('No user found');
        }

        // Check if the user is banned
        if (user.status === 'banned') {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                status: 'error',
                data: { message: 'Your account is banned. Contact support for assistance.' },
            });
        }

        const isPasswordCorrect = await user.comparePassword(password);

        if (!isPasswordCorrect) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                status: 'error',
                data: { message: 'Incorrect email or password' },
            });
        }
        let shopId = user.shop;
        if (isAdminPage && user.role !== 'admin') {
            if (!user.shop) {
                const shop = new Shop({ vendor: user.id, status: 'pending', avatar: null });
                user.shop = shop._id;
                shopId = shop._id;
                user.role = 'vendor';
                await shop.save();
                await user.save();
            }
        }

        const tokenUser = createUserToken(user);
        const token = attachCookiesToResponse({ res, user: tokenUser });

        const jsonResponse = {
            status: 'success',
            token,
            data: {
                email,
                role: user.role,
                shop: shopId,
                // Avoid sending the password in the response
            },
        };

        res.status(StatusCodes.OK).json(jsonResponse);
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'error',
            data: { message: 'Internal server error' },
        });
    }
};

const logout = async (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        expires: new Date(0), // Set expiration date to a past date
    });
    res.status(StatusCodes.OK).json({ msg: 'User logged out!' });
};

const validateToken = async (req, res) => {
    const { token } = req.body;
    if (token) {
        try {
            const decodedToken = await isTokenValid({ token: token });
            console.log('Decoded: ', decodedToken);
            const cart = await Cart.findOne({ user: decodedToken.userId }).populate('items.product');
            res.status(StatusCodes.OK).json({
                status: 'success',
                data: { message: 'Valid token', cart: cart },
            });
        } catch (err) {
            res.status(StatusCodes.UNAUTHORIZED).json({
                status: 'error',
                data: { message: `Invalid Token ${err}` },
            });
        }
    } else {
        res.status(StatusCodes.UNAUTHORIZED).json({
            status: 'error',
            data: { message: 'No token' },
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    validateToken,
};
