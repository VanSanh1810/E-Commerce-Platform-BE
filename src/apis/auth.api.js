const User = require('../models/user.model');
const Cart = require('../models/cart.model');
const Shop = require('../models/shop.model');
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { createUserToken, attachCookiesToResponse, isTokenValid } = require('../utils');
const nodemailer = require('nodemailer');
const nodeMailHbs = require('nodemailer-express-handlebars');
const { format } = require('date-fns');
const { use } = require('express/lib/router');
const resetPassTokenModel = require('../models/resetPassToken.model');
// Register User
const register = async (req, res) => {
    const { name, email, password } = req.body;
    console.log(name, email, password);

    const _email = email.toLowerCase();
    // Kiểm tra định dạng email
    const emailSuffix = '@gmail.com';
    if (!_email.endsWith(emailSuffix)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            status: 'error',
            data: 'Invalid email format. Only @gmail.com addresses are allowed.',
        });
    }

    const emailAlreadyExists = await User.findOne({ email: _email });
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

    const user = await User.create({ name, email: _email, password, role, createDate: currentDate, modifyDate: currentDate });
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
        let { email, password, isAdminPage } = req.body;

        if (!email || !password) {
            throw new CustomError.BadRequestError('Please provide email and password');
        }

        email = email.toLowerCase();

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
        let _isAdminPage;
        let _shopStatus;
        const sourcePort = req.headers.origin.split(':')[2]; // Lấy phần tử thứ 2 sau dấu ':'
        if (sourcePort === '3006') {
            _isAdminPage = true;
        } else {
            // Nếu role khác 'vendor', chỉ lấy sản phẩm có status là 'active'
            _isAdminPage === false;
        }
        if (_isAdminPage && user.role !== 'admin') {
            // create shop went FIRST login to admin page
            if (!user.shop) {
                const shop = new Shop({ vendor: user.id, status: 'pending', avatar: null });
                user.shop = shop._id;
                shopId = shop._id;
                user.role = 'vendor';
                await shop.save();
                await user.save();
            } else {
                const shop = await Shop.findOne({ vendor: user.id });
                if (shop.status === 'banned') {
                    return res.status(StatusCodes.UNAUTHORIZED).json({
                        status: 'error',
                        data: { message: 'Your shop is banned. Contact support for assistance.' },
                    });
                }
            }
        }

        const tokenUser = createUserToken(user);
        const token = attachCookiesToResponse({ res, user: tokenUser });

        const cart = await Cart.findOne({ user: user._id });
        const shop = await Shop.findOne({ vendor: user.id });

        const jsonResponse = {
            status: 'success',
            token,
            cart: cart,
            data: {
                email,
                role: user.role,
                shop: shopId,
                userId: user._id,
                status: shop?.status ? shop?.status : false,
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
            const cart = await Cart.findOne({ user: decodedToken.userId });
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

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                data: { message: 'No user found' },
            });
        }
        const createJWT = ({ payload }) => {
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: '5m',
            });
            return token;
        };
        //
        const token = createJWT({ payload: { email: email, userId: user.id } });
        //
        const existTokens = await resetPassTokenModel.find({ user: user._id });
        for (let i = 0; i < existTokens.length; i++) {
            existTokens[i].isUsed = true;
            existTokens[i].save();
        }
        await resetPassTokenModel.create({ user: user._id, token: token, isUsed: false });
        const url = `http://localhost:4000/resetPassword?token=${token}`;
        //
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
        //
        const mailConfig = {
            from: {
                name: 'Newpee',
                address: process.env.SMTP_USER,
            },
            to: [email],
            subject: 'Reset Password',
            text: 'Van sanh',
            html: `<p>Reset password link</p><a href='${url}'>Click here to reset password</a>`,
        };
        await transporter.sendMail(mailConfig);
        res.status(StatusCodes.OK).json({
            status: 'success',
            data: { message: 'Mail sended' },
        });
    } catch (e) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'error',
            data: { message: e },
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    validateToken,
    forgotPassword,
};
