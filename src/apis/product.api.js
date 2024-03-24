const Product = require('../models/product.model');
const Category = require('../models/category.model');
const Review = require('../models/review.model');
// const Brand = require('../models/brandModel');
// const Variation = require('../models/variationModel');
const { format } = require('date-fns');
// const Color = require('../models/colorsModel');
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const fs = require('fs');
const path = require('path');

// ** ===================  CREATE PRODUCT  ===================
const createProduct = async (req, res) => {
    // Set the user ID in the request body
    const { name, stock, price, description, discountPrice, categoryId } = req.body;
    const images = req.files;
    // console.log(req.files);
    try {
        const normalizedName = name.trim().toLowerCase();
        const existingProducts = await Product.find();

        const matchingProduct = existingProducts.find((product) => {
            const productName = product.name.trim().toLowerCase();
            // Loại bỏ khoảng trắng giữa các từ trong tên danh mục
            const normalizedProductName = productName.replace(/\s+/g, '');
            // Loại bỏ khoảng trắng giữa các từ trong tên đã nhập
            const normalizedInputName = normalizedName.replace(/\s+/g, '');

            // So sánh tên danh mục và tên đã nhập đã chuẩn hóa
            return normalizedProductName === normalizedInputName;
        });

        if (matchingProduct) {
            // Tìm thấy danh mục khớp
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'error',
                data: { message: 'Product with the same name already exists.' },
            });
        }
        const imageData = images.map((image) => {
            return {
                url: `http://localhost:4000/public/uploads/${path.basename(image.path)}`, // Tạo URL cục bộ cho hình ảnh dựa trên đường dẫn tạm thời
            };
        });
        const name_slug = name.trim().toLowerCase().replace(/\s+/g, '-');
        // Create the product object and set the image property
        const product = new Product({
            name,
            name_slug,
            stock,
            price,
            discountPrice,
            description,
            images: imageData,
            category: categoryId,
            //user: userId
            // Include other properties from req.body
            // For example: tensanpham, soluong, dongia, etc.
        });

        product.publishedDate = format(new Date(), 'MMM d, eee HH:mm:ss');
        product.updatedAt = format(new Date(), 'MMM d, eee HH:mm:ss');
        // Create the product in the database
        const category = await Category.findById(categoryId);
        product.category = category;
        await product.save();

        category.products.push(product);
        await category.save();
        res.status(StatusCodes.CREATED).json({ status: 'success', data: { a: 1 } });
    } catch (error) {
        console.error(error.stack);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: 'Lỗi server' } });
    }
};

// ** ===================  GET ALL PRODUCTS  ===================
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate({ path: 'category', select: 'name' });

        if (products.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({ status: 'error', data: { message: 'Không có sản phẩm nào.' } });
        }

        Promise.all(
            products.map(async (product) => {
                const result = await Review.aggregate([
                    { $match: { product: product.id } }, // Chỉ lấy đánh giá của sản phẩm cụ thể
                    {
                        $group: {
                            _id: null, // Gộp tất cả các đánh giá thành một nhóm duy nhất
                            totalReviews: { $sum: 1 }, // Tính tổng số lượng đánh giá
                            averageRating: { $avg: '$rating' }, // Tính điểm trung bình
                        },
                    },
                ]);

                const productObj = product.toObject();

                if (result.length > 0) {
                    const totalReviews = result[0].totalReviews;
                    const averageRating = result[0].averageRating;
                    // Trả về kết quả

                    productObj.totalReviews = totalReviews;
                    productObj.averageRating = totalReviews;
                    return productObj;
                    // return { totalReviews, averageRating };
                } else {
                    // Trả về giá trị mặc định nếu không có đánh giá nào
                    productObj.totalReviews = 0;
                    productObj.averageRating = 0;
                    return productObj;
                }
            }),
        )
            .then((result) => {
                res.status(StatusCodes.OK).json({ status: 'success', data: result });
            })
            .catch((err) => {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'err', message: err });
            });
    } catch (error) {
        console.error(error.stack);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: 'Lỗi server' } });
    }
};

