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
const userStat = async (req, res) => {
    const { role } = req.user;
    const { type } = req.params;
    try {
        return res.status(StatusCodes.OK).json({ err: 'OK' });
    } catch (e) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: e });
    }
};

// ** ===================  GET ALL REVIEWS  ===================
const productStat = async (req, res) => {
    const { role, userId } = req.user;
    const { type } = req.query; //
    try {
        let products;
        let shopId;
        if (role === 'admin') {
            products = await Product.find({}, { createDate: 1 });
        } else {
            const user = await User.findById(userId);
            if (!user || !user.shop) {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: 'User not found' });
            }
            shopId = user.shop;
            products = await Product.find({ shop: user.shop }, { createDate: 1 });
        }
        console.log(role);
        // Xác định khoảng thời gian phù hợp để nhóm sản phẩm

        const pro = await Product.aggregate([
            {
                $match: {
                    $expr: {
                        $cond: {
                            if: { $eq: [role, 'vendor'] },
                            then: { $eq: ['$shop', shopId] },
                            else: true,
                        },
                    },
                },
            },
            {
                $addFields: {
                    convertedCreateDate: {
                        $convert: { input: '$createDate', to: 'long' },
                    },
                    dateT: {
                        $dateToString: {
                            format: '%d-%m-%Y', // Định dạng ngày tháng năm
                            date: {
                                $toDate: {
                                    $convert: { input: '$createDate', to: 'long' }, // Chuyển đổi mili giây thành giây
                                },
                            },
                        },
                    },
                },
            },
            {
                $group: {
                    _id: {
                        $switch: {
                            branches: [
                                {
                                    case: { $eq: [type, 'day'] },
                                    then: {
                                        $dayOfYear: {
                                            $toDate: {
                                                $multiply: ['$convertedCreateDate', 1], // Chuyển đổi mili giây thành giây
                                            },
                                        },
                                    },
                                },
                                {
                                    case: { $eq: [type, 'week'] },
                                    then: {
                                        $isoWeek: {
                                            $toDate: {
                                                $multiply: ['$convertedCreateDate', 1], // Chuyển đổi mili giây thành giây
                                            },
                                        },
                                    },
                                },
                                {
                                    case: { $eq: [type, 'month'] },
                                    then: {
                                        $month: {
                                            $toDate: {
                                                $multiply: ['$convertedCreateDate', 1], // Chuyển đổi mili giây thành giây
                                            },
                                        },
                                    },
                                },
                                {
                                    case: { $eq: [type, 'year'] },
                                    then: {
                                        $year: {
                                            $toDate: {
                                                $multiply: ['$convertedCreateDate', 1], // Chuyển đổi mili giây thành giây
                                            },
                                        },
                                    },
                                },
                            ],
                            default: null,
                        },
                    },
                    count: { $sum: 1 },
                    products: {
                        $push: {
                            _id: '$_id',
                            createDate: {
                                $toDate: {
                                    $convert: { input: '$createDate', to: 'long' }, // Chuyển đổi mili giây thành giây
                                },
                            },
                        },
                    },
                    dateT: { $first: '$dateT' }, // Giữ nguyên giá trị dateT từ nhóm
                },
            },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    dateT: 1,
                    count: 1,
                    products: 1,
                },
            },
        ]);
        return res.status(StatusCodes.OK).json({ product: pro, total: products.length });
    } catch (e) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ e });
    }
};

module.exports = {
    userStat,
    productStat,
};
