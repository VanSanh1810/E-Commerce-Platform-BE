const mongoose = require('mongoose');
const User = require('../models/user.model');
const Shop = require('../models/shop.model');
const Order = require('../models/order.model');
const Add = require('../models/cart.model');
const Address = require('../models/address.model');
const Product = require('../models/product.model');
const ProductSnapshot = require('../models/productSnapShot.model');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');
const fs = require('fs');
const { format } = require('date-fns');
const { createTokenUser, attachCookiesToResponse, checkPermissions } = require('../utils');
const { sortObject, generateVNPayUrl } = require('../services/vnPay.service');
const { sendEmail } = require('../services/sendMail.service');
let config = require('config');
let querystring = require('qs');
let crypto = require('crypto');
const moment = require('moment'); // Thêm moment nếu bạn cần xử lý ngày giờ
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();

const updateProductStockWhenPlacedOrder = async (id, variant, quantity) => {
    try {
        const product = await Product.findById(id);
        if (!product) {
            return false;
        }
        if (variant && variant.length > 0) {
            const changeVariantDetailStock = async (node, depth, route) => {
                if (node.detail) {
                    node.detail.stock = node.detail.stock - quantity >= 0 ? node.detail.stock - quantity : 0;
                } else {
                    for (let i = 0; i < node.child.length; i++) {
                        if (node.child[i]._id === route[depth + 1]) {
                            await changeVariantDetailStock(node.child[i], depth + 1, route);
                            break;
                        }
                    }
                }
            };
            const dbProductVariant = JSON.parse(JSON.stringify(product.variantDetail));
            for (let i = 0; i < dbProductVariant.length; i++) {
                if (dbProductVariant[i]._id === variant[0]) {
                    await changeVariantDetailStock(dbProductVariant[i], 0, variant);
                    break;
                }
            }
            product.variantDetail = [...dbProductVariant];
        } else {
            product.stock = product.stock - quantity >= 0 ? product.stock - quantity : 0;
        }
        await product.save();
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

const genarateOrderCode = (payment, userType, id) => {
    const lastFiveChars = id.toString().slice(-5);
    return `NP-${payment ? '0' : '1'}${userType ? '1' : '0'}-${lastFiveChars.toUpperCase()}`;
};

//** ======================== PLACE ORDER ========================
const placeOrder = async (req, res, next) => {
    const bodyData = req.body;
    if (req.user?.userId) {
        // buy with logging in
        // const session = await mongoose.startSession();
        // session.startTransaction();
        try {
            let orderAddressData = {};
            if (bodyData.address.type) {
                // user address
                const address = await Address.findById(bodyData.address.data);
                if (!address) {
                    return res
                        .status(StatusCodes.INTERNAL_SERVER_ERROR)
                        .json({ status: 'success', data: { err: 'No address found' } });
                }
                const user = await User.findById(req.user.userId);
                if (!user) {
                    return res
                        .status(StatusCodes.INTERNAL_SERVER_ERROR)
                        .json({ status: 'success', data: { err: 'No user found' } });
                }
                orderAddressData.email = user.email;
                orderAddressData.phone = address.phone;
                orderAddressData.province = address.address.province;
                orderAddressData.district = address.address.district;
                orderAddressData.ward = address.address.ward;
                orderAddressData.detail = address.address.detail;
                orderAddressData.name = address.name;
                orderAddressData.isWork = address.isWork;
                orderAddressData.isHome = address.isHome;
            } else {
                // new address
                const newAddressData = { ...bodyData.address.data };
                orderAddressData.email = bodyData.address.email;
                orderAddressData.phone = newAddressData.phone;
                orderAddressData.province = newAddressData.province;
                orderAddressData.district = newAddressData.district;
                orderAddressData.ward = newAddressData.ward;
                orderAddressData.detail = newAddressData.detail;
                orderAddressData.name = newAddressData.name;
                orderAddressData.isWork = newAddressData.isWork;
                orderAddressData.isHome = newAddressData.isHome;
            }
            // create order for each shop
            const paymentDataToProcess = [];
            for (let i = 0; i < bodyData.itemData.length; i++) {
                // const order = new Order().$session(session);
                const order = new Order();
                //
                const shopObj = bodyData.itemData[i].shop;
                const shopItems = [...bodyData.itemData[i].items];
                //
                const orderItems = [];
                let totalPrice = 0;
                for (let j = 0; j < shopItems.length; j++) {
                    const accessVariantDetail = async (node, depth, route) => {
                        if (node.detail) {
                            const price =
                                parseFloat(node.detail.disPrice) && parseFloat(node.detail.disPrice) > 0
                                    ? parseFloat(node.detail.disPrice)
                                    : parseFloat(node.detail.price);
                            return price;
                        } else {
                            for (let i = 0; i < node.child.length; i++) {
                                if (node.child[i]._id === route[depth + 1]) {
                                    return await accessVariantDetail(node.child[i], depth + 1, route);
                                }
                            }
                        }
                    };
                    //
                    const realProductVariant = shopItems[j].variant;
                    //
                    let productPrice;
                    const realProduct = await Product.findById(shopItems[j].product).select(
                        'images name price discountPrice stock variantData variantDetail',
                    );
                    // get product price
                    if (realProductVariant && realProductVariant.length > 0) {
                        for (let k = 0; k < realProduct.variantDetail.length; k++) {
                            if (realProduct.variantDetail[k]._id === realProductVariant[0]) {
                                productPrice = await accessVariantDetail(realProduct.variantDetail[k], 0, [
                                    ...realProductVariant,
                                ]);
                                break;
                            }
                        }
                    } else {
                        productPrice =
                            realProduct.discountPrice && realProduct.discountPrice > 0
                                ? realProduct.discountPrice
                                : realProduct.price;
                    }
                    //update stock
                    updateProductStockWhenPlacedOrder(shopItems[j].product, shopItems[j].variant, shopItems[j].quantity);
                    const realProductObj = realProduct.toObject();
                    delete realProductObj.price;
                    delete realProductObj.discountPrice;
                    delete realProductObj.stock;
                    delete realProductObj.variantDetail;
                    //create product snapshot

                    const productSnapshot = await ProductSnapshot.findOneAndUpdate(
                        { productJson: JSON.stringify(realProductObj) },
                        { $set: { productId: realProduct._id, productJson: JSON.stringify(realProductObj) } },
                        { upsert: true, new: true, returnOriginal: false },
                    );

                    orderItems.push({
                        idToSnapshot: productSnapshot._id,
                        image: realProductObj.images[0].url,
                        name: realProductObj.name,
                        variant: [...realProductVariant],
                        quantity: shopItems[j].quantity,
                        price: productPrice,
                    });
                    totalPrice += shopItems[j].quantity * productPrice;
                }
                // create order
                order.user = req.user.userId;
                order.shop = shopObj._id;
                order.note = bodyData.itemData[i].note;
                order.items = [...orderItems];
                order.name = orderAddressData.name;
                order.email = orderAddressData.email;
                order.total = totalPrice;
                order.totalItem = orderItems.length;
                order.address = {
                    province: orderAddressData.province,
                    district: orderAddressData.district,
                    ward: orderAddressData.ward,
                    detail: orderAddressData.detail,
                    isWork: orderAddressData.isWork,
                    isHome: orderAddressData.isHome,
                };
                order.phoneNumber = orderAddressData.phone;
                order.code = genarateOrderCode(bodyData.paymentMethod, true, order._id);
                paymentDataToProcess.push({ orderId: order._id, price: totalPrice });
                await order.save();
                //send mail
                sendEmail('sanhnguyen734@gmail.com', order._id);
                // payment
                if (!bodyData.paymentMethod) {
                    let date = new Date();
                    let createDate = moment(date).format('YYYYMMDDHHmmss'); // Sử dụng thư viện date-fns hoặc tương tự để định dạng ngày
                    const paymentData = {
                        amount: totalPrice, // Tổng số tiền của đơn hàng
                        orderId: JSON.stringify([{ orderId: order._id, price: totalPrice }]), // ID của đơn hàng mới tạo
                        description: 'Thanh toan cho ma GD:' + order._id, // Mô tả đơn hàng
                        ipAddress: req.ip, // IP của khách hàng đặt hàng
                        createDate: createDate, // Ngày giờ tạo đơn hàng theo định dạng VNPay
                    };
                    // Gọi hàm generateVNPayUrl từ service VNPay để tạo URL thanh toán
                    const redirectUrl = generateVNPayUrl(paymentData);
                    order.paymentUrl = redirectUrl;
                    order.onlPayStatus = 'Pending';
                    order.save();
                }
            }
            if (!bodyData.paymentMethod) {
                const allOrderPrice = await paymentDataToProcess.reduce(
                    (accumulator, currentValue) => accumulator + currentValue.price,
                    0,
                );
                const description = paymentDataToProcess.map((paymentData) => {
                    return paymentData.orderId + ' ';
                });
                let date = new Date();
                let createDate = moment(date).format('YYYYMMDDHHmmss'); // Sử dụng thư viện date-fns hoặc tương tự để định dạng ngày
                const paymentData = {
                    amount: allOrderPrice, // Tổng số tiền của đơn hàng
                    orderId: JSON.stringify([...paymentDataToProcess]), // ID của đơn hàng mới tạo
                    description: 'Thanh toan cho ma GD:' + description, // Mô tả đơn hàng
                    ipAddress: req.ip, // IP của khách hàng đặt hàng
                    createDate: createDate, // Ngày giờ tạo đơn hàng theo định dạng VNPay
                };
                // Gọi hàm generateVNPayUrl từ service VNPay để tạo URL thanh toán
                const redirectUrl = generateVNPayUrl(paymentData);
                return res.status(StatusCodes.OK).json({ status: 'success', url: redirectUrl });
            }
            // Lưu các thay đổi vào cơ sở dữ liệu
            // await session.commitTransaction();
            // console.log('Transaction committed');
            return res.status(StatusCodes.OK).json({ status: 'success', data: { msg: 'Order created' } });
        } catch (err) {
            // await session.abortTransaction();
            // console.error('Transaction aborted:', err);
            // // Kết thúc session
            // session.endSession();
            console.log(err);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'success', data: { err: err } });
        }
    } else {
        // buy without logging in
        try {
            let orderAddressData = {};
            if (!bodyData.address.type) {
                // user address
                // new address
                const newAddressData = { ...bodyData.address.data };
                orderAddressData.email = bodyData.address.email;
                orderAddressData.phone = newAddressData.phone;
                orderAddressData.province = newAddressData.province;
                orderAddressData.district = newAddressData.district;
                orderAddressData.ward = newAddressData.ward;
                orderAddressData.detail = newAddressData.detail;
                orderAddressData.name = newAddressData.name;
                orderAddressData.isWork = newAddressData.isWork;
                orderAddressData.isHome = newAddressData.isHome;
            } else {
                return res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'success', data: { err: 'Unexpected error' } });
            }
            // create order for each shop
            const paymentDataToProcess = [];
            for (let i = 0; i < bodyData.itemData.length; i++) {
                // const order = new Order().$session(session);
                const order = new Order();
                //
                const shopObj = bodyData.itemData[i].shop;
                const shopItems = [...bodyData.itemData[i].items];
                //
                const orderItems = [];
                let totalPrice = 0;
                for (let j = 0; j < shopItems.length; j++) {
                    const accessVariantDetail = async (node, depth, route) => {
                        if (node.detail) {
                            const price =
                                parseFloat(node.detail.disPrice) && parseFloat(node.detail.disPrice) > 0
                                    ? parseFloat(node.detail.disPrice)
                                    : parseFloat(node.detail.price);
                            return price;
                        } else {
                            for (let i = 0; i < node.child.length; i++) {
                                if (node.child[i]._id === route[depth + 1]) {
                                    return await accessVariantDetail(node.child[i], depth + 1, route);
                                }
                            }
                        }
                    };
                    //
                    const realProductVariant = shopItems[j].variant;
                    //
                    let productPrice;
                    const realProduct = await Product.findById(shopItems[j].product).select(
                        'images name price discountPrice stock variantData variantDetail',
                    );
                    // get product price
                    if (realProductVariant && realProductVariant.length > 0) {
                        for (let k = 0; k < realProduct.variantDetail.length; k++) {
                            if (realProduct.variantDetail[k]._id === realProductVariant[0]) {
                                productPrice = await accessVariantDetail(realProduct.variantDetail[k], 0, [
                                    ...realProductVariant,
                                ]);
                                break;
                            }
                        }
                    } else {
                        productPrice =
                            realProduct.discountPrice && realProduct.discountPrice > 0
                                ? realProduct.discountPrice
                                : realProduct.price;
                    }
                    updateProductStockWhenPlacedOrder(shopItems[j].product, shopItems[j].variant, shopItems[j].quantity);
                    const realProductObj = realProduct.toObject();
                    delete realProductObj.price;
                    delete realProductObj.discountPrice;
                    delete realProductObj.stock;
                    delete realProductObj.variantDetail;
                    //create product snapshot
                    const productSnapshot = await ProductSnapshot.findOneAndUpdate(
                        { productJson: JSON.stringify(realProductObj) },
                        { $set: { productId: realProduct._id, productJson: JSON.stringify(realProductObj) } },
                        { upsert: true, new: true, returnOriginal: false },
                    );

                    orderItems.push({
                        idToSnapshot: productSnapshot._id,
                        image: realProductObj.images[0].url,
                        name: realProductObj.name,
                        variant: [...realProductVariant],
                        quantity: shopItems[j].quantity,
                        price: productPrice,
                    });
                    totalPrice += shopItems[j].quantity * productPrice;
                }
                // create order
                order.user = req.user.userId;
                order.shop = shopObj._id;
                order.note = bodyData.itemData[i].note;
                order.items = [...orderItems];
                order.name = orderAddressData.name;
                order.email = orderAddressData.email;
                order.total = totalPrice;
                order.totalItem = orderItems.length;
                order.address = {
                    province: orderAddressData.province,
                    district: orderAddressData.district,
                    ward: orderAddressData.ward,
                    detail: orderAddressData.detail,
                    isWork: orderAddressData.isWork,
                    isHome: orderAddressData.isHome,
                };
                order.code = genarateOrderCode(bodyData.paymentMethod, false, order._id);
                order.phoneNumber = orderAddressData.phone;
                await order.save();
                // payment
                if (!bodyData.paymentMethod) {
                    let date = new Date();
                    let createDate = moment(date).format('YYYYMMDDHHmmss'); // Sử dụng thư viện date-fns hoặc tương tự để định dạng ngày
                    const paymentData = {
                        amount: totalPrice, // Tổng số tiền của đơn hàng
                        orderId: JSON.stringify([{ orderId: order._id, price: totalPrice }]), // ID của đơn hàng mới tạo
                        description: 'Thanh toan cho ma GD:' + order._id, // Mô tả đơn hàng
                        ipAddress: req.ip, // IP của khách hàng đặt hàng
                        createDate: createDate, // Ngày giờ tạo đơn hàng theo định dạng VNPay
                    };
                    // Gọi hàm generateVNPayUrl từ service VNPay để tạo URL thanh toán
                    const redirectUrl = generateVNPayUrl(paymentData);
                    order.paymentUrl = redirectUrl;
                    order.onlPayStatus = 'Pending';
                    order.save();
                }
            }
            // Lưu các thay đổi vào cơ sở dữ liệu
            // await session.commitTransaction();
            // console.log('Transaction committed');
            if (!bodyData.paymentMethod) {
                const allOrderPrice = await paymentDataToProcess.reduce(
                    (accumulator, currentValue) => accumulator + currentValue.price,
                    0,
                );
                const description = paymentDataToProcess.map((paymentData) => {
                    return paymentData.orderId + ' ';
                });
                let date = new Date();
                let createDate = moment(date).format('YYYYMMDDHHmmss'); // Sử dụng thư viện date-fns hoặc tương tự để định dạng ngày
                const paymentData = {
                    amount: allOrderPrice, // Tổng số tiền của đơn hàng
                    orderId: JSON.stringify([...paymentDataToProcess]), // ID của đơn hàng mới tạo
                    description: 'Thanh toan cho ma GD:' + description, // Mô tả đơn hàng
                    ipAddress: req.ip, // IP của khách hàng đặt hàng
                    createDate: createDate, // Ngày giờ tạo đơn hàng theo định dạng VNPay
                };
                // Gọi hàm generateVNPayUrl từ service VNPay để tạo URL thanh toán
                const redirectUrl = generateVNPayUrl(paymentData);
                return res.status(StatusCodes.OK).json({ status: 'success', url: redirectUrl });
            }
            return res.status(StatusCodes.OK).json({ status: 'success', data: { msg: 'Order created' } });
        } catch (err) {
            // await session.abortTransaction();
            // console.error('Transaction aborted:', err);
            // // Kết thúc session
            // session.endSession();
            console.log(err);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'success', data: { err: err } });
        }
    }
};

