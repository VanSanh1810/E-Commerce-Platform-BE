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
            type: { type: String, enum: ['Review', 'Order', 'Report', 'None'], default: 'None', required: true },
            id: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: 'target.type',
            },
        },
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
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
