const mongoose = require('mongoose');

const classifySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        shop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shop',
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

classifySchema.pre('save', function (next) {
    const currentDate = new Date().getTime();
    this.createDate = this.createDate || currentDate;
    this.modifyDate = currentDate;
    next();
});

const Classify = mongoose.model('Classify', classifySchema);

module.exports = Classify;
