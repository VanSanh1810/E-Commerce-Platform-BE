const User = require('../models/user.model');
const Cart = require('../models/cart.model');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');
const fs = require('fs');
const { format } = require('date-fns');
const { createTokenUser, attachCookiesToResponse, checkPermissions } = require('../utils');

//** ======================== Update user password ========================
const updateUserPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        res.status(StatusCodes.NOT_ACCEPTABLE).json({ msg: 'Please provide both values' });
    }
    const user = await User.findOne({ _id: req.user.userId });
    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
        res.status(StatusCodes.NOT_ACCEPTABLE).json({ msg: 'Wrong password provided' });
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
            res.status(StatusCodes.OK).json({ msg: 'No user found' });
        }
        res.status(StatusCodes.OK).json({ status: 'success', data: { msg: 'Account updated' } });
    } else {
        const user = await User.findById(userId);
        if (!user) {
            res.status(StatusCodes.OK).json({ msg: 'No user found' });
        }
        user.email = req.body.email;
        user.name = req.body.name;
        await user.save();
        res.status(StatusCodes.OK).json({ status: 'success', data: { msg: 'Account updated' } });
    }
};

const getUser = async (req, res) => {
    const { role, userId } = req.user;
    const { id } = req.params;
    if (role === 'admin') {
        try {
            const user = await User.findById(id).select({ password: 0 });
            if (!user) {
                const user2 = await User.findById(userId).select({ password: 0 });
                if (!user2) {
                    res.status(StatusCodes.OK).json({ msg: 'No user found' });
                }
                res.status(StatusCodes.OK).json({ status: 'success', data: user2 });
            }
            res.status(StatusCodes.OK).json({ status: 'success', data: user });
        } catch (error) {
            try {
                const user2 = await User.findById(userId).select({ password: 0 });
                if (!user2) {
                    res.status(StatusCodes.OK).json({ msg: 'No user found' });
                }
                res.status(StatusCodes.OK).json({ status: 'success', data: user2 });
            } catch (err) {
                res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'error', data: error });
            }
        }
    } else {
        try {
            const user = await User.findById(userId).select({ password: 0 });
            if (!user) {
                res.status(StatusCodes.OK).json({ msg: 'No user found' });
            }
            res.status(StatusCodes.OK).json({ status: 'success', data: user });
        } catch (error) {
            res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'error', data: error });
        }
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select({ password: 0 });
        res.status(StatusCodes.OK).json({ status: 'success', data: users });
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: err });
    }
};
module.exports = {
    updateUserPassword,
    getUser,
    updateUserData,
    getAllUsers,
};
