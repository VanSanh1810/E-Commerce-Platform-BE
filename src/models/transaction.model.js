const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        stringyData: {
            type: String,
            required: true,
        },
        createDate: {
            type: Number,
        },
        modifyDate: {
            type: Number,
        },
    },
    // { timestamps: true },
);

transactionSchema.pre('save', function (next) {
    const currentDate = new Date().getTime();
    this.createDate = this.createDate || currentDate;
    this.modifyDate = currentDate;
    next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
