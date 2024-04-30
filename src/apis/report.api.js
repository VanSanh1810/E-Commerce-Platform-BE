const Review = require('../models/review.model');
const Report = require('../models/report.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const { checkPermissions } = require('../utils');
const path = require('path');
const Order = require('../models/order.model');

// ** ===================  CREATE REVIEW  ===================
const pushReport = async (req, res) => {
    const { reason, target, type } = req.body;

    try {
        const report = new Report();
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'User not found' });
        }
        report.sender = user._id;
        if (type === 'Product') {
            const product = await Product.findById(target);
            if (!product) {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Product not found' });
            }
            report.target.id = product._id;
            report.target.type = 'Product';
        } else {
            const review = await Review.findById(target);
            if (!review) {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Review not found' });
            }
            report.target.id = review._id;
            report.target.type = 'Review';
        }
        report.reason = reason;
        await report.save();
        return res.status(StatusCodes.OK).json({ msg: 'OK' });
    } catch (e) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: e });
    }
};

// ** ===================  GET ALL REVIEWS  ===================
const getAllReports = async (req, res) => {
    const reports = await Report.find().populate('sender', 'name');
    res.status(StatusCodes.OK).json({ total_report: reports.length, reports });
};

module.exports = {
    pushReport,
    getAllReports,
};
