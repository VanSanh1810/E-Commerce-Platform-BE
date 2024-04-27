const Product = require('../models/product.model');
const Category = require('../models/category.model');
const Classify = require('../models/classify.model');
const Shop = require('../models/shop.model');
const User = require('../models/user.model');
const Review = require('../models/review.model');
const { format } = require('date-fns');
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const fs = require('fs');
const path = require('path');
const { isNullOrUndefined } = require('util');

// ** ===================  CREATE PRODUCT  ===================
const createProduct = async (req, res) => {
    // Set the user ID in the request body
    const { userId } = req.user;
    const { name, description, classifyId, categoryId, tags, price, discountPrice, stock, variantData, variantDetail, isDraft } =
        req.body;
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

        const userShop = await Shop.findOne({ vendor: userId });
        if (!userShop) {
            res.status(StatusCodes.NOT_ACCEPTABLE).json({ status: 'error', data: { message: 'Người dùng không sở hữu shop !' } });
        }
        const imageData = images.map((image) => {
            return {
                url: `http://localhost:4000/public/uploads/${path.basename(image.path)}`, // Tạo URL cục bộ cho hình ảnh dựa trên đường dẫn tạm thời
            };
        });
        // Create the product object and set the image property

        const newVDetail = variantDetail ? JSON.parse(variantDetail) : null;
        const newVData = variantData ? JSON.parse(variantData) : null;

        const product = new Product({
            name: name,
            description: description,
            // classify: classifyId,
            // category: categoryId,
            tag: tags,
            discountPrice: discountPrice ? discountPrice : 0,
            price: price ? price : 0,
            stock: stock ? stock : 0,
            images: imageData,
            variantData: newVData,
            variantDetail: newVDetail,
            review: [],
            status: isDraft ? 'draft' : 'active',
            order: [],
            //user: userId
            // Include other properties from req.body
            // For example: tensanpham, soluong, dongia, etc.
        });

        // Create the product in the database
        const category = await Category.findById(categoryId);
        if (category) {
            product.category = category;
        }

        if (classifyId) {
            try {
                const classify = await Classify.findById(classifyId);
                product.classify = classify;
            } catch (e) {
                product.classify = null;
            }
        } else {
            product.classify = null;
        }
        product.shop = userShop;

        await product.save();

        res.status(StatusCodes.CREATED).json({ status: 'success', data: { message: 'Product created' } });
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: 'Lỗi server' } });
    }
};

