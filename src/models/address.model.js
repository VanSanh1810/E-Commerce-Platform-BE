const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    name: {
        type: mongoose.Schema.Types.String,
        required: true,
    },
    phone: {
        type: mongoose.Schema.Types.String,
        required: true,
    },
    address: {
        province: {
            type: mongoose.Schema.Types.Number,
            required: true,
        },
        district: {
            type: mongoose.Schema.Types.Number,
            required: true,
        },
        ward: {
            type: mongoose.Schema.Types.Number,
            required: true,
        },
        detail: {
            type: mongoose.Schema.Types.String,
            required: true,
        },
    },
    isHome: {
        type: Boolean,
        default: false,
    },
    isWork: {
        type: Boolean,
        default: false,
    },
    createDate: {
        type: String,
    },
    modifyDate: {
        type: String,
    },
});

AddressSchema.pre('save', function (next) {
    const currentDate = new Date().getTime();
    this.createDate = this.createDate || currentDate;
    this.modifyDate = currentDate;
    next();
});

module.exports = mongoose.model('Address', AddressSchema);
