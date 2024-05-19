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
const { isObjectIdOrHexString } = require('mongoose');
const Order = require('../models/order.model');
const moment = require('moment');
const { addTagHistory } = require('../utils');

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

        console.log('Draft: ', isDraft);

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
    const role = req.user?.role ? req.user.role : null;
    try {
        console.log(productQuery);

        let query = {};

        if (productQuery?.searchText?.trim() !== '') {
            if (isObjectIdOrHexString(productQuery.searchText)) {
                query = {
                    $or: [
                        { _id: { $regex: productQuery.searchText, $options: 'i' } },
                        { name: { $regex: productQuery.searchText, $options: 'i' } },
                        { tag: { $regex: productQuery.searchText, $options: 'i' } },
                    ],
                };
            } else {
                query = {
                    $or: [{ name: new RegExp(productQuery.searchText, 'i') }, { tag: new RegExp(productQuery.searchText, 'i') }],
                };
            }
        }

        let query2 = {};
        const sourcePort = req.headers.origin.split(':')[2]; // Lấy phần tử thứ 2 sau dấu ':'

        if (sourcePort === '3006') {
            // Nếu role là 'vendor', query rỗng
            if (role === 'vendor') {
                query2 = {};
            } else {
                query2.status = 'active';
            }
        } else {
            // Nếu role khác 'vendor', chỉ lấy sản phẩm có status là 'active'
            query2.status = 'active';
        }

        console.log(query);
        console.log(query2);

        let products = await Product.find({ $and: [query, query2] })
            .populate({ path: 'shop', select: 'name' })
            .populate({ path: 'category', select: 'name' });

        if (products.length === 0) {
            return res.status(StatusCodes.OK).json({ status: 'success', data: [], pages: 0 });
        }

        if (productQuery?.shopId) {
            const filteredProducts = products.filter((product) => product.shop.equals(productQuery.shopId));
            products = [...filteredProducts];
            if (productQuery?.classify) {
                const filteredProducts1 = filteredProducts.filter((product) => product.classify.equals(productQuery.classify));
                products = [...filteredProducts1];
            }
        }
        ///
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
        ///

        if (productQuery?.category) {
            const relateCate = await getAllRelatedCategory(productQuery.category);
            // console.log(relateCate);
            const filteredProducts = products.filter((product) => relateCate.includes(product.category.id));
            // console.log(filteredProducts);
            products = [...filteredProducts];
        }

        if (productQuery?.sortType) {
            let filteredProducts;
            switch (productQuery.sortType) {
                case '': //get all products
                    break;
                case 'new': // new add in last week
                    function isWithinOneWeek(timeInSeconds) {
                        const oneWeekInSeconds = 7 * 24 * 60 * 60; // Số giây trong một tuần
                        const currentTimeInSeconds = Math.floor(Date.now() / 1000); // Chuyển thời gian hiện tại sang giây

                        return currentTimeInSeconds - timeInSeconds <= oneWeekInSeconds;
                    }
                    filteredProducts = products.filter((product) => isWithinOneWeek(parseInt(product.createDate)));
                    products = [...filteredProducts];
                    break;
                case 'trending': // most selling in last week
                    // Lấy thời gian hiện tại
                    const currentDate = moment();
                    // Tạo khoảng thời gian 1 tuần trước
                    const oneWeekAgo = currentDate.subtract(7, 'days').valueOf();
                    const ordersWithinOneWeek = await Order.find({
                        createDate: {
                            $gte: oneWeekAgo,
                        },
                    })
                        .select('_id items')
                        .populate({
                            path: 'items',
                            populate: { path: 'idToSnapshot' }, // 'productSnapshot' là tên trường ref trong items
                        });
                    const listProductMatch = [];
                    for (let i = 0; i < ordersWithinOneWeek.length; i++) {
                        const items = [...ordersWithinOneWeek[i].items];
                        for (let j = 0; j < items.length; j++) {
                            items[j].idToSnapshot.productId;
                            const index = listProductMatch.findIndex((p) => p.id === items[j].idToSnapshot.productId);
                            if (index !== -1) {
                                listProductMatch[index].total += items[j].quantity;
                            } else {
                                listProductMatch.push({ id: items[j].idToSnapshot.productId, total: items[j].quantity });
                            }
                        }
                    }
                    filteredProducts = products.filter(
                        (product) => listProductMatch.findIndex((p) => product._id.equals(p.id)) !== -1,
                    );
                    products = [...filteredProducts];
                    break;
                case 'popular': // most selling in all times
                    const orders = await Order.find()
                        .select('_id items')
                        .populate({
                            path: 'items',
                            populate: { path: 'idToSnapshot' }, // 'productSnapshot' là tên trường ref trong items
                        });
                    const listProductMatch1 = [];
                    for (let i = 0; i < orders.length; i++) {
                        const items = [...orders[i].items];
                        for (let j = 0; j < items.length; j++) {
                            items[j].idToSnapshot.productId;
                            const index = listProductMatch1.findIndex((p) => p.id === items[j].idToSnapshot.productId);
                            if (index !== -1) {
                                listProductMatch1[index].total += items[j].quantity;
                            } else {
                                listProductMatch1.push({ id: items[j].idToSnapshot.productId, total: items[j].quantity });
                            }
                        }
                    }
                    filteredProducts = products.filter(
                        (product) => listProductMatch1.findIndex((p) => product._id.equals(p.id)) !== -1,
                    );
                    products = [...filteredProducts];
                    break;
                default:
                    break;
            }
        }

        const total = products.length;

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

        Promise.all(
            products.map(async (product) => {
                const result = await Review.aggregate([
                    { $match: { product: product._id } }, // Chỉ lấy đánh giá của sản phẩm cụ thể
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

        // product.images.find()
        if (!product) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: 'error',
                data: { message: `No product with the id ${productId}` },
            });
        } else {
            try {
                const { historyAction } = req.query;
                if (req.user?.userId && historyAction) {
                    const user = await User.findById(req.user.userId);
                    if (user) {
                        await addTagHistory(product.tag, 2, user.id);
                    }
                }
            } catch (e) {
                console.error(e);
            }

            const result = await Review.aggregate([
                { $match: { product: product._id } }, // Chỉ lấy đánh giá của sản phẩm cụ thể
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
                // return productObj;
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
            product.status = updatedData.isDraft === 'true' ? 'draft' : 'active';
            console.log('Draft: ' + updatedData.isDraft);
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

            await product.delete();

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

// ** ===================  DISABLE PRODUCT  ===================
const disableProduct = async (req, res) => {
    const { id } = req.params;
    const { isHidden } = req.body;
    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: 'Không tìm thấy sản phẩm',
            });
        }
        product.status = !!isHidden ? 'disabled' : 'draft';
        await product.save();
        //notify
        const vendor = await User.findOne({ shop: product.shop });
        await saveNotifyToDb([vendor._id], {
            title: isHidden
                ? `<p>Your product has been <b>disable</b> by adminstrator. Please contact us for a soluton</p>`
                : `<p>Your product has been <b>activated</b></p>`,
            target: { id: product._id, type: 'Product' },
        });
        return res.status(StatusCodes.OK).json({
            message: `Đã ${isHidden ? 'vô hiệu hóa' : 'tái kích hoạt'} sản phẩm`,
        });
    } catch (err) {
        console.error(err);
    }
};

// ** ===================  RELATED PRODUCT  ===================
const relatedProducts = async (req, res) => {
    const { productId } = req.params;
    async function findProducts(allCateInTree, tags) {
        try {
            const products = await Product.find({
                $or: [
                    { category: { $in: allCateInTree } }, // Tìm các sản phẩm có category thuộc allCateInTree
                    { tag: { $regex: tags.join('|') } }, // Tìm các sản phẩm có tag tương tự với list tags
                ],
            });
            return products;
        } catch (error) {
            console.error('Error finding products:', error);
            throw error;
        }
    }
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: 'No product found',
            });
        }
        //relate is sub child or same category, relate with tags
        const allCateInTree = [];
        const _tag = [...product.tag.split(',').map((tag) => tag.trim())];
        //
        const findAllCateInTreeFromAsignNode = async (id) => {
            const cate = await Category.findById(id);
            if (cate) {
                allCateInTree.push(cate._id);
                if (cate.child.length > 0) {
                    for (let i = 0; i < cate.child.length; i++) {
                        await findAllCateInTreeFromAsignNode(cate.child[i]);
                    }
                } else {
                    return;
                }
            } else {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: 'Vô lý' } });
            }
        };
        //
        await findAllCateInTreeFromAsignNode(product.category);
        ////////////////////////////////
        let matchedProducts = await findProducts(allCateInTree, _tag);
        matchedProducts = matchedProducts.filter((product) => !product._id.equals(productId));
        function countOccurrences(list, bigString) {
            // Tạo một biểu thức chính quy từ danh sách chuỗi
            const regex = new RegExp(list.join('|'), 'g');

            // Sử dụng match() để tìm tất cả các chuỗi phù hợp
            const matches = bigString.match(regex);

            // Trả về số lượng phần tử phù hợp được tìm thấy
            return matches ? matches.length : 0;
        }
        Promise.all(
            matchedProducts.map(async (product) => {
                const result = await Review.aggregate([
                    { $match: { product: product._id } }, // Chỉ lấy đánh giá của sản phẩm cụ thể
                    {
                        $group: {
                            _id: null, // Gộp tất cả các đánh giá thành một nhóm duy nhất
                            totalReviews: { $sum: 1 }, // Tính tổng số lượng đánh giá
                            averageRating: { $avg: '$rating' }, // Tính điểm trung bình
                        },
                    },
                ]);

                const productObj = product.toObject();
                const inCate = allCateInTree.includes(productObj.category);
                const relatedTag = countOccurrences([..._tag], productObj.tag);
                productObj.relatedRank = relatedTag + inCate ? 1 : 0;

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
                res.status(StatusCodes.OK).json({ status: 'success', data: result, pages: result.length });
            })
            .catch((err) => {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'err', message: err });
            });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: err,
        });
    }
};

