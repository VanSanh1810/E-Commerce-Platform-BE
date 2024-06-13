const nodemailer = require('nodemailer');
const nodeMailHbs = require('nodemailer-express-handlebars');
require('dotenv').config();
const Order = require('../models/order.model');
const Address = require('../models/address.model');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

//
const AddressStaticData = require('../utils/dataprovince');
const Shop = require('../models/shop.model');

const getAddressString = (_province, _district, _ward, _detail) => {
    const province = AddressStaticData.treeDataProvince[_province].label;
    const district = AddressStaticData.treeDataProvince[_province].district[_district].label;
    const ward = AddressStaticData.treeDataProvince[_province].district[_district].ward[_ward].label;
    const detail = _detail;
    return `${detail}, ${ward}, ${district}, ${province}`;
};
//
const hbsOptions = {
    viewEngine: {
        defaultLayout: false,
    },
    viewPath: 'src/resources/views',
};
//
const transporter = nodemailer
    .createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    })
    .use('compile', nodeMailHbs(hbsOptions));

const sendEmail = async (to, orderId) => {
    try {
        const order = await Order.findById(orderId)
            .populate({
                path: 'items',
                populate: { path: 'idToSnapshot' }, // 'productSnapshot' là tên trường ref trong items
            })
            .populate('shop', ['name', 'email']);
        if (!order) {
            throw new Error('No order found');
        }
        // shop addresses
        const shop = await Shop.findById(order.shop);
        const shopAddress = await Address.findById(shop.addresses);
        //
        let htmlData = '';
        let listAttachment = [];
        let listItems = [];
        // initialize data structure for each item
        for (let i = 0; i < order.items.length; i++) {
            const imgUrl = order.items[i].image;
            const parts = imgUrl.split('/');
            const imagePath = path.join(__dirname, '..', 'public/uploads', parts[parts.length - 1]);

            // const data = await fs.promises.readFile(imagePath);
            // const base64Image = Buffer.from(data).toString('base64');
            const cloneProduct = JSON.parse(order.items[i].idToSnapshot.productJson);
            let productVariantsName = '';
            if (order.items[i].variant && order.items[i].variant.length > 0) {
                let tempArr = [];
                for (let j = 0; j < cloneProduct.variantData.length; j++) {
                    const vName = cloneProduct.variantData[j].data.find((v) => v._id === order.items[i].variant[j]).name;
                    tempArr.push(vName);
                }
                productVariantsName = tempArr.join(', ');
            }
            const a = {
                name: order.items[i].name,
                img: `cid:unique@${parts[parts.length - 1]}`,
                variant: productVariantsName,
                price: order.items[i].price,
                quantity: order.items[i].quantity,
                amount: order.items[i].price * order.items[i].quantity,
            };
            listItems.push({ ...a });
            htmlData += `<li><img src='cid:unique@${parts[parts.length - 1]}'/><p>${a.name}</p></li>`;
            listAttachment.push({
                filename: parts[parts.length - 1],
                path: imagePath,
                cid: `unique@${parts[parts.length - 1]}`,
            });
        }
        //
        const now = new Date(parseInt(order.createDate));

        const year = now.getFullYear(); // Lấy năm
        const month = now.getMonth() + 1; // Lấy tháng (0-11, cần +1)
        const date = now.getDate(); // Lấy ngày
        const hours = now.getHours(); // Lấy giờ
        const minutes = now.getMinutes(); // Lấy phút
        const seconds = now.getSeconds(); // Lấy giây

        const formattedDate = `${year}-${month}-${date}`; // Định dạng ngày tháng

        // QR Code
        var QRCode = require('qrcode');
        const qrData = await QRCode.toDataURL(
            `${process.env.USER_URL}/tracking-order-page?code=${order.code}&email=${order.email}&phone=${order.phoneNumber}}`,
        );
        console.log(qrData);
        listAttachment.push({
            content: qrData,
            // path: imagePath,
            cid: `unique@${order.id}`,
        });
        //
        const mailConfig = {
            from: {
                name: 'Newpee',
                address: process.env.SMTP_USER,
            },
            to: [to],
            subject: 'Order placement',
            text: 'Van sanh',
            attachments: [...listAttachment],
            template: 'mailTemplate',
            context: {
                items: [...listItems],
                orderData: {
                    orderQRCode: `cid:unique@${order.id}`,
                    // orderQRCode: qrData,
                    orderURL: `${process.env.BASE_URL}/orderTracking/${order.id}`,
                    orderCode: order.code,
                    orderDate: formattedDate,
                    shopAddress: getAddressString(
                        shopAddress.address.province,
                        shopAddress.address.district,
                        shopAddress.address.ward,
                        shopAddress.address.detail,
                    ),
                    userAddress: getAddressString(
                        order.address.province,
                        order.address.district,
                        order.address.ward,
                        order.address.detail,
                    ),
                    subTotal: order.total,
                    discount: 0,
                    shippingCost: order.shippingCost,
                    total: (order.total + order.shippingCost).toFixed(2),
                },
            },
            // html: `<ul>${htmlData}</ul>`,
        };
        transporter.sendMail(mailConfig);
        // await transporter.sendMail({attachments: [{path}]});
    } catch (e) {
        console.error(e);
        return new Error(e);
    }
};

module.exports = {
    sendEmail,
};
