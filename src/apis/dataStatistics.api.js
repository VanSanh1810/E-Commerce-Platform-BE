const Review = require('../models/review.model');
const Report = require('../models/report.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const { checkPermissions } = require('../utils');
const path = require('path');
const Order = require('../models/order.model');
const Shop = require('../models/shop.model');
const Category = require('../models/category.model');
const Banner = require('../models/banner.model');

// ** ===================  USER STAT  ===================
const userStat = async (req, res) => {
    const { type } = req.query;
    try {
        const users = await User.find({}, { createDate: 1 });

        const usr = await User.aggregate([
            {
                $addFields: {
                    convertedCreateDate: {
                        $convert: { input: '$createDate', to: 'long' },
                    },
                    dateT: {
                        $dateToString: {
                            format: '%Y-%m-%d', // Định dạng ngày tháng năm
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
                    users: {
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
                    users: 1,
                },
            },
        ]);

        return res.status(StatusCodes.OK).json({ user: usr, total: users.length });
    } catch (e) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: e });
    }
};

// ** ===================  PRODUCT STAT  ===================
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
                            format: '%Y-%m-%d', // Định dạng ngày tháng năm
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

// ** ===================  ORDER STAT  ===================
const orderStat = async (req, res) => {
    const { type } = req.query;
    const { shop, userId } = req.user;
    try {
        const orders = await Order.find({ shop: shop }, { createDate: 1, total: 1 });

        const ord = await Order.aggregate([
            {
                $addFields: {
                    convertedCreateDate: {
                        $convert: { input: '$createDate', to: 'long' },
                    },
                    dateT: {
                        $dateToString: {
                            format: '%Y-%m-%d', // Định dạng ngày tháng năm
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
                    orders: {
                        $push: {
                            _id: '$_id',
                            createDate: {
                                $toDate: {
                                    $convert: { input: '$createDate', to: 'long' }, // Chuyển đổi mili giây thành giây
                                },
                            },
                            total: '$total',
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
                    orders: 1,
                },
            },
        ]);

        return res.status(StatusCodes.OK).json({ order: ord, total: orders.length });
    } catch (e) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: e });
    }
};

// ** ===================  REVIEW STAT  ===================
const reviewStat = async (req, res) => {
    const { type } = req.query;
    const { shop, userId } = req.user;
    try {
        const shopProducts = await Product.find({ shop: shop });

        const idList = shopProducts.map((product) => {
            return product._id;
        });

        const t = await Review.find({ product: { $in: idList } }, { rating: 1, createDate: 1 });

        const reviewList = await Review.aggregate([
            {
                $match: { product: { $in: idList } },
            },
            {
                $addFields: {
                    convertedCreateDate: {
                        $convert: { input: '$createDate', to: 'long' },
                    },
                    dateT: {
                        $dateToString: {
                            format: '%Y-%m-%d', // Định dạng ngày tháng năm
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
                    orders: {
                        $push: {
                            _id: '$_id',
                            createDate: {
                                $toDate: {
                                    $convert: { input: '$createDate', to: 'long' }, // Chuyển đổi mili giây thành giây
                                },
                            },
                            rating: '$rating',
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
                    orders: 1,
                },
            },
        ]);
        return res.status(StatusCodes.OK).json({ review: reviewList, total: t.length });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err });
    }
};

// ** ===================  SALE STAT  ===================
const saleStat = async (req, res) => {
    const { type } = req.query;
    const { shop, userId } = req.user;
    try {
        const _shop = await Shop.findById(shop);
        if (!_shop) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: 'No shop found' });
        }

        const orders = await Order.find({ shop: _shop._id }, { total: 1, createDate: 1 });

        //day : 24hours
        //month : day
        //year : month
        //{ "week": "fri", "sale": 2000 },

        const localCompare = (refDate, type) => {
            const now = new Date();
            switch (type) {
                case 'day':
                    if (now.getFullYear() !== refDate.getFullYear()) {
                        return false;
                    }
                    if (now.getMonth() !== refDate.getMonth()) {
                        return false;
                    }
                    if (now.getDate() !== refDate.getDate()) {
                        return false;
                    }
                    return true;
                case 'month':
                    if (now.getFullYear() !== refDate.getFullYear()) {
                        return false;
                    }
                    if (now.getMonth() !== refDate.getMonth()) {
                        return false;
                    }
                    return true;
                case 'year':
                    if (now.getFullYear() !== refDate.getFullYear()) {
                        return false;
                    }
                    return true;
                default:
                    break;
            }
        };

        const preLocalCompare = (refDate, type) => {
            const now = new Date();
            switch (type) {
                case 'day':
                    if (now.getFullYear() !== refDate.getFullYear()) {
                        return false;
                    }
                    if (now.getMonth() !== refDate.getMonth()) {
                        return false;
                    }
                    if (now.getDate() - refDate.getDate() !== 1) {
                        return false;
                    }
                    return true;
                case 'month':
                    if (now.getFullYear() !== refDate.getFullYear()) {
                        return false;
                    }
                    if (now.getMonth() - refDate.getMonth() !== 1) {
                        return false;
                    }
                    return true;
                case 'year':
                    if (now.getFullYear() - refDate.getFullYear() !== 1) {
                        return false;
                    }
                    return true;
                default:
                    break;
            }
        };

        const calculateDateInMonth = () => {
            const date = new Date();

            // Lấy ra tháng và năm từ đối tượng Date
            const month = date.getMonth();
            const year = date.getFullYear();

            // Tính toán ngày đầu tiên của tháng kế tiếp
            const nextMonth = new Date(year, month + 1, 1);

            // Trừ đi ngày cuối cùng của tháng hiện tại để tính số ngày trong tháng
            const daysInMonth = (nextMonth - date) / (1000 * 60 * 60 * 24);

            return daysInMonth;
        };

        let preSale = 0;
        const saleData = [];

        switch (type) {
            case 'day':
                // get all orders for day and aggregate by hour
                for (let i = 0; i < orders.length; i++) {
                    const orderDate = new Date(parseInt(orders[i].createDate));
                    if (localCompare(orderDate, type)) {
                        const dataTag = orderDate.getHours();
                        const index = saleData.findIndex((item) => item.week === dataTag.toString());
                        if (index !== -1) {
                            saleData[index].sale += orders[i].total;
                        } else {
                            saleData.push({ week: dataTag.toString(), sale: orders[i].total });
                        }
                    } else {
                        //pre sale data
                        if (preLocalCompare(orderDate, type)) {
                            preSale += orders[i].total;
                        }
                    }
                }
                // genarate missing data
                for (let j = 0; j < 24; j++) {
                    const index = saleData.findIndex((item) => parseInt(item.week) === j);
                    if (index === -1) {
                        saleData.push({ week: j.toString(), sale: 0 });
                    }
                }
                break;
            case 'month':
                // get all orders by month and aggregate by day
                for (let i = 0; i < orders.length; i++) {
                    const orderDate = new Date(parseInt(orders[i].createDate));
                    if (localCompare(orderDate, type)) {
                        const dataTag = orderDate.getDate();
                        const index = saleData.findIndex((item) => item.week === dataTag.toString());
                        if (index !== -1) {
                            saleData[index].sale += orders[i].total;
                        } else {
                            saleData.push({ week: dataTag.toString(), sale: orders[i].total });
                        }
                    } else {
                        //pre sale data
                        if (preLocalCompare(orderDate, type)) {
                            preSale += orders[i].total;
                        }
                    }
                }
                // genarate missing data
                const leapYear = calculateDateInMonth();
                for (let j = 0; j < leapYear; j++) {
                    const index = saleData.findIndex((item) => parseInt(item.week) === j);
                    if (index === -1) {
                        saleData.push({ week: j.toString(), sale: 0 });
                    }
                }
                break;
            case 'year':
                // get all orders by year and aggregate by month
                for (let i = 0; i < orders.length; i++) {
                    const orderDate = new Date(parseInt(orders[i].createDate));
                    if (localCompare(orderDate, type)) {
                        const dataTag = orderDate.getMonth();
                        const index = saleData.findIndex((item) => item.week === dataTag.toString());
                        if (index !== -1) {
                            saleData[index].sale += orders[i].total;
                        } else {
                            saleData.push({ week: dataTag.toString(), sale: orders[i].total });
                        }
                    } else {
                        //pre sale data
                        if (preLocalCompare(orderDate, type)) {
                            preSale += orders[i].total;
                        }
                    }
                }
                // genarate missing data
                for (let j = 0; j < 12; j++) {
                    const index = saleData.findIndex((item) => parseInt(item.week) === j);
                    if (index === -1) {
                        saleData.push({ week: j.toString(), sale: 0 });
                    }
                }
                break;
            default:
                saleData.push('???');
                break;
        }
        saleData.sort((a, b) => a.week - b.week);
        // return res.status(StatusCodes.OK).json({ saleData: reviewList, total: t.length });
        return res.status(StatusCodes.OK).json({ saleData: saleData, preSale: preSale });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err });
    }
};

