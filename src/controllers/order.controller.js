const Order = require('../models/order.model');
const Shop = require('../models/shop.model');
const Address = require('../models/address.model');
var QRCode = require('qrcode');

const AddressStaticData = require('../utils/dataprovince');

const getAddressString = (_province, _district, _ward, _detail) => {
    const province = AddressStaticData.treeDataProvince[_province].label;
    const district = AddressStaticData.treeDataProvince[_province].district[_district].label;
    const ward = AddressStaticData.treeDataProvince[_province].district[_district].ward[_ward].label;
    const detail = _detail;
    return `${detail}, ${ward}, ${district}, ${province}`;
};

const genarateVariantString = (_variant, _refVariantData) => {
    let result = [];
    for (let i = 0; i < _refVariantData.length; i++) {
        result.push(_refVariantData[i].data.find((item) => item._id === _variant[i]).name);
    }
    return result.join(',');
};

const trackingOrder = async (req, res) => {
    try {
        // const order = await Order.findOne({ code: req.params.orderCode });
        const order = await Order.findById(req.params.orderCode)
            .populate({
                path: 'items',
                populate: { path: 'idToSnapshot' }, // 'productSnapshot' là tên trường ref trong items
            })
            .populate('shop', ['name', 'email']);
        if (!order) {
            return res.send('Order not found');
        }
        const shop = await Shop.findById(order.shop);
        if (!shop) {
            return res.send('Shop not found');
        }
        const shopAddress = await Address.findById(shop.addresses);
        if (!shopAddress) {
            return res.send('Shop address not found');
        }
        const url = await QRCode.toDataURL(`${process.env.BASE_URL}/orderTracking/${order.code}`);
        const orderData = {
            code: order.code,
            qrCode: url,
            shop: {
                name: shop.name,
                email: shop.email,
                address: getAddressString(
                    shopAddress.address.province,
                    shopAddress.address.district,
                    shopAddress.address.ward,
                    shopAddress.address.detail,
                ),
            },
            locationType: order.address.isWork ? '(Work)' : order.address.isHome ? '(Home)' : '',
            user: {
                name: order.name,
                phoneNumber: order.phoneNumber,
                email: order.email,
                address: getAddressString(
                    order.address.province,
                    order.address.district,
                    order.address.ward,
                    order.address.detail,
                ),
            },
            total: order.total,
            shippingCost: order.shippingCost,
            status: order.status,
            onlPayStatus: order.onlPayStatus,
            finalTotal: (order.shippingCost + order.total).toFixed(2),
            createAt: Date(order.createDate),
        };

        const item = [];
        for (let i = 0; i < order.items.length; i++) {
            let variantsName = '';
            if (order.items[i].variant && order.items[i].variant.length > 0) {
                const cloneProduct = JSON.parse(order.items[i].idToSnapshot.productJson);
                variantsName = genarateVariantString(order.items[i].variant, cloneProduct.variantData);
            }
            item.push({
                image: order.items[i].image,
                name: order.items[i].name,
                variant: variantsName,
                price: order.items[i].price,
                quantity: order.items[i].quantity,
                amount: order.items[i].price * order.items[i].quantity,
            });
        }
        res.render('home', { orderData: orderData, items: item });
        // res.send(req.params.orderCode);
    } catch (err) {
        res.status(500).send(err);
    }
};

module.exports = {
    trackingOrder,
};
