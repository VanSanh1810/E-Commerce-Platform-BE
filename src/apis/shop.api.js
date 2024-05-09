const Category = require('../models/category.model');
const Shop = require('../models/shop.model');
const User = require('../models/user.model');
const Address = require('../models/address.model');
const Review = require('../models/review.model');
const CustomError = require('../errors');
const { format } = require('date-fns');
const { StatusCodes } = require('http-status-codes');
const Product = require('../models/product.model');
const fs = require('fs');
const path = require('path');
const { isObjectIdOrHexString } = require('mongoose');

// ** ===================  GET ALL SHOP  ===================
const getAllShops = async (req, res) => {
    const shopQuery = req.query;
    try {
        let query = {};

        if (shopQuery?.searchText?.trim() !== '') {
            if (isObjectIdOrHexString(shopQuery.searchText, 'i')) {
                query = {
                    $or: [
                        { _id: { $regex: shopQuery.searchText, $options: 'i' } },
                        { name: { $regex: shopQuery.searchText, $options: 'i' } },
                        { email: { $regex: shopQuery.searchText, $options: 'i' } },
                    ],
                };
            } else {
                query = {
                    $or: [{ name: new RegExp(shopQuery.searchText, 'i') }, { email: new RegExp(shopQuery.searchText, 'i') }],
                };
            }
        }
        let listShop = await Shop.find(query).populate('addresses').populate('vendor', 'name');

        if (listShop.length === 0) {
            return res.status(StatusCodes.OK).json({ status: 'success', data: { shops: [] }, pages: 0 });
        }

        const total = listShop.length;

        if (shopQuery?.currentPage) {
            const startIndex = (parseInt(shopQuery.currentPage) - 1) * parseInt(shopQuery.limit);
            const endIndex = startIndex + parseInt(shopQuery.limit);
            const filteredProducts = listShop.slice(startIndex, endIndex);
            listShop = [...filteredProducts];
        }
        res.status(StatusCodes.OK).json({ status: 'success', data: { shops: listShop }, pages: total });
    } catch (error) {
        console.error(error.stack);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: 'Lỗi server' } });
    }
};

// ** ===================  GET SINGLE SHOP  ===================
const getSingleShops = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: 'No shopId provide' } });
    }
    try {
        const shop = await Shop.findById(id).populate('addresses').populate('vendor', 'name').populate('classify', 'name');
        console.log('ID: ', shop._id);
        if (!shop) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: 'No shop found' } });
        }

        const shopProducts = await Product.find({ shop: shop._id });

        let totalRating = 0;
        let totalReviews = 0;
        for (let i = 0; i < shopProducts.length; i++) {
            const reviewList = await Review.find({ product: shopProducts[i]._id });
            totalReviews += reviewList.length;
            totalRating += reviewList.reduce((sum, review) => sum + review.rating, 0);
        }
        const averageShopReview = totalReviews === 0 ? 0 : totalRating / totalReviews;

        const followers = await User.find({ follow: shop._id }, { _id: 1 });
        let totalFollowers = 0;
        let isFollow = false;
        if (followers && followers.length > 0) {
            totalFollowers = followers.length;
            if (req.user?.userId && followers.findIndex((u) => u._id === req.user?.userId)) {
                isFollow = true;
            }
        }

        const totalProduct = shopProducts.length;
        return res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
                shop: shop,
                averageShopReview: averageShopReview,
                totalProduct: totalProduct,
                totalFollowers: totalFollowers,
            },
            isFollow: isFollow,
        });
    } catch (e) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: e } });
    }
};

// ** ===================  UPDATE SINGLE SHOP  ===================
const updateSingleShop = async (req, res) => {
    const { userId } = req.user;
    const { name, email, description, addressData } = req.body;
    const images = req.file;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: 'No user found' } });
        }
        const shop = await Shop.findById(user.shop);
        if (!shop) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: 'No shop found' } });
        }
        if (name) {
            shop.name = name;
        }
        if (email) {
            shop.email = email;
        }
        if (description) {
            shop.description = description;
        }
        if (images) {
            if (shop.avatar) {
                const updloadDir = './public/uploads';
                const array = shop.avatar.url.split('/');
                const imgName = array[array.length - 1];
                const imgPath = path.join(__dirname, '..', updloadDir, imgName);
                if (fs.existsSync(imgPath)) {
                    fs.unlinkSync(imgPath);
                    console.log(imgPath, '+ shop img deleted');
                } else {
                    console.log(imgPath, '+ no img deleted');
                }
            }
            shop.avatar = {
                url: `http://localhost:4000/public/uploads/${path.basename(images.path)}`,
            };
        }
        if (addressData) {
            if (shop.addresses) {
                const address = await Address.findById(shop.addresses);
                if (!address) {
                    return res
                        .status(StatusCodes.INTERNAL_SERVER_ERROR)
                        .json({ status: 'error', data: { message: 'No address found' } });
                }
                address.address = JSON.parse(addressData);
                await address.save();
            } else {
                const newAddress = await Address.create({
                    name: null,
                    address: JSON.parse(addressData),
                    phone: '0',
                    isHome: false,
                    isWork: false,
                });
                shop.addresses = newAddress._id;
            }
        }
        await shop.save();
        return res.status(StatusCodes.OK).json({ status: 'success', data: { message: 'Shop updated' } });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: err } });
    }
};

// ** ===================  CHANGE SHOP STATUS  ===================
const changeShopStatus = async (req, res) => {
    const status = req.query.status;
    const { id } = req.params;
    const { role } = req.user;
    try {
        if (!id) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: 'No id provide' } });
        }
        const shop = await Shop.findById(id);
        if (!shop) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: 'No shop found' } });
        }
        if (!status || (status !== 'active' && status !== 'banned' && status !== 'stop')) {
            return res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'error', data: { message: 'status provide invalid' } });
        }

        if (shop.status === 'banned') {
            if (role !== 'admin') {
                return res
                    .status(StatusCodes.UNAUTHORIZED)
                    .json({ status: 'error', data: { message: 'Your shop is curently banned' } });
            }
        }
        shop.status = status;
        await shop.save();
        return res.status(StatusCodes.OK).json({ status: 'error', data: { message: 'Shop status updated' } });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { err: err } });
    }
};

// ** ===================  FOLLOW SHOP ===================
const followShop = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { err: 'No user found' } });
        }

        const shop = await Shop.findById(id);
        if (!shop) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { err: 'No shop found' } });
        }
        const index = user.follow.findIndex((itm) => shop._id.equals(itm));
        if (index !== -1) {
            // user.follow.splice(shop._id);
            const newArr = user.follow.filter((item, i) => i !== index);
            user.follow = [...newArr];
        } else {
            user.follow.push(shop._id);
        }
        await user.save();
        return res.status(StatusCodes.OK).json({ status: 'success' });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { err } });
    }
};

module.exports = {
    getAllShops,
    getSingleShops,
    updateSingleShop,
    changeShopStatus,
    followShop,
};