// ** ===================  TOTAL PRODUCT  ===================
const totalProduct = async (req, res) => {
    const { role, userId, shop } = req.user;
    try {
        if (role === 'admin') {
            const product = await Product.find();
            return res.status(StatusCodes.OK).json({ total: product.length });
        } else {
            const product = await Product.find({ shop: shop });
            return res.status(StatusCodes.OK).json({ total: product.length });
        }
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err });
    }
};

// ** ===================  TOTAL CATE  ===================
const totalCate = async (req, res) => {
    const { role, userId } = req.user;
    try {
        const cate = await Category.find();
        return res.status(StatusCodes.OK).json({ total: cate.length });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err });
    }
};

// ** ===================  SHOP AVGSTAR  ===================
const avgStar = async (req, res) => {
    const { role, userId, shop } = req.user;
    try {
        if (role === 'admin') {
            const product = await Product.find();
            //
            let totalRating = 0;
            let totalReviews = 0;
            for (let i = 0; i < product.length; i++) {
                const reviewList = await Review.find({ product: product[i]._id });
                totalReviews += reviewList.length;
                totalRating += reviewList.reduce((sum, review) => sum + review.rating, 0);
            }
            const averageShopReview = totalReviews === 0 ? 0 : totalRating / totalReviews;
            return res.status(StatusCodes.OK).json({ avg: averageShopReview });
        } else {
            const product = await Product.find({ shop: shop });
            //
            let totalRating = 0;
            let totalReviews = 0;
            for (let i = 0; i < product.length; i++) {
                const reviewList = await Review.find({ product: product[i]._id });
                totalReviews += reviewList.length;
                totalRating += reviewList.reduce((sum, review) => sum + review.rating, 0);
            }
            const averageShopReview = totalReviews === 0 ? 0 : totalRating / totalReviews;
            return res.status(StatusCodes.OK).json({ avg: averageShopReview });
        }
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err });
    }
};

