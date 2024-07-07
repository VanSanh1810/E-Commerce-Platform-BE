const mongoose = require('mongoose');
require('dotenv').config();
const addressData = require('../mock/json/FinalProject.addresses.json');
const bannersData = require('../mock/json/FinalProject.banners.json');
const cartsData = require('../mock/json/FinalProject.carts.json');
const categoriesData = require('../mock/json/FinalProject.categories.json');
const classifiesData = require('../mock/json/FinalProject.classifies.json');
const conversationsData = require('../mock/json/FinalProject.conversations.json');
const notifiesData = require('../mock/json/FinalProject.notifies.json');
const ordersData = require('../mock/json/FinalProject.orders.json');
const productsData = require('../mock/json/FinalProject.products.json');
const productSnapShotsData = require('../mock/json/FinalProject.productsnapshots.json');
const reportsData = require('../mock/json/FinalProject.reports.json');
const reviewsData = require('../mock/json/FinalProject.reviews.json');
const shopsData = require('../mock/json/FinalProject.shops.json');
const usersData = require('../mock/json/FinalProject.users.json');
//
const addressModel = require('../models/address.model');
const Banner = require('../models/banner.model');
const Cart = require('../models/cart.model');
const Category = require('../models/category.model');
const Classify = require('../models/classify.model');
const Conversation = require('../models/conversation.model');
const Notify = require('../models/notification.model');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const ProductSnapshot = require('../models/productSnapShot.model');
const Report = require('../models/report.model');
const reviewModel = require('../models/review.model');
const Shop = require('../models/shop.model');
const userModel = require('../models/user.model');

const genMockData = async () => {
    try {
        // establish connection
        await mongoose.connect(process.env.MONGO_URL);
        //normalization data

        function convertObject(obj) {
            if (Array.isArray(obj)) {
                return obj.map(convertObject);
            } else if (obj !== null && typeof obj === 'object') {
                if (obj.$oid) {
                    return mongoose.Types.ObjectId(obj.$oid);
                } else if (obj.$numberLong) {
                    return parseInt(obj.$numberLong, 10);
                } else {
                    const newObj = {};
                    for (const key in obj) {
                        newObj[key] = convertObject(obj[key]);
                    }
                    return newObj;
                }
            } else {
                return obj;
            }
        }

        // //** ======================== Address ========================
        // const normalizedAddress = addressData.map((address) => {});

        // //** ======================== Banner ========================
        // const normalizedBanner = bannersData.map((banner) => {});

        // //** ======================== Cart ========================
        // const normalizedCart = cartsData.map((cart) => {});

        // //** ======================== Category ========================
        // const normalizedCategory = categoriesData.map((category) => {});

        // //** ======================== Classify ========================
        // const normalizedClassify = classifiesData.map((classify) => {});

        // //** ======================== Conversation ========================
        // const normalizedConversation = conversationsData.map((conversation) => {});

        // //** ======================== Notify ========================
        // const normalizedNotify = notifiesData.map((notify) => {});

        // //** ======================== Order ========================
        // const normalizedOrder = ordersData.map((order) => {});

        // //** ======================== Product ========================
        // const normalizedProduct = productsData.map((product) => {});

        // //** ======================== ProductSnapshot ========================
        // const normalizedProductSnapShot = productSnapShotsData.map((productSnapshot) => {});

        // //** ======================== Report ========================
        // const normalizedReport = reportsData.map((report) => {});

        // //** ======================== Review ========================
        // const normalizedReview = reviewsData.map((review) => {});

        // //** ======================== Shop ========================
        // const normalizedShop = shopsData.map((shop) => {});

        // //** ======================== User ========================
        // const normalizedUser = usersData.map((user) => {
        //     if (user._id && user._id.$oid) {
        //         user._id = mongose.Types.ObjectId(user._id.$oid);
        //     }
        //     if (user.cart && user.cart.$oid) {
        //         user.cart = mongose.Types.ObjectId(user.cart.$oid);
        //     }

        //     if (user.shop && user.shop.$oid) {
        //         user.shop = mongose.Types.ObjectId(user.shop.$oid);
        //     }
        //     return user;
        // });

        // generate data

        Promise.all([
            addressModel.insertMany(convertObject(addressData)),
            Banner.insertMany(convertObject(bannersData)),
            Cart.insertMany(convertObject(cartsData)),
            Category.insertMany(convertObject(categoriesData)),
            Classify.insertMany(convertObject(classifiesData)),
            Conversation.insertMany(convertObject(conversationsData)),
            Notify.insertMany(convertObject(notifiesData)),
            Order.insertMany(convertObject(ordersData)),
            Product.insertMany(convertObject(productsData)),
            ProductSnapshot.insertMany(convertObject(productSnapShotsData)),
            Report.insertMany(convertObject(reportsData)),
            reviewModel.insertMany(convertObject(reviewsData)),
            Shop.insertMany(convertObject(shopsData)),
            userModel.insertMany(convertObject(usersData)),
        ])
            .then((res) => {
                console.log('Data created successfully ! ');
                console.log(res);
            })
            .catch((err) => {
                console.log('Create data error : ');
                console.log(err);
            });
    } catch (e) {
        console.log('Establish connection error : ');
        console.log(e);
    }
};

genMockData();