const vnpINP = async (req, res, next) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);
        const secretKey = config.get('vnp_HashSecret');
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', secretKey);
        const checkSum = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        console.log('Calculated checkSum:', checkSum); // In giá trị checkSum đã tính
        console.log('Received secureHash:', secureHash);
        if (secureHash === checkSum) {
            const orderCode = vnp_Params['vnp_TxnRef'];
            console.log(orderCode);
            const ordersHaveProcess = JSON.parse(decodeURIComponent(orderCode));
            const resultCode = vnp_Params['vnp_ResponseCode'];
            // Giả định bạn đã cập nhật trạng thái trong CSDL tại đây, ví dụ: paymentStatus = '1' hoặc '2'
            if (resultCode === '00') {
                for (let i = 0; i < ordersHaveProcess.length; i++) {
                    const order = await Order.findById(ordersHaveProcess[i].orderId);
                    if (order) {
                        order.onlPayStatus = 'Confirmed';
                    }
                    await order.save();
                }
                res.status(200).json({ RspCode: '00', Message: 'success' });
            } else {
                // Cập nhật trạng thái giao dịch thanh toán thất bại vào CSDL của bạn
                for (let i = 0; i < ordersHaveProcess.length; i++) {
                    const order = await Order.findById(ordersHaveProcess[i].orderId);
                    if (order) {
                        order.onlPayStatus = 'Fail';
                    }
                    await order.save();
                }
                res.status(200).json({ RspCode: resultCode, Message: 'Failure' });
            }
        } else {
            res.status(500).json({ RspCode: '97', Message: 'Checksum failed' });
        }
    } catch (error) {
        console.error('Error processing VNPay callback:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

const getAllOrder = async (req, res) => {
    const { target } = req.query;
    const { userId, role } = req.user;
    try {
        switch (target) {
            case 'adminPage':
                if (!['admin', 'vendor'].includes(role)) {
                    return res.status(StatusCodes.UNAUTHORIZED).json({ status: 'error', message: 'UNAUTHORIZED' });
                }
                const shop = await Shop.findOne({ vendor: userId });
                if (!shop) {
                    return res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'error', message: 'No shop found' });
                }
                const orderListAd = await Order.find({ shop: shop._id })
                    .populate({
                        path: 'items',
                        populate: { path: 'idToSnapshot' }, // 'productSnapshot' là tên trường ref trong items
                    })
                    .populate('shop', ['name', 'email']);
                return res.status(StatusCodes.OK).json({ status: 'success', orders: [...orderListAd] });
            case 'userPage':
                const orderListUs = await Order.find({ user: userId })
                    .populate({
                        path: 'items',
                        populate: { path: 'idToSnapshot' }, // 'productSnapshot' là tên trường ref trong items
                    })
                    .populate('shop', ['name', 'email']);
                return res.status(StatusCodes.OK).json({ status: 'success', orders: [...orderListUs] });
            default:
                return res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'error' });
        }
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', message: error });
    }
};

