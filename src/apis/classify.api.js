const { StatusCodes } = require('http-status-codes');
const Classify = require('../models/classify.model');
const Shop = require('../models/shop.model');
const Product = require('../models/product.model');

const getShopClassify = async (req, res) => {
    const { shopId } = req.params;
    console.log(shopId);
    if (shopId) {
        const listClassify = await Classify.find({ shop: shopId });
        if (listClassify.length > 0) {
            return res.status(StatusCodes.OK).json({ status: 'success', data: [...listClassify] });
        } else {
            return res.status(StatusCodes.OK).json({ status: 'success', data: [] });
        }
    } else {
        return res
            .status(StatusCodes.PRECONDITION_REQUIRED)
            .json({ status: 'error', data: { message: 'Please provide shop query shop classify' } });
    }
};
const createClassify = async (req, res) => {
    const { name } = req.body;
    const { userId } = req.user;
    try {
        if (!name) {
            res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'error', data: { message: 'Lỗi server' } });
        }

        const userShop = await Shop.findOne({ vendor: userId });
        if (!userShop) {
            res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'error', data: { message: 'Người dùng không sở hữu shop !' } });
        }
        const normalizedName = name.trim().toLowerCase();
        const existingClassify = await Classify.find({ shop: userShop.id });

        const matchingClassify = existingClassify.find((classify) => {
            const classifyName = classify.name.trim().toLowerCase();
            // Loại bỏ khoảng trắng giữa các từ trong tên danh mục
            const normalizedClassifyName = classifyName.replace(/\s+/g, '');
            // Loại bỏ khoảng trắng giữa các từ trong tên đã nhập
            const normalizedInputName = normalizedName.replace(/\s+/g, '');

            // So sánh tên danh mục và tên đã nhập đã chuẩn hóa
            return normalizedClassifyName === normalizedInputName;
        });

        if (matchingClassify) {
            // Tìm thấy danh mục khớp
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'error',
                data: { message: 'Classify with the same name already exists.' },
            });
        } else {
            const newClassify = new Classify({
                name: name,
                shop: userShop._id,
            });
            await newClassify.save();
            userShop.classify.push(newClassify._id);
            await userShop.save();
            return res.status(StatusCodes.CREATED).json({
                status: 'success',
                data: { message: 'Create classify success' },
            });
        }
    } catch (error) {
        console.error(error.stack);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: 'Lỗi server' } });
    }
};
const updateClassify = async (req, res) => {
    const { name } = req.body;
    const { classifyId } = req.params;
    const { userId } = req.user;
    try {
        if (!name || !classifyId) {
            res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'error', data: { message: 'Please provide data' } });
        }

        const userShop = await Shop.findOne({ vendor: userId });
        if (!userShop) {
            res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'error', data: { message: 'Người dùng không sở hữu shop !' } });
        }
        const normalizedName = name.trim().toLowerCase();
        const existingClassify = await Classify.find({ shop: userShop.id });

        const matchingClassify = existingClassify.find((classify) => {
            const classifyName = classify.name.trim().toLowerCase();
            // Loại bỏ khoảng trắng giữa các từ trong tên danh mục
            const normalizedClassifyName = classifyName.replace(/\s+/g, '');
            // Loại bỏ khoảng trắng giữa các từ trong tên đã nhập
            const normalizedInputName = normalizedName.replace(/\s+/g, '');

            // So sánh tên danh mục và tên đã nhập đã chuẩn hóa
            return normalizedClassifyName === normalizedInputName;
        });

        if (matchingClassify) {
            // Tìm thấy danh mục khớp
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'error',
                data: { message: 'Classify with the same name already exists.' },
            });
        } else {
            const currentClassify = await Classify.findById(classifyId);
            if (!currentClassify) {
                res.status(StatusCodes.CONFLICT).json({ status: 'error', data: { message: 'Classify not found' } });
            }
            currentClassify.name = name;
            await currentClassify.save();
            return res.status(StatusCodes.CREATED).json({
                status: 'success',
                data: { message: 'Update classify success' },
            });
        }
    } catch (error) {
        console.error(error.stack);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: 'Lỗi server' } });
    }
};
const deleteClassify = async (req, res) => {
    const { classifyId } = req.params;
    const { userId } = req.user;
    try {
        const userShop = await Shop.findOne({ vendor: userId });
        if (!userShop) {
            res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'error', data: { message: 'Người dùng không sở hữu shop !' } });
        }
        const currentClassify = await Classify.findOne({ _id: classifyId, shop: userShop._id });
        if (!currentClassify) {
            res.status(StatusCodes.CONFLICT).json({ status: 'error', data: { message: 'Classify not found' } });
        }
        const classifyRefToRemove = userShop.classify.indexOf(currentClassify._id);
        if (classifyRefToRemove !== -1) {
            userShop.classify.splice(classifyRefToRemove, 1);
        }
        const productList = Product.find({ classify: currentClassify._id, shop: userShop._id });
        await productList.updateMany(
            { classify: currentClassify._id, shop: userShop.id },
            { $set: { classify: null } },
            { multi: true },
        );
        await userShop.save();
        await currentClassify.delete();
        return res.status(StatusCodes.OK).json({
            status: 'success',
            data: { message: 'Delete classify success' },
        });
    } catch (error) {
        console.error(error.stack);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: 'Lỗi server' } });
    }
};

module.exports = { createClassify, updateClassify, deleteClassify, getShopClassify };
