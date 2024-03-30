const userModel = require('../models/user.model');
const adminData = require('./admin.json');

const genData = async () => {
    const emailAlreadyExists = await userModel.findOne({ email: 'admin@gmail.com' });

    if (!emailAlreadyExists) {
        await userModel.create(adminData);
        console.log('Genarated admin data !');
    }
};

module.exports = genData;
