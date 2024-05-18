const userModel = require('../models/user.model');
const ShipCost = require('../models/shipCost.model');
const adminData = require('./admin.json');

const genData = async () => {
    const emailAlreadyExists = await userModel.findOne({ email: 'admin@gmail.com' });

    if (!emailAlreadyExists) {
        await userModel.create(adminData);
        console.log('Genarated admin data !');
    }

    const shipCost = await ShipCost.find();
    if (!shipCost || shipCost.length === 0) {
        ShipCost.create({ inShipCost: 1.1, outShipCost: 1.5 });
        console.log('Genarated ship cost data !');
    }
};

module.exports = genData;
