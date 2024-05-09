const mongoose = require('mongoose');
const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
    },
});

const bannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
        },
        image: imageSchema,
        discount: {
            type: mongoose.Schema.Types.Number,
            required: true,
        },
        maxValue: {
            type: mongoose.Schema.Types.Number,
            required: true,
        },
        startDate: {
            type: mongoose.Schema.Types.Number,
            required: true,
        },
        endDate: {
            type: mongoose.Schema.Types.Number,
            required: true,
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

bannerSchema.pre('save', function (next) {
    const currentDate = new Date().getTime();
    this.createDate = this.createDate || currentDate;
    this.modifyDate = currentDate;
    next();
});

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