// ** ===================  GET SINGLE PRODUCT  ===================
const getSingleProduct = async (req, res) => {
    const { id: productId } = req.params;

    try {
        const product = await Product.findOne({ _id: productId }).populate({ path: 'category', select: 'name' });

        if (!product) {
            res.status(StatusCodes.NOT_FOUND).json({
                status: 'error',
                data: { message: `No product with the id ${productId}` },
            });
        } else {
            res.status(StatusCodes.OK).json({ status: 'success', data: product });
        }
    } catch (error) {
        console.error(error.stack);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: 'Lỗi server' } });
    }
};
// ** ===================  UPDATE PRODUCT  ===================
const updateProduct = async (req, res) => {
    const productId = req.params.id;
    const updatedData = req.body;
    const images = req.files;

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                status: 'error',
                data: { message: 'Không tìm thấy sản phẩm' },
            });
        }

        // Kiểm tra nếu có hình ảnh mới được tải lên
        if (images && images.length > 0) {
            // Xóa tất cả hình ảnh cũ bằng cách gỡ bỏ tệp hình ảnh cục bộ
            const uploadDirectory = './public/uploads';
            // Xóa hình ảnh cục bộ
            product.images.forEach((image) => {
                const imagePath = path.join(uploadDirectory, path.basename(image.url));

                if (fs.existsSync(imagePath)) {
                    try {
                        fs.unlinkSync(imagePath);
                    } catch (error) {
                        console.error(`Lỗi khi xóa tệp ${imagePath}: ${error.message}`);
                    }
                }
            });

            // Lưu hình ảnh mới vào thư mục cục bộ và cập nhật đường dẫn
            const imageData = images.map((image) => {
                return {
                    url: `http://localhost:4000/public/uploads/${path.basename(image.path)}`, // Tạo URL cục bộ cho hình ảnh dựa trên đường dẫn tạm thời
                };
            });

            // Cập nhật mảng ảnh của sản phẩm với các đối tượng hình ảnh mới
            product.images = imageData;
        }
        if (updatedData.name) {
            const normalizedName = updatedData.name.trim().toLowerCase();
            const existingProducts = await Product.find();

            const matchingProduct = existingProducts.find((existingProduct) => {
                const productName = existingProduct.name.trim().toLowerCase();
                const normalizedProductName = productName.replace(/\s+/g, '');
                const normalizedInputName = normalizedName.replace(/\s+/g, '');
                return normalizedProductName === normalizedInputName && existingProduct._id.toString() !== productId;
            });

            if (matchingProduct) {
                return res.status(400).json({
                    status: 'error',
                    data: { message: 'Tên sản phẩm đã tồn tại.' },
                });
            }
        }

        if (product.ordersCount > 0) {
            // Cho phép chỉ cập nhật thuộc tính 'stock', các thuộc tính khác có thể cập nhật
            if (updatedData.stock !== undefined || updatedData.price !== undefined) {
                // Cập nhật thuộc tính 'stock'
                if (updatedData.stock !== undefined) {
                    // Cập nhật thuộc tính 'stock'
                    product.stock = updatedData.stock;
                }
                if (updatedData.price !== undefined) {
                    // Cập nhật thuộc tính 'price'
                    product.price = updatedData.price;
                }
            } else {
                // Nếu không cập nhật 'stock', trả về lỗi
                return res.status(400).json({
                    status: 'error',
                    data: { message: 'Không thể cập nhật thuộc tính khác khi đã có đơn hàng.' },
                });
            }
        } else {
            // Cập nhật thông tin khác của sản phẩm từ req.body
            Object.assign(product, updatedData);
        }
        // product.newPrice = product.price - (product.price * product.discount) / 100;
        // Cập nhật ngày cập nhật
        product.updatedAt = format(new Date(), 'MMM d, eee HH:mm:ss');

        // Lưu sản phẩm đã cập nhật vào cơ sở dữ liệu
        await product.save();

        res.json({ status: 'success', data: product });
    } catch (error) {
        console.error(error.stack);
        res.status(500).json({ status: 'error', data: { message: 'Lỗi server' } });
    }
};

// ** ===================  DELETE PRODUCT  ===================
const deleteProduct = async (req, res) => {
    const productId = req.params.id; // Extract the productId from the request body

    if (!productId) {
        return res.status(400).json({
            status: 'error',
            data: { message: 'Missing productId in request body' },
        });
    }

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                status: 'error',
                data: { message: 'Không tìm thấy sản phẩm' },
            });
        }

        // Kiểm tra nếu ordersCount bằng 0 mới thực hiện xóa sản phẩm
        if (product.ordersCount === 0) {
            // Xóa toàn bộ màu sắc và biến thể liên quan đến sản phẩm
            await Color.deleteMany({ _id: { $in: product.colors } });
            await Variation.deleteMany({ color: { $in: product.colors } });

            const categoryId = product.category;
            const brandId = product.brand;

            // Xóa sản phẩm khỏi danh sách sản phẩm (products) của danh mục và thương hiệu
            const [category, brand] = await Promise.all([Category.findById(categoryId), Brand.findById(brandId)]);

            if (category) {
                category.products.pull(productId);
                await category.save();
            }

            if (brand) {
                brand.products.pull(productId);
                await brand.save();
            }

            const uploadDirectory = './public/uploads';
            // Xóa hình ảnh cục bộ
            product.images.forEach((image) => {
                const imagePath = path.join(uploadDirectory, path.basename(image.url));

                if (fs.existsSync(imagePath)) {
                    try {
                        fs.unlinkSync(imagePath);
                    } catch (error) {
                        console.error(`Lỗi khi xóa tệp ${imagePath}: ${error.message}`);
                    }
                }
            });

            // Thực hiện xóa sản phẩm
            await Product.findByIdAndDelete(productId);

            return res.json({
                status: 'success',
                data: { message: 'Sản phẩm đã được xóa' },
            });
        } else {
            return res.status(400).json({
                status: 'error',
                data: { message: 'Sản phẩm có đơn đặt hàng, không thể xóa' },
            });
        }
    } catch (error) {
        console.error(error.stack);
        res.status(500).json({ status: 'error', data: { message: 'Lỗi server' } });
    }
};

// ** ===================  UPLOAD IMAGE PRODUCT  ===================
const uploadImage = async (req, res) => {
    if (!req.files) {
        throw new CustomError.BadRequestError('No File Uploaded');
    }
    const productImage = req.files.image;
    if (!productImage.mimetype.startsWith('image')) {
        throw new CustomError.BadRequestError('Please Upload Image');
    }
    const maxSize = 1024 * 1024;
    if (productImage.size > maxSize) {
        throw new CustomError.BadRequestError('Please upload image smaller 1MB');
    }
    const imagePath = path.join(__dirname, '../public/uploads/' + `${productImage.name}`);
    await productImage.mv(imagePath);
    res.status(StatusCodes.OK).json({ image: `/uploads/${productImage.name}` });
};

module.exports = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    uploadImage,
};
