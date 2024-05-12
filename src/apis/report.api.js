const Review = require('../models/review.model');
const Report = require('../models/report.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const { checkPermissions } = require('../utils');
const path = require('path');
const Order = require('../models/order.model');
const { saveNotifyToDb } = require('../utils/notification.util');

// ** ===================  CREATE REPORT  ===================
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
        //notify
        const userAdmin = await User.find({ role: 'admin' });
        const listTarget = [];
        for (let i = 0; i < userAdmin.length; i++) {
            listTarget.push(userAdmin[i]._id);
        }
        await saveNotifyToDb([...listTarget], {
            title: `<p>You have new ${type} report</p>`,
            target: { id: report._id, type: type },
        });
        return res.status(StatusCodes.OK).json({ msg: 'OK' });
    } catch (e) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: e });
    }
};

// ** ===================  GET ALL REPORT  ===================
const getAllReports = async (req, res) => {
    const reportQuery = req.query;
    try {
        let query = {};

        if (reportQuery?.reportType?.trim() !== '') {
            if (reportQuery?.reportType === 'pending') {
                query = {
                    markAsRead: false,
                };
            } else {
                query = {
                    markAsRead: true,
                };
            }
        }
        let reports = await Report.find(query).populate('sender', 'name');

        if (reportQuery?.currentPage) {
            const startIndex = (parseInt(reportQuery.currentPage) - 1) * parseInt(reportQuery.limit);
            const endIndex = startIndex + parseInt(reportQuery.limit);
            const filteredProducts = reports.slice(startIndex, endIndex);
            reports = [...filteredProducts];
        }

        res.status(StatusCodes.OK).json({ pages: reports.length, reports });
    } catch (e) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ e });
    }
};

const markAtReadReport = async (req, res) => {
    const { reason, target, type } = req.body;
    const { reportId } = req.params;
    try {
        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: 'No report' });
        }
        report.markAtRead = !report.markAtRead;
        await report.save();
        return res.status(StatusCodes.OK).json({ msg: 'OK' });
    } catch (e) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: e });
    }
};

module.exports = {
    pushReport,
    getAllReports,
    markAtReadReport,
};
