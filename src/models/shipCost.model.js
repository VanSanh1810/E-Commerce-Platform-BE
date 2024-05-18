const mongoose = require('mongoose');

const shipCostSchema = new mongoose.Schema({
    inShipCost: {
        type: Number,
    },
    outShipCost: {
        type: Number,
    },
    createDate: {
        type: Number,
    },
    modifyDate: {
        type: Number,
    },
});

shipCostSchema.pre('save', function (next) {
    const currentDate = new Date().getTime();
    this.createDate = this.createDate || currentDate;
    this.modifyDate = currentDate;
    next();
});

module.exports = mongoose.model('ShipCost', shipCostSchema);
