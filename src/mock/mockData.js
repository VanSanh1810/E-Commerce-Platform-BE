const mongose = require('mongoose');
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
        await mongose.connect(process.env.MONGO_URL);
        Promise.all([
            addressModel.insertMany(addressData),
            Banner.insertMany(bannersData),
            Cart.insertMany(cartsData),
            Category.insertMany(categoriesData),
            Classify.insertMany(classifiesData),
            Conversation.insertMany(conversationsData),
            Notify.insertMany(notifiesData),
            Order.insertMany(ordersData),
            Product.insertMany(productsData),
            ProductSnapshot.insertMany(productSnapShotsData),
            Report.insertMany(reportsData),
            reviewModel.insertMany(reviewsData),
            Shop.insertMany(shopsData),
            userModel.insertMany(usersData),
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
