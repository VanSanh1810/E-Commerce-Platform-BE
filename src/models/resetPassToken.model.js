const mongoose = require('mongoose');

const ResetPassTokenSchema = new mongoose.Schema({
    token: {
        type: mongoose.Schema.Types.String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    isUsed: {
        type: Boolean,
        default: false,
    },
    createDate: {
        type: Number,
    },
    modifyDate: {
        type: Number,
    },
});

ResetPassTokenSchema.pre('save', function (next) {
    const currentDate = new Date().getTime();
    this.createDate = this.createDate || currentDate;
    this.modifyDate = currentDate;
    next();
});

module.exports = mongoose.model('ResetPassToken', ResetPassTokenSchema);
