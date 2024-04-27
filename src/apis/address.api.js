const User = require('../models/user.model');
const Address = require('../models/address.model');
const Shop = require('../models/shop.model');
const { StatusCodes } = require('http-status-codes');

//** ======================== GET ADDRESS ========================
const getAddress = async (req, res) => {
    const { role, userId } = req.user;
    const { id } = req.params;
    if (role === 'admin') {
        try {
            const user = await User.findById(id);
            if (!user) {
                res.status(StatusCodes.OK).json({ msg: 'No user found' });
            } else {
                const listAddressRef = [...user.addresses];
                if (listAddressRef.length > 0) {
                    const addressList = await Address.find({ _id: { $in: listAddressRef } });
                    res.status(StatusCodes.OK).json({ status: 'success', data: { addressList: addressList } });
                } else {
                    res.status(StatusCodes.OK).json({ status: 'success', data: { addressList: [] } });
                }
            }
        } catch (err) {
            try {
                const user = await User.findById(userId);
                if (!user) {
                    res.status(StatusCodes.OK).json({ msg: 'No user found' });
                } else {
                    const listAddressRef = [...user.addresses];
                    if (listAddressRef.length > 0) {
                        const addressList = await Address.find({ _id: { $in: listAddressRef } });
                        res.status(StatusCodes.OK).json({ status: 'success', data: { addressList: addressList } });
                    } else {
                        res.status(StatusCodes.OK).json({ status: 'success', data: { addressList: [] } });
                    }
                }
            } catch (err) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { error: err } });
            }
        }
    } else {
        try {
            const user = await User.findById(userId);
            if (!user) {
                res.status(StatusCodes.OK).json({ msg: 'No user found' });
            } else {
                const listAddressRef = [...user.addresses];
                if (listAddressRef.length > 0) {
                    const addressList = await Address.find({ _id: { $in: listAddressRef } });
                    res.status(StatusCodes.OK).json({ status: 'success', data: { addressList: addressList } });
                } else {
                    res.status(StatusCodes.OK).json({ status: 'success', data: { addressList: [] } });
                }
            }
        } catch (err) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { error: err } });
        }
    }
};
//** ======================== GET SHOP ADDRESS ========================
const getShopAddress = async (req, res) => {
    const { role, userId } = req.user;
    const { id } = req.params;
    if (role === 'user') {
        try {
            const shop = await Shop.findById(id);
            if (!shop) {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'No shop found' });
            }
            const listAddress = await Address.findById(shop.addresses);
            return res.status(StatusCodes.OK).json({ status: 'success', data: { addresses: listAddress } });
        } catch (err) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { error: err } });
        }
    }
    if (role === 'admin') {
        try {
            const shop = await Shop.findById(id);
            if (!shop) {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'No shop found' });
            }
            const listAddress = await Address.findById(shop.addresses);
            return res.status(StatusCodes.OK).json({ status: 'success', data: { addresses: listAddress } });
        } catch (err) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { error: err } });
        }
    } else {
        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'No user found' });
            }
            const shop = await Shop.findById(user.shop);
            if (!shop) {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'No shop found' });
            }
            const listAddress = await Address.findById(shop.addresses);
            return res.status(StatusCodes.OK).json({ status: 'success', data: { addresses: listAddress } });
        } catch (err) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { error: err } });
        }
    }
};

//** ======================== ADD ADDRESS ========================
const addAddress = async (req, res) => {
    const { userId } = req.user;
    const { forShop } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ status: 'err', data: { error: 'No user found' } });
        }
        if (forShop) {
            const shop = await Shop.findById(user.shop);
            if (!shop) {
                return res.status(StatusCodes.UNAUTHORIZED).json({ status: 'err', data: { error: 'No shop found' } });
            }
            const { name, addressData, isHome, isWork } = req.body;
            const newAddress = await Address.create({
                name: null,
                address: addressData,
                phone: '0',
                isHome: false,
                isWork: false,
            });
            shop.addresses = newAddress._id;
            await shop.save();
            return res.status(StatusCodes.OK).json({ status: 'sucess', data: { msg: 'Address create' } });
        } else {
            const { name, addressData, isHome, isWork, phone } = req.body;
            const newAddress = await Address.create({
                name: name,
                address: addressData,
                phone: phone,
                isHome: isHome,
                isWork: isWork,
            });
            user.addresses.push(newAddress._id);
            await user.save();
            return res.status(StatusCodes.OK).json({ status: 'sucess', data: { msg: 'Address create' } });
        }
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { error: err } });
    }
};

//** ======================== UPDATE ADDRESS ========================
const updateAddress = async (req, res) => {
    const { id } = req.params;
    const { userId } = req.user;
    const updateData = req.body;
    try {
        await Address.findByIdAndUpdate(id, updateData);
        res.status(StatusCodes.OK).json({ status: 'sucess', data: { msg: 'Address update' } });
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { error: err } });
    }
};

//** ======================== DELETE ADDRESS ========================
const deleteAddress = async (req, res) => {
    const { id } = req.params;
    const { userId } = req.user;
    const { isShop } = req.body;
    try {
        const address = await Address.findById(id);
        if (!address) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { error: 'No address found' } });
        }
        if (isShop) {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { error: 'No user found' } });
            }
            const shop = await Shop.findById(user.shop);
            if (!shop) {
                return res
                    .status(StatusCodes.INTERNAL_SERVER_ERROR)
                    .json({ status: 'error', data: { error: 'User have no shop' } });
            }
            if (shop.addresses !== address._id) {
                return res
                    .status(StatusCodes.INTERNAL_SERVER_ERROR)
                    .json({ status: 'error', data: { error: 'Your shop dont own this address' } });
            }
            shop.addresses = null;
            await shop.save();
            await address.delete();
            return res.status(StatusCodes.OK).json({ status: 'sucess', data: { msg: 'Address deleted' } });
        } else {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { error: 'No user found' } });
            }
            if (!user.addresses.includes(address._id)) {
                return res
                    .status(StatusCodes.INTERNAL_SERVER_ERROR)
                    .json({ status: 'error', data: { error: 'You dont own this address' } });
            }
            const addressRefToRemove = user.addresses.indexOf(address._id);
            if (addressRefToRemove !== -1) {
                user.addresses.splice(addressRefToRemove, 1);
            } else {
                throw new Error('Không tìm thấy phần tử cần loại bỏ trong mảng tham chiếu');
            }
            await user.save();
            await address.delete();
            return res.status(StatusCodes.OK).json({ status: 'sucess', data: { msg: 'Address deleted' } });
        }
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { error: err } });
    }
};

module.exports = {
    getAddress,
    addAddress,
    getShopAddress,
    updateAddress,
    deleteAddress,
};