const getSingleOrder = async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await Order.findById(orderId)
            .populate({
                path: 'items',
                populate: { path: 'idToSnapshot' }, // 'productSnapshot' là tên trường ref trong items
            })
            .populate('shop', ['name', 'email']);
        if (!order) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', message: 'No order found' });
        }
        return res.status(StatusCodes.OK).json({ status: 'error', data: order });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', message: '' });
    }
};

const updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    const { orderId } = req.params;
    try {
        if (status !== 'Done') {
            //vendor action
            if (req.user?.userId && req.user?.role === 'vendor') {
                const order = await Order.findById(orderId);
                if (!order) {
                    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', message: 'No order found' });
                }
                if (order.onlPayStatus !== 'Confirmed' && order.onlPayStatus !== 'None') {
                    return res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'error', message: 'Action invalid' });
                }
                if (order.status === 'Done') {
                    return res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'error', message: 'Action invalid' });
                }
                order.status = status;
                await order.save();
                return res.status(StatusCodes.OK).json({ status: 'success', message: 'Order status updated' });
            } else {
                return res
                    .status(StatusCodes.UNAUTHORIZED)
                    .json({ status: 'error', message: 'You dont have permission to do this' });
            }
        } else {
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', message: 'No order found' });
            }
            if ((order.onlPayStatus === 'Confirmed' || order.onlPayStatus === 'None') && order.status === 'Delivered') {
                order.status = status;
                return res.status(StatusCodes.OK).json({ status: 'success', message: 'Order status updated' });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', message: 'Action invalid' });
        }
    } catch (e) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', message: e });
    }
};

module.exports = {
    placeOrder,
    vnpINP,
    getAllOrder,
    getSingleOrder,
    updateOrderStatus,
};
