const Category = require('../models/category.model');
const Shop = require('../models/category.model');
const CustomError = require('../errors');
const { format } = require('date-fns');
const { StatusCodes } = require('http-status-codes');
const Product = require('../models/product.model');

// ** ===================  GET ALL SHOP  ===================
const getAllShops = async (req, res) => {
    const { name, root } = req.body;
    try {
        const normalizedName = name.trim().toLowerCase();
        const existingCategories = await Category.find();

        const matchingCategory = existingCategories.find((category) => {
            const categoryName = category.name.trim().toLowerCase();
            // Loại bỏ khoảng trắng giữa các từ trong tên danh mục
            const normalizedCategoryName = categoryName.replace(/\s+/g, '');
            // Loại bỏ khoảng trắng giữa các từ trong tên đã nhập
            const normalizedInputName = normalizedName.replace(/\s+/g, '');

            // So sánh tên danh mục và tên đã nhập đã chuẩn hóa
            return normalizedCategoryName === normalizedInputName;
        });

        if (matchingCategory) {
            // Tìm thấy danh mục khớp
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'error',
                data: { message: 'Category with the same name already exists.' },
            });
        }

        const category = new Category({
            name,
            root: root,
            child: [],
        });

        // Tạo category trong cơ sở dữ liệu
        await category.save();

        if (root !== null) {
            const rootCategory = await Category.findById(root);
            rootCategory.child.push(category._id);
            rootCategory.save();
        }

        res.status(StatusCodes.CREATED).json({ status: 'success', data: category });
    } catch (error) {
        console.error(error.stack);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: 'Lỗi server' } });
    }
};

module.exports = {
    getAllShops,
};
