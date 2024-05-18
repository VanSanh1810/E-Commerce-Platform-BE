const { StatusCodes } = require('http-status-codes');
const ShipCost = require('../models/shipCost.model');
const Shop = require('../models/shop.model');
const Address = require('../models/address.model');

const getShipCost = async (req, res) => {
    try {
        const shipCost = await ShipCost.find();
        const inShipCost = shipCost[0].inShipCost;
        const outShipCost = shipCost[0].outShipCost;
        return res.status(StatusCodes.OK).json({ outShipCost, inShipCost });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: err });
    }
};

const updateShipCost = async (req, res) => {
    try {
        const { inShipCost, outShipCost } = req.body;
        const shipCost = await ShipCost.find();
        if (inShipCost) {
            shipCost[0].inShipCost = inShipCost;
        }
        if (outShipCost) {
            shipCost[0].outShipCost = outShipCost;
        }
        shipCost[0].save();
        return res.status(StatusCodes.OK).json({ status: 'OK' });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: err });
    }
};

const calculateShipCost = async (req, res) => {
    const { shopId, addressState, userAddress } = req.body;
    try {
        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: 'No sho found' });
        }
        const shopAddress = await Address.findById(shop.addresses);
        if (!shopAddress) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: 'No shop address found' });
        }
        //
        const sCost = await ShipCost.find();
        if (addressState) {
            // user address
            const address = await Address.findById(userAddress);
            if (!address) {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'err', data: { err: 'No address found' } });
            }
            if (shopAddress.address.province === address.address.province) {
                return res.status(StatusCodes.OK).json({ shipCost: sCost[0].inShipCost });
            } else {
                return res.status(StatusCodes.OK).json({ shipCost: sCost[0].outShipCost });
            }
        } else {
            // new address
            if (shopAddress.address.province === parseInt(userAddress.province)) {
                return res.status(StatusCodes.OK).json({ shipCost: sCost[0].inShipCost });
            } else {
                return res.status(StatusCodes.OK).json({ shipCost: sCost[0].outShipCost });
            }
        }
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err: err });
    }
};

module.exports = {
    getShipCost,
    updateShipCost,
    calculateShipCost,
};
