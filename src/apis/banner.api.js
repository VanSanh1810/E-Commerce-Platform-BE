const User = require('../models/user.model');
const Banner = require('../models/banner.model');
const Category = require('../models/category.model');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const path = require('path');
const fs = require('fs');
const { format } = require('date-fns');
const { createTokenUser, attachCookiesToResponse, checkPermissions } = require('../utils');
const { isObjectIdOrHexString } = require('mongoose');

//** ======================== Update user password ========================
const createBanner = async (req, res) => {
    const { title, desc, discount, maxValue, startDate, endDate, category } = req.body;
    const images = req.file;
    try {
        const cate = await Category.findById(category);
        if (!cate)
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ status: 'error', data: { message: 'No category found' } });
        //
        const banner = new Banner();
        banner.title = title;
        banner.description = desc;
        banner.category = cate._id;
        banner.discount = parseFloat(discount);
        banner.maxValue = parseFloat(maxValue);
        banner.startDate = parseInt(startDate);
        banner.endDate = parseInt(endDate);
        banner.image = {
            url: `${process.env.BASE_URL}/public/uploads/${path.basename(images.path)}`,
        };
        await banner.save();
        return res.status(StatusCodes.OK).json({ status: 'success', data: { message: 'Banner create' } });
    } catch (e) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: e } });
    }
};

const updateBanner = async (req, res) => {
    const { bannerId } = req.params;
    const bannerData = req.body;
    const images = req.file;
    try {
        const banner = await Banner.findById(bannerId);
        if (!banner) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: 'No banner found' });
        }

        if (bannerData.category) {
            const category = await Category.findById(bannerData.category);
            if (!category) {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: 'No category found' });
            }
            banner.category = category._id;
        }

        if (images) {
            if (banner.image) {
                const updloadDir = './public/uploads';
                const array = banner.image.url.split('/');
                const imgName = array[array.length - 1];
                const imgPath = path.join(__dirname, '..', updloadDir, imgName);
                if (fs.existsSync(imgPath)) {
                    fs.unlinkSync(imgPath);
                    console.log(imgPath, '+ banner img deleted');
                } else {
                    console.log(imgPath, '+ no img deleted');
                }
            }
            banner.image = {
                url: `${process.env.BASE_URL}/public/uploads/${path.basename(images.path)}`,
            };
        }
        if (bannerData.title) {
            banner.title = bannerData.title;
        }
        if (bannerData.discount) {
            banner.discount = bannerData.discount;
        }
        if (bannerData.maxValue) {
            banner.maxValue = bannerData.maxValue;
        }
        if (bannerData.desc) {
            banner.description = bannerData.desc;
        }
        if (bannerData.startDate) {
            banner.startDate = bannerData.startDate;
        }
        if (bannerData.endDate) {
            banner.endDate = bannerData.endDate;
        }
        await banner.save();
        return res.status(StatusCodes.OK).json({ status: 'success', data: { message: 'Banner update' } });
    } catch (e) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: e });
    }
};

const deleteBanner = async (req, res) => {
    const { bannerId } = req.params;
    try {
        const banner = await Banner.findById(bannerId);
        if (!banner) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: 'No banner found' });
        }
        if (banner.image) {
            const updloadDir = './public/uploads';
            const array = banner.image.url.split('/');
            const imgName = array[array.length - 1];
            const imgPath = path.join(__dirname, '..', updloadDir, imgName);
            if (fs.existsSync(imgPath)) {
                fs.unlinkSync(imgPath);
                console.log(imgPath, '+ banner img deleted');
            } else {
                console.log(imgPath, '+ no img deleted');
            }
        }

        await banner.delete();
        return res.status(StatusCodes.OK).json({ status: 'success', data: { message: 'Banner delete' } });
    } catch (e) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: e });
    }
};

const getAllBanner = async (req, res) => {
    const bannerQuery = req.query;
    try {
        let query = {};
        const now = new Date().getTime();
        if (bannerQuery.searchStatus) {
            switch (bannerQuery.searchStatus) {
                case 'All':
                    break;
                case 'End':
                    query = { endDate: { $lt: now } };
                    break;
                case 'Pending':
                    query = { startDate: { $gt: now } };
                    break;
                case 'Active':
                    query = { startDate: { $lte: now }, endDate: { $gte: now } };
                    break;
                default:
                    break;
            }
        }
        let query2 = {};
        const sourcePort = req.headers.origin.split(':')[2]; // Lấy phần tử thứ 2 sau dấu ':'

        // In ra số cổng nguồn
        if (sourcePort === '3006') {
            // Nếu role là 'vendor', query rỗng
        } else {
            query2 = { startDate: { $lte: now }, endDate: { $gte: now } };
        }
        const result = await Banner.find({ $and: [query, query2] }).populate('category', 'name');
        let resultPage = [];
        if (bannerQuery?.currentPage) {
            const startIndex = (parseInt(bannerQuery.currentPage) - 1) * parseInt(bannerQuery.limit);
            const endIndex = startIndex + parseInt(bannerQuery.limit);
            const filteredProducts = result.slice(startIndex, endIndex);
            resultPage = [...filteredProducts];
        } else {
            resultPage = [...result];
        }
        res.status(StatusCodes.OK).json({ status: 'success', data: resultPage, pages: result.length });
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: err });
    }
};

const getBannerDetail = async (req, res) => {
    const { cateId } = req.params;
    try {
        const category = await Category.findById(cateId);
        if (!category) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: 'No cate found' });
        }
        //
        const getAllRelatedCategory = async (rootCate) => {
            let listRelatedCategory = [];
            const recursiveAtion = async (cateId) => {
                const cate = await Category.findById(cateId);
                if (!cate) return;
                listRelatedCategory.push(cate.id);
                if (cate && cate.child.length > 0) {
                    for (let i = 0; i < cate.child.length; i++) {
                        await recursiveAtion(cate.child[i]);
                    }
                }
            };
            await recursiveAtion(rootCate);
            return listRelatedCategory;
        };
        //
        const listBanner = await Banner.find();
        let discount;
        let maxValue;
        for (let i = 0; i < listBanner.length; i++) {
            const cateChild = await getAllRelatedCategory(listBanner[i].category);
            if (
                cateChild.includes(category.id) &&
                listBanner[i].endDate >= new Date().getTime() &&
                listBanner[i].createDate <= new Date().getTime()
            ) {
                discount = listBanner[i].discount;
                maxValue = listBanner[i].maxValue;
                break;
            }
        }
        res.status(StatusCodes.OK).json({ status: 'success', voucherData: { discount, maxValue } });
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: err });
    }
};
module.exports = {
    createBanner,
    updateBanner,
    deleteBanner,
    getBannerDetail,
    getAllBanner,
};