// ** ===================  RECOMMEND PRODUCT  ===================
const recomendProduct = async (req, res) => {
    try {
        async function findProducts(tags) {
            // Duyệt qua danh sách và trích xuất tất cả các name
            const namesArray = tags.map((obj) => obj.name);
            try {
                const products = await Product.find({
                    $or: [
                        { tag: { $regex: namesArray.join('|') } }, // Tìm các sản phẩm có tag tương tự với list tags
                    ],
                });
                return products;
            } catch (error) {
                console.error('Error finding products:', error);
                throw error;
            }
        }
        if (req.user?.userId) {
            const user = await User.findById(req.user?.userId);
            if (!user) {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'err', message: 'No  user found' });
            }
            const productHisList = user.productHistory && user.productHistory.length > 0 ? [...user.productHistory] : [];
            const matchedProducts = await findProducts(productHisList);
            //
            function countOccurrences(list, bigString) {
                const namesArray = list.map((obj) => obj.name);
                // Tạo một biểu thức chính quy từ danh sách chuỗi
                const regex = new RegExp(namesArray.join('|'), 'g');

                // Sử dụng match() để tìm tất cả các chuỗi phù hợp
                const matches = bigString.match(regex);

                let totalScore = 0;
                if (matches) {
                    matches.forEach((match) => {
                        const matchedObject = list.find((obj) => obj.name === match);
                        if (matchedObject) {
                            totalScore += matchedObject.score;
                        }
                    });
                }

                // Trả về số lượng phần tử phù hợp được tìm thấy
                return totalScore;
            }
            //
            Promise.all(
                matchedProducts.map(async (product) => {
                    const result = await Review.aggregate([
                        { $match: { product: product._id } }, // Chỉ lấy đánh giá của sản phẩm cụ thể
                        {
                            $group: {
                                _id: null, // Gộp tất cả các đánh giá thành một nhóm duy nhất
                                totalReviews: { $sum: 1 }, // Tính tổng số lượng đánh giá
                                averageRating: { $avg: '$rating' }, // Tính điểm trung bình
                            },
                        },
                    ]);

                    const productObj = product.toObject();
                    const relatedTag = countOccurrences([...productHisList], productObj.tag);
                    productObj.recommendRank = relatedTag;

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
                    res.status(StatusCodes.OK).json({ status: 'success', data: result, pages: result.length });
                })
                .catch((err) => {
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'err', message: err });
                });
        } else {
            const { hisList } = req.body;
            const matchedProducts = await findProducts(hisList);
            //
            function countOccurrences(list, bigString) {
                const namesArray = list.map((obj) => obj.name);
                // Tạo một biểu thức chính quy từ danh sách chuỗi
                const regex = new RegExp(namesArray.join('|'), 'g');

                // Sử dụng match() để tìm tất cả các chuỗi phù hợp
                const matches = bigString.match(regex);

                let totalScore = 0;
                if (matches) {
                    matches.forEach((match) => {
                        const matchedObject = list.find((obj) => obj.name === match);
                        if (matchedObject) {
                            totalScore += matchedObject.score;
                        }
                    });
                }

                // Trả về số lượng phần tử phù hợp được tìm thấy
                return totalScore;
            }
            //
            Promise.all(
                matchedProducts.map(async (product) => {
                    const result = await Review.aggregate([
                        { $match: { product: product._id } }, // Chỉ lấy đánh giá của sản phẩm cụ thể
                        {
                            $group: {
                                _id: null, // Gộp tất cả các đánh giá thành một nhóm duy nhất
                                totalReviews: { $sum: 1 }, // Tính tổng số lượng đánh giá
                                averageRating: { $avg: '$rating' }, // Tính điểm trung bình
                            },
                        },
                    ]);

                    const productObj = product.toObject();
                    const relatedTag = countOccurrences([...hisList], productObj.tag);
                    productObj.recommendRank = relatedTag;

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
                    res.status(StatusCodes.OK).json({ status: 'success', data: result, pages: result.length });
                })
                .catch((err) => {
                    console.error(err);
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'err', message: err });
                });
        }
    } catch (err) {
        console.error(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'err', message: err });
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
    disableProduct,
    relatedProducts,
    recomendProduct,
};
