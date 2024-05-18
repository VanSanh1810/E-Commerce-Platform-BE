const mongoose = require('mongoose');



const conversationSchema = new mongoose.Schema(
    {
        user: [
            {
                type: { type: String, enum: ['admin', 'vendor', 'user'] },
                _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            },
        ],
        createDate: {
            type: Number,
        },
        modifyDate: {
            type: Number,
        },
    },
    // { timestamps: true },
);

conversationSchema.pre('save', function (next) {
    const currentDate = new Date().getTime();
    this.createDate = this.createDate || currentDate;
    this.modifyDate = currentDate;
    next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
