const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: { type: String, required: true },
    isSeen: { type: Boolean, required: true },
    createDate: {
        type: Number,
    },
    modifyDate: {
        type: Number,
    },
});

messageSchema.pre('save', function (next) {
    const currentDate = new Date().getTime();
    this.createDate = this.createDate || currentDate;
    this.modifyDate = currentDate;
    next();
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
