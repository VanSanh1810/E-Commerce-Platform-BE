const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    content: { type: String, required: true },
    isSeen: { type: Boolean, required: true },
});

const conversationSchema = new mongoose.Schema(
    {
        user: [
            {
                type: { type: String, enum: ['active', 'disabled', 'draft'] },
                _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            },
        ],
        messages: [messageSchema],
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
