const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    address: {
        type: String,
        required: [true, 'Please provide address'],
    },
    createDate: {
        type: String,
    },
    modifyDate: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account', // Assuming your User model is named "User"
    },
});

module.exports = mongoose.model('Address', AddressSchema);
