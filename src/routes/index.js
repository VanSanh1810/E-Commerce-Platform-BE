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
const { trackingOrder } = require('../controllers/order.controller');
const socketService = require('../services/socket.service');
const { saveNotifyToDb } = require('../utils/notification.util');

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
    app.get('/test', async (req, res) => {
        await saveNotifyToDb(['6600d0d240368b9bb27ebb14'], {
            title: `<p>You have new review with 5 star</p>`,
            target: { id: null, type: 'None' },
        });
        res.status(200).json({ msg: 'ok' });
    });
}

module.exports = route;
