const mongoose = require('mongoose');

const productSnapshotSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        productJson: {
            type: mongoose.Schema.Types.String,
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

productSnapshotSchema.pre('save', function (next) {
    const currentDate = new Date().getTime();
    this.createDate = this.createDate || currentDate;
    this.modifyDate = currentDate;
    next();
});

const ProductSnapshot = mongoose.model('ProductSnapshot', productSnapshotSchema);

module.exports = ProductSnapshot;
