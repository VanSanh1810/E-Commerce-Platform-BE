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
        throw new CustomError.BadRequestError('Please provide both values');
    }
    const user = await User.findOne({ _id: req.user.userId });
    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
        throw new CustomError.UnauthenticatedError('Wrong password provided');
    }
    user.password = newPassword;
    await user.save();
    res.status(StatusCodes.OK).json({ msg: 'Success! Password Updated' });
};

module.exports = {
    updateUserPassword,
};
