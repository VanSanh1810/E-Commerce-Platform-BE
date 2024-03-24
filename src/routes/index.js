const authRouter = require('./auth.route');
const categoryRoute = require('./category.route');
const productRoute = require('./product.route');
const userRoute = require('./user.route');
const reviewRoute = require('./review.route');

function route(app) {
    app.use('/api/auth', authRouter);
    app.use('/api/category', categoryRoute);
    app.use('/api/product', productRoute);
    app.use('/api/user', userRoute);
    app.use('/api/review', reviewRoute);
    // app.use('/api', userRouter);
}

module.exports = route;