// ** ===================  USER APR/BLOCK  ===================
const userAprBlk = async (req, res) => {
    const { role, userId } = req.user;
    try {
        const users = await User.find({}, { _id: 1, status: 1 });
        let aprUser = 0;
        let blkUser = 0;
        for (let i = 0; i < users.length; i++) {
            if (users[i].status === 'active') {
                aprUser++;
            } else {
                blkUser++;
            }
        }
        return res.status(StatusCodes.OK).json({ aprUser, blkUser });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err });
    }
};

// ** ===================  USER APR/BLOCK  ===================
const shopStat = async (req, res) => {
    const { role, userId } = req.user;
    try {
        const shops = await Shop.find(null, { _id: 1, status: 1 });
        let activeShop = 0;
        let pendingShop = 0;
        let stopShop = 0;
        let bannedShop = 0;
        for (let i = 0; i < shops.length; i++) {
            if (shops[i].status === 'active') {
                activeShop++;
                continue;
            }
            if (shops[i].status === 'pending') {
                pendingShop++;
                continue;
            }
            if (shops[i].status === 'stop') {
                stopShop++;
                continue;
            }
            if (shops[i].status === 'banned') {
                bannedShop++;
                continue;
            }
        }
        return res.status(StatusCodes.OK).json({ activeShop, pendingShop, stopShop, bannedShop });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err });
    }
};