// ** ===================  GET ALL PRODUCTS  ===================
const getAllProducts = async (req, res) => {
    const productQuery = req.query;
    try {
        console.log(productQuery);
        let products = await Product.find()
            .populate({ path: 'shop', select: 'name' })
            .populate({ path: 'category', select: 'name' });

        if (products.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({ status: 'error', data: { message: 'Không có sản phẩm nào.' } });
        }

        if (productQuery?.shopId) {
            const filteredProducts = products.filter((product) => product.shop.equals(productQuery.shopId));
            products = [...filteredProducts];
            if (productQuery?.classify) {
                const filteredProducts1 = filteredProducts.filter((product) => product.classify.equals(productQuery.classify));
                products = [...filteredProducts1];
            }
        }

        const total = products.length;

        // if (productQuery?.sortType) {
        //     switch (productQuery.sortType) {
        //         case '':
        //             break;
        //         case 'featured':
        //             break;
        //         case 'trending':
        //             break;
        //         default:
        //             break;
        //     }
        //     const filteredProducts = products.filter((product) => product.shop.equals(productQuery.shopId));
        //     products = [...filteredProducts];
        // }

        if (productQuery?.sortPrice) {
            switch (productQuery.sortPrice) {
                case 'lowToHigh':
                    let tempArr1 = [];
                    for (var i = 0; i < products.length; i++) {
                        if (products[i].variantData) {
                            const totalPrice = await products[i].routePath.reduce((accumulator, currentValue) => {
                                if (parseFloat(currentValue.detail.disPrice) && parseFloat(currentValue.detail.disPrice) > 0) {
                                    return accumulator + parseFloat(currentValue.detail.disPrice);
                                }
                                return accumulator + parseFloat(currentValue.detail.disPrice);
                            }, 0);

                            tempArr1.push({
                                p: products[i],
                                value: totalPrice / products[i].routePath.length,
                            });
                        } else {
                            tempArr1.push({
                                p: products[i],
                                value:
                                    products[i].discountPrice && products[i].discountPrice > 0
                                        ? products[i].discountPrice
                                        : products[i].price,
                            });
                        }
                    }

                    const filteredProducts1 = tempArr1.sort((product1, product2) => {
                        return product1.value - product2.value;
                    });
                    const final1 = filteredProducts1.map((data) => {
                        return data.p;
                    });
                    products = [...final1];
                    break;
                case 'highToLow':
                    let tempArr = [];
                    for (var i = 0; i < products.length; i++) {
                        if (products[i].variantData) {
                            const totalPrice = await products[i].routePath.reduce((accumulator, currentValue) => {
                                if (parseFloat(currentValue.detail.disPrice) && parseFloat(currentValue.detail.disPrice) > 0) {
                                    return accumulator + parseFloat(currentValue.detail.disPrice);
                                }
                                return accumulator + parseFloat(currentValue.detail.disPrice);
                            }, 0);

                            tempArr.push({
                                p: products[i],
                                value: totalPrice / products[i].routePath.length,
                            });
                        } else {
                            tempArr.push({
                                p: products[i],
                                value:
                                    products[i].discountPrice && products[i].discountPrice > 0
                                        ? products[i].discountPrice
                                        : products[i].price,
                            });
                        }
                    }

                    const filteredProducts2 = tempArr.sort((product1, product2) => {
                        return product2.value - product1.value;
                    });
                    const final2 = filteredProducts2.map((data) => {
                        return data.p;
                    });
                    products = [...final2];
                    break;
                default:
                    break;
            }
        }

        if (productQuery?.currentPage) {
            const startIndex = (parseInt(productQuery.currentPage) - 1) * parseInt(productQuery.limit);
            const endIndex = startIndex + parseInt(productQuery.limit);
            const filteredProducts = products.slice(startIndex, endIndex);
            products = [...filteredProducts];
        }

        // if (productQuery?.limit) {
        //     const filteredProducts = products.filter((product) => product.shop.equals(productQuery.shopId));
        //     products = [...filteredProducts];
        // }

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
                    productObj.averageRating = averageRating;
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
                res.status(StatusCodes.OK).json({ status: 'success', data: result, pages: total });
            })
            .catch((err) => {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'err', message: err });
            });
    } catch (error) {
        console.error(error.stack);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: error } });
    }
};

