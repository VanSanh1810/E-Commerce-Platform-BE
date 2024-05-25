const mongoose = require('mongoose');

const notifySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        isSeen: {
            type: Boolean,
            default: false,
        },
        target: {
            type: { type: String, enum: ['Review', 'Order', 'Report', 'Product', 'None'], default: 'None', required: true },
            id: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: 'target.type',
            },
            icon: {
                name: { type: String },
                color: { type: String },
            },
            secondId: { type: String, default: null },
        },
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
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

notifySchema.pre('save', function (next) {
    const currentDate = new Date().getTime();
    this.createDate = this.createDate || currentDate;
    this.modifyDate = currentDate;
    next();
});

const Notify = mongoose.model('Notify', notifySchema);

module.exports = Notify;
