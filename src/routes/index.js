const authRouter = require('./auth.route');
const categoryRoute = require('./category.route');
const productRoute = require('./product.route');
const userRoute = require('./user.route');
const reviewRoute = require('./review.route');
const classifyRoute = require('./classify.route');
const shopRoute = require('./shop.route');
const addressRoute = require('./address.route');
const cartRoute = require('./cart.route');
const orderRoute = require('./order.route');
const reportRoute = require('./report.route');
const statRoute = require('./dataStatistics.route');
const bannerRoute = require('./banner.route');
const notifyRoute = require('./notification.route');
const resetPassRoute = require('./resetPass.route');
const conversationRoute = require('./conversation.route');
const shipCostRoute = require('./shipCost.route');
const transactionRoute = require('./transaction.route');
const { trackingOrder } = require('../controllers/order.controller');
const socketService = require('../services/socket.service');
const { saveNotifyToDb } = require('../utils/notification.util');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const { isTokenValid } = require('../utils');
const userModel = require('../models/user.model');

function route(app) {
    app.use('/api/auth', authRouter);
    app.use('/api/notify', notifyRoute);
    app.use('/api/category', categoryRoute);
    app.use('/api/product', productRoute);
    app.use('/api/user', userRoute);
    app.use('/api/review', reviewRoute);
    app.use('/api/classify', classifyRoute);
    app.use('/api/shop', shopRoute);
    app.use('/api/address', addressRoute);
    app.use('/api/cart', cartRoute);
    app.use('/api/order', orderRoute);
    app.use('/api/report', reportRoute);
    app.use('/api/banner', bannerRoute);
    app.use('/api/stat', statRoute);
    app.get('/orderTracking/:orderCode', trackingOrder);
    app.use('/resetPassword', resetPassRoute);
    app.use('/api/conversation', conversationRoute);
    app.use('/api/shipCost', shipCostRoute);
    app.use('/api/transaction', transactionRoute);
    //
    app.get('/verifyEmail', async (req, res) => {
        const { token } = req.query;
        try {
            const decodedToken = await isTokenValid({ token: token });
            const user = await userModel.findById(decodedToken.userId);
            if (!user) {
                console.log('User not found');
            }
            user.isVerified = true;
            await user.save();
            console.log(decodedToken);
            return res.render('verifyEmail', { token: token });
        } catch (e) {
            return res.render('verifyEmail', { expried: true });
        }
    });
    //
    app.get('/test', async (req, res) => {
        await saveNotifyToDb(['6600d0d240368b9bb27ebb14'], {
            title: `<p>You have new review with 5 star</p>`,
            target: { id: null, type: 'None' },
        });
        res.status(200).json({ msg: 'ok' });
    });
    app.get('/test2', async (req, res) => {
        const socketObj = socketService.getUserSocket();
        if (socketObj['662b762db1d24b962c71a12d']?.userId) {
            socketObj['662b762db1d24b962c71a12d'].socketInstance.emit('receive-message', {
                createDate: new Date().getTime(),
            });
        }
        res.status(200).json({ msg: 'ok' });
    });
    app.get('/fixData', async (req, res) => {
        const products = await Product.find();
        for (let i = 0; i < products.length; i++) {
            const cate = await Category.findById(products[i].category);
            if (!cate) {
                const tempCate = await Category.findById('6627c72657be892f7f3683ce');
                products[i].category = tempCate._id;
                await products[i].save();
            }
        }
        return res.status(200).json({ message: 'ok' });
    });
}

module.exports = route;
