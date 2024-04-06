const authRouter = require('./auth.route');
const categoryRoute = require('./category.route');
const productRoute = require('./product.route');
const userRoute = require('./user.route');
const reviewRoute = require('./review.route');
const classifyRoute = require('./classify.route');
const shopRoute = require('./shop.route');
const addressRoute = require('./address.route');
const cartRoute = require('./cart.route');

function route(app) {
    app.use('/api/auth', authRouter);
    app.use('/api/category', categoryRoute);
    app.use('/api/product', productRoute);
    app.use('/api/user', userRoute);
    app.use('/api/review', reviewRoute);
    app.use('/api/classify', classifyRoute);
    app.use('/api/shop', shopRoute);
    app.use('/api/address', addressRoute);
    app.use('/api/cart', cartRoute);
}

module.exports = route;
