const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        root: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
        },
        child: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category',
            },
        ],
        createDate: {
            type: String,
        },
        modifyDate: {
            type: String,
        },
    },
    // { timestamps: true },
);

categorySchema.pre('save', function (next) {
    const currentDate = new Date().getTime();
    this.createDate = this.createDate || currentDate;
    this.modifyDate = currentDate;
    next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
