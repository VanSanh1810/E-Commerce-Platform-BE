const Category = require('../models/category.model');
const Shop = require('../models/shop.model');
const User = require('../models/user.model');
const Address = require('../models/address.model');
const CustomError = require('../errors');
const { format } = require('date-fns');
const { StatusCodes } = require('http-status-codes');
const Product = require('../models/product.model');

// ** ===================  GET ALL SHOP  ===================
const getAllShops = async (req, res) => {
    try {
        const listShop = await Shop.find().populate('addresses');
        res.status(StatusCodes.OK).json({ status: 'success', data: { shops: listShop } });
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
        const shop = await Shop.findById(id).populate('addresses');
        // console.log('ID: ', shop);
        if (!shop) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: 'No shop found' } });
        }
        return res.status(StatusCodes.OK).json({ status: 'success', data: { shop: shop } });
    } catch (e) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: e } });
    }
};

// ** ===================  UPDATE SINGLE SHOP  ===================
const updateSingleShop = async (req, res) => {
    const { userId } = req.user;
    const { name, email, description, addressData } = req.body;
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
        if (addressData) {
            if (shop.addresses) {
                const address = await Address.findById(shop.addresses);
                if (!address) {
                    return res
                        .status(StatusCodes.INTERNAL_SERVER_ERROR)
                        .json({ status: 'error', data: { message: 'No address found' } });
                }
                address.address = addressData;
                await address.save();
            } else {
                const newAddress = await Address.create({
                    name: null,
                    address: addressData,
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
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'success', data: { message: err } });
    }
};
module.exports = {
    getAllShops,
    getSingleShops,
    updateSingleShop,
};