// ** ===================  GET SINGLE PRODUCT  ===================
const getSingleProduct = async (req, res) => {
    const { id: productId } = req.params;

    try {
        const product = await Product.findById(productId)
            .populate({ path: 'category', select: 'name' })
            .populate({ path: 'classify', select: 'name' })
            .populate({ path: 'shop', select: 'name' });

        if (!product) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: 'error',
                data: { message: `No product with the id ${productId}` },
            });
        } else {
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
                productObj.averageRating = averageRating;
                return productObj;
                // return { totalReviews, averageRating };
            } else {
                // Trả về giá trị mặc định nếu không có đánh giá nào
                productObj.totalReviews = 0;
                productObj.averageRating = 0;
                // return productObj;
            }
            res.status(StatusCodes.OK).json({ status: 'success', data: productObj });
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

    // return res.status(StatusCodes.NOT_ACCEPTABLE).json({
    //     status: 'error',
    //     data: { message: updatedData },
    // });

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(StatusCodes.NOT_ACCEPTABLE).json({
                status: 'error',
                data: { message: 'No product found' },
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(StatusCodes.NOT_ACCEPTABLE).json({
                status: 'error',
                data: { message: 'No user found' },
            });
        }

        const shop = await Shop.findOne({ vendor: user._id });
        if (!shop) {
            return res.status(StatusCodes.NOT_ACCEPTABLE).json({
                status: 'error',
                data: { message: 'No shop found' },
            });
        }

        if (!product.shop.equals(shop._id)) {
            return res.status(StatusCodes.NOT_ACCEPTABLE).json({
                status: 'error',
                data: { message: `Shop dont own this product ${product.shop} , ${shop._id}` },
            });
        }

        // Kiểm tra nếu có hình ảnh mới được tải lên
        if (images && images.length > 0) {
            // Xóa tất cả hình ảnh cũ bằng cách gỡ bỏ tệp hình ảnh cục bộ

            // Lưu hình ảnh mới vào thư mục cục bộ và cập nhật đường dẫn
            const newImageData = images.map((image) => {
                return {
                    url: `http://localhost:4000/public/uploads/${path.basename(image.path)}`, // Tạo URL cục bộ cho hình ảnh dựa trên đường dẫn tạm thời
                };
            });

            // Cập nhật mảng ảnh của sản phẩm với các đối tượng hình ảnh mới
            const imgLeft = [...JSON.parse(updatedData.imgLeft)];
            const currentImg = [...product.images];
            function removeCommonElements(arrayA, arrayB) {
                // Lọc các phần tử của mảng A không có trong mảng B
                const newArray = arrayA.filter((element) => arrayB.includes(element.url));
                return newArray;
            }
            const updatedImgArr = removeCommonElements(currentImg, imgLeft);
            product.images = [...updatedImgArr, ...newImageData];
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
                return res.status(StatusCodes.NOT_ACCEPTABLE).json({
                    status: 'error',
                    data: { message: 'Tên sản phẩm đã tồn tại.' },
                });
            }
            product.name = updatedData.name;
        }
        if (updatedData.stock) {
            product.stock = updatedData.stock;
        }
        if (updatedData.price) {
            product.price = updatedData.price;
        }
        if (updatedData.discountPrice) {
            product.discountPrice = updatedData.discountPrice;
        }
        if (updatedData.description) {
            product.description = updatedData.description;
        }
        if (updatedData.tags) {
            product.tag = updatedData.tags;
        }
        if (updatedData.categoryId) {
            const cate = await Category.findById(updatedData.categoryId);
            if (!cate) {
                return res.status(StatusCodes.NOT_ACCEPTABLE).json({
                    status: 'error',
                    data: { message: 'No category provide' },
                });
            }
            product.category = cate._id;
        }

        if (product.status !== 'disabled') {
            product.status = updatedData.isDraft ? 'draft' : 'active';
        }
        const classify = await Classify.findById(updatedData.classifyId);
        product.classify = classify?._id ? classify._id : null;

        const newVDetail = updatedData.variantDetail
            ? JSON.parse(updatedData.variantDetail)?.length > 0
                ? JSON.parse(updatedData.variantDetail)
                : null
            : null;
        const newVData = updatedData.variantData
            ? JSON.parse(updatedData.variantData)?.length > 0
                ? JSON.parse(updatedData.variantData)
                : null
            : null;
        product.variantData = newVData;
        product.variantDetail = newVDetail;

        // Lưu sản phẩm đã cập nhật vào cơ sở dữ liệu
        await product.save();

        res.json({ status: 'success', data: { message: 'Product updated', product: product } });
    } catch (error) {
        console.error(error.stack);
        res.status(500).json({ status: 'error', data: { message: error } });
    }
};

// ** ===================  DELETE PRODUCT  ===================
const deleteProduct = async (req, res) => {
    const productId = req.params.id; // Extract the productId from the request body
    const { userId, role } = req.user;

    if (!productId) {
        return res.status(400).json({
            status: 'error',
            data: { message: 'Missing productId in request param' },
        });
    }
    if (role === 'admin') {
        try {
            const product = await Product.findById(productId);

            if (!product) {
                return res.status(StatusCodes.NOT_ACCEPTABLE).json({
                    status: 'error',
                    data: { message: 'Không tìm thấy sản phẩm' },
                });
            }
            // const productReviewList = await Review.find({ product: product.id });
            // productReviewList.forEach(async (review) => {
            //     await review.delete();
            // });

            await Product.findByIdAndDelete(productId);

            return res.json({
                status: 'success',
                data: { message: 'Sản phẩm đã được xóa' },
            });
        } catch (error) {
            console.error(error.stack);
            return res.status(500).json({ status: 'error', data: { message: error } });
        }
    } else {
        try {
            const product = await Product.findById(productId);

            if (!product) {
                return res.status(StatusCodes.NOT_ACCEPTABLE).json({
                    status: 'error',
                    data: { message: 'Không tìm thấy sản phẩm' },
                });
            }

            const shop = await Shop.findOne({ vendor: userId });
            if (!product) {
                return res.status(StatusCodes.NOT_ACCEPTABLE).json({
                    status: 'error',
                    data: { message: 'You dont own this product' },
                });
            }

            if (!product.shop.equals(shop._id)) {
                return res.status(StatusCodes.NOT_ACCEPTABLE).json({
                    status: 'error',
                    data: { message: 'You dont own this product' },
                });
            }

            // const productReviewList = await Review.find({ product: product.id });
            // productReviewList.forEach(async (review) => {
            //     await review.delete();
            // });

            await Product.findByIdAndDelete(productId);

            return res.json({
                status: 'success',
                data: { message: 'Sản phẩm đã được xóa' },
            });
        } catch (e) {
            console.error(error.stack);
            return res.status(500).json({ status: 'error', data: { message: error } });
        }
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
