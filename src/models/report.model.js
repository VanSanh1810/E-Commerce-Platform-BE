const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        target: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: 'target.type',
            },
            type: {
                type: String,
                enum: ['Product', 'Review'],
                required: true,
                default: 'Product',
            },
        },
        reason: {
            type: String,
        },
        markAtRead: {
            type: Boolean,
            default: false,
        },
        createDate: {
            type: String,
        },
        modifyDate: {
            type: String,
        },
    },
    // { timestamps: true },
);

reportSchema.pre('save', function (next) {
    const currentDate = new Date().getTime();
    this.createDate = this.createDate || currentDate;
    this.modifyDate = currentDate;
    next();
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
