require('dotenv').config();
const User = require('../models/user.model');
const Cart = require('../models/cart.model');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');
const fs = require('fs');
const { format } = require('date-fns');
const { createTokenUser, attachCookiesToResponse, checkPermissions } = require('../utils');
const { isObjectIdOrHexString } = require('mongoose');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

//** ======================== Update user password ========================
const updateUserPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(StatusCodes.NOT_ACCEPTABLE).json({ msg: 'Please provide both values' });
    }
    const user = await User.findOne({ _id: req.user.userId });
    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
        return res.status(StatusCodes.NOT_ACCEPTABLE).json({ msg: 'Wrong password provided' });
    }
    user.password = newPassword;
    await user.save();
    res.status(StatusCodes.OK).json({ msg: 'Success! Password Updated' });
};

const updateUserData = async (req, res) => {
    const { role, userId } = req.user;
    const { id } = req.params;
    const dataToUpdate = req.body;
    if (role === 'admin') {
        const result = await User.findByIdAndUpdate(id, dataToUpdate, { runValidators: true });
        if (!result) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'No user found' });
        }
        return res.status(StatusCodes.OK).json({ status: 'success', data: { msg: 'Account updated' } });
    } else {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'No user found' });
        }
        // user.email = req.body.email;
        user.name = req.body.name;
        await user.save();
        return res.status(StatusCodes.OK).json({ status: 'success', data: { msg: 'Account updated' } });
    }
};

const getUser = async (req, res) => {
    const { role, userId } = req.user;
    const { id } = req.params;
    if (role === 'admin') {
        try {
            const user = await User.findById(id).select({ password: 0 }).populate('shop', 'name');
            if (!user) {
                const user2 = await User.findById(userId).select({ password: 0 }).populate('shop', 'name');
                if (!user2) {
                    return res.status(StatusCodes.OK).json({ msg: 'No user found' });
                }
                return res.status(StatusCodes.OK).json({ status: 'success', data: user2 });
            }
            return res.status(StatusCodes.OK).json({ status: 'success', data: user });
        } catch (error) {
            try {
                const user2 = await User.findById(userId).select({ password: 0 }).populate('shop', 'name');
                if (!user2) {
                    return res.status(StatusCodes.OK).json({ msg: 'No user found' });
                }
                return res.status(StatusCodes.OK).json({ status: 'success', data: user2 });
            } catch (err) {
                return res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'error', data: error });
            }
        }
    } else {
        try {
            const user = await User.findById(userId).select({ password: 0 }).populate('shop', 'name');
            if (!user) {
                return res.status(StatusCodes.OK).json({ msg: 'No user found' });
            }
            return res.status(StatusCodes.OK).json({ status: 'success', data: user });
        } catch (error) {
            return res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'error', data: error });
        }
    }
};

const getAllUsers = async (req, res) => {
    const userQuery = req.query;
    try {
        console.log(userQuery);
        let query = {};

        if (userQuery?.searchText?.trim() !== '') {
            if (isObjectIdOrHexString(userQuery.searchText)) {
                query = {
                    $or: [
                        { _id: { $regex: userQuery.searchText, $options: 'i' } },
                        { name: { $regex: userQuery.searchText, $options: 'i' } },
                        { email: { $regex: userQuery.searchText, $options: 'i' } },
                    ],
                };
            } else {
                query = {
                    $or: [{ name: new RegExp(userQuery.searchText, 'i') }, { email: new RegExp(userQuery.searchText, 'i') }],
                };
            }
        }

        let users = await User.find(query).select({ password: 0 });

        if (users.length === 0) {
            return res.status(StatusCodes.OK).json({ status: 'success', data: [], pages: 0 });
        }

        const total = users.length;

        if (userQuery?.currentPage) {
            const startIndex = (parseInt(userQuery.currentPage) - 1) * parseInt(userQuery.limit);
            const endIndex = startIndex + parseInt(userQuery.limit);
            const filteredUsers = users.slice(startIndex, endIndex);
            users = [...filteredUsers];
        }
        res.status(StatusCodes.OK).json({ status: 'success', data: users, pages: total });
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: err });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user.userId });
        if (!user) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                data: { message: 'No user found !' },
            });
        }
        if (user.isVerified) {
            return res.status(StatusCodes.OK).json({
                status: 'ok',
                data: { message: 'Email already verified !' },
            });
        }

        const createJWT = ({ payload }) => {
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: '5m',
            });
            return token;
        };
        //
        const token = createJWT({ payload: { userId: user.id } });
        //
        const url = `http://localhost:4000/verifyEmail/?token=${token}`;
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
            to: [user.email],
            subject: 'Email Verification',
            text: 'Van sanh',
            html: `<p>Verify link</p><a href='${url}'>Click here to verify your email</a>`,
        };
        await transporter.sendMail(mailConfig);
        return res.status(StatusCodes.OK).json({
            status: 'success',
            data: { message: 'Mail sended' },
        });
    } catch (err) {
        console.log(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'error',
            data: { message: err },
        });
    }
};
module.exports = {
    updateUserPassword,
    getUser,
    updateUserData,
    getAllUsers,
    verifyEmail,
};
