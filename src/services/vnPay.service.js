const crypto = require('crypto');
const querystring = require('qs');
const moment = require('moment'); // Thêm moment nếu bạn cần xử lý ngày giờ
const config = require('config');
require('dotenv').config();
const VNPayConfig = {
    vnp_Url: process.env.VNP_URL,
    vnp_ReturnUrl: process.env.VNP_RETURN_URL, // Đổi thành URL thực tế của bạn
    vnp_TmnCode: process.env.VNP_TMNCODE,
    vnp_HashSecret: process.env.VNP_HASHSECRET,
    vnp_Version: '2.1.0',
    vnp_CurrCode: 'VND',
};

const sortObject = (obj) => {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
};

function generateVNPayUrl(orderInfo) {
    const params = {
        vnp_Version: VNPayConfig.vnp_Version,
        vnp_Command: 'pay',
        vnp_TmnCode: VNPayConfig.vnp_TmnCode,
        vnp_Amount: Math.round((orderInfo.amount / 0.00004) * 100),
        vnp_CurrCode: VNPayConfig.vnp_CurrCode,
        vnp_TxnRef: orderInfo.orderId.toString(),
        vnp_OrderInfo: orderInfo.description,
        vnp_OrderType: 'others',
        vnp_ReturnUrl: VNPayConfig.vnp_ReturnUrl,
        vnp_IpAddr: orderInfo.ipAddress,
        vnp_CreateDate: orderInfo.createDate || moment().format('YYYYMMDDHHmmss'), // Trường mới cho mã ngân hàng
        vnp_Locale: orderInfo.locale || 'vn', // Trường mới cho ngôn ngữ
    };
    if (orderInfo.bankCode && orderInfo.bankCode !== '') {
        params['vnp_BankCode'] = orderInfo.bankCode;
    }
    const sortedParams = sortObject(params);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', VNPayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    sortedParams['vnp_SecureHash'] = signed;

    return VNPayConfig.vnp_Url + '?' + querystring.stringify(sortedParams, { encode: false });
}

module.exports = {
    generateVNPayUrl,
    sortObject,
};