// ** ===================  ORDER TYPE COUNT  ===================
const orderTypeCount = async (req, res) => {
    const { shop, role, userId } = req.user;
    try {
        let pendingOrder = 0;
        let shippedOrder = 0;
        let recievedOrder = 0;
        let cancelOrder = 0;
        if (role === 'admin') {
            const orders = await Order.find(null, { status: 1 });
            for (let i = 0; i < orders.length; i++) {
                if (orders[i].status === 'Pending') {
                    pendingOrder++;
                    continue;
                }
                if (['Confirmed', 'Shipped', 'Delivered'].includes(orders[i].status)) {
                    shippedOrder++;
                    continue;
                }
                if (orders[i].status === 'Done') {
                    recievedOrder++;
                    continue;
                }
                if (['Fail', 'Cancel'].includes(orders[i].status)) {
                    cancelOrder++;
                    continue;
                }
            }
            return res.status(StatusCodes.OK).json({ pendingOrder, shippedOrder, recievedOrder, cancelOrder });
        } else {
            const orders = await Order.find({ shop: shop }, { status: 1 });
            for (let i = 0; i < orders.length; i++) {
                if (orders[i].status === 'Pending') {
                    pendingOrder++;
                    continue;
                }
                if (['Confirmed', 'Shipped', 'Delivered'].includes(orders[i].status)) {
                    shippedOrder++;
                    continue;
                }
                if (orders[i].status === 'Done') {
                    recievedOrder++;
                    continue;
                }
                if (['Fail', 'Cancel'].includes(orders[i].status)) {
                    cancelOrder++;
                    continue;
                }
            }
            return res.status(StatusCodes.OK).json({ pendingOrder, shippedOrder, recievedOrder, cancelOrder });
        }
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err });
    }
};

// ** ===================  REPORT TYPE COUNT  ===================
const reportTypeCount = async (req, res) => {
    try {
        let pendingReport = 0;
        let doneReport = 0;

        const reports = await Report.find({}, { markAtRead: 1 });

        for (let i = 0; i < reports.length; i++) {
            if (reports[i].markAtRead) {
                doneReport++;
            } else {
                pendingReport++;
            }
        }

        return res.status(StatusCodes.OK).json({ pendingReport, doneReport });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err });
    }
};

// ** ===================  SINGLE SHOP STAT  ===========================
const singleShopStat = async (req, res) => {
    const { shopId } = req.params;
    try {
        let totalOrder = 0;
        let totalProduct = 0;

        const shop = await Shop.findById(shopId, { createDate: 1 });
        if (!shop) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: 'No shop match' });
        }

        const products = await Product.find({ shop: shop._id }, { createDate: 1 });
        const orders = await Order.find({ shop: shop._id }, { createDate: 1 });

        totalOrder = orders.length;
        totalProduct = products.length;

        return res.status(StatusCodes.OK).json({ totalProduct, totalOrder });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err });
    }
};

// ** ===================  SINGLE USER STAT  ===========================
const singleUserStat = async (req, res) => {
    const { userId } = req.params;
    try {
        let totalOrder = 0;
        let totalReview = 0;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: 'No user match' });
        }
        const orders = await Order.find({ user: user._id }, { createDate: 1 });
        const reviews = await Review.find({ user: user._id }, { createDate: 1 });

        totalReview = reviews.length;
        totalOrder = orders.length;

        return res.status(StatusCodes.OK).json({ totalOrder, totalReview });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err });
    }
};

// ** ===================  BANNER STAT  ===========================
const bannerStat = async (req, res) => {
    try {
        let activeBanner = 0;
        let pendingBanner = 0;
        let stopBanner = 0;

        const banner = await Banner.find(null, { startDate: 1, endDate: 1 });
        const now = new Date().getTime();
        for (let i = 0; i < banner.length; i++) {
            if (banner[i].startDate > now) {
                pendingBanner++;
            }
            if (banner[i].endDate < now) {
                stopBanner++;
            }
            if (banner[i].startDate <= now && banner[i].endDate >= now) {
                activeBanner++;
            }
        }

        return res.status(StatusCodes.OK).json({ stopBanner, pendingBanner, activeBanner });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err });
    }
};
module.exports = {
    userStat,
    productStat,
    orderStat,
    reviewStat,
    saleStat,
    totalProduct,
    totalCate,
    avgStar,
    userAprBlk,
    shopStat,
    orderTypeCount,
    reportTypeCount,
    singleShopStat,
    singleUserStat,
    bannerStat,
};
