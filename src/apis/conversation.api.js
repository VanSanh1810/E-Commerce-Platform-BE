const { StatusCodes } = require('http-status-codes');
const Conversation = require('../models/conversation.model');
const Shop = require('../models/shop.model');
const User = require('../models/user.model');
const Message = require('../models/message.model');

const createConversation = async (req, res) => {
    const { targetId, _role } = req.body;
    const { userId, role } = req.user;
    try {
        const sourcePort = req.headers.origin.split(':')[2]; // Lấy phần tử thứ 2 sau dấu ':'
        let newRole;
        if (sourcePort === '3006') {
            newRole = role;
        } else {
            // Nếu role khác 'vendor', chỉ lấy sản phẩm có status là 'active'
            newRole = 'user';
        }
        //
        let newTargetId;
        if (_role === 'vendor') {
            const shop = await Shop.findById(targetId);
            if (!shop) {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'No shop found' });
            }
            console.log(shop.vendor);
            newTargetId = shop.vendor;
        } else {
            newTargetId = targetId;
        }
        console.log(newRole);
        const conversation = await Conversation.findOne({
            $or: [
                {
                    'user.0._id': newTargetId,
                    'user.0.role': _role,
                    'user.1._id': userId,
                    'user.1.role': newRole,
                },
                {
                    'user.0._id': userId,
                    'user.0.role': newRole,
                    'user.1._id': newTargetId,
                    'user.1.role': _role,
                },
            ],
        });
        //
        if (!conversation) {
            const newConversation = new Conversation();
            newConversation.user = [
                {
                    _id: newTargetId,
                    type: _role,
                },
                { _id: userId, type: newRole },
            ];
            await newConversation.save();
            return res.status(StatusCodes.OK).json({ conversationId: newConversation._id });
        } else {
            return res.status(StatusCodes.OK).json({ conversationId: conversation._id });
        }
    } catch (err) {
        console.error(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err });
    }
};

const getMyConversations = async (req, res) => {
    const { userId, role } = req.user;
    try {
        const sourcePort = req.headers.origin.split(':')[2]; // Lấy phần tử thứ 2 sau dấu ':'
        let newRole;
        if (sourcePort === '3006') {
            newRole = role;
        } else {
            // Nếu role khác 'vendor', chỉ lấy sản phẩm có status là 'active'
            newRole = 'user';
        }
        //
        const conversations = await Conversation.find({
            $or: [
                {
                    'user.1._id': userId,
                    'user.1.role': newRole,
                },
                {
                    'user.0._id': userId,
                    'user.0.role': newRole,
                },
            ],
        }).sort({ modifyDate: -1 });
        let totalUnseen = [];
        for (let i = 0; i < conversations.length; i++) {
            const messages = await Message.find({ conversation: conversations[i]._id, sender: { $ne: userId } }).select('isSeen');
            const total = messages.reduce((total, message) => (message.isSeen ? total : total + 1), 0);
            totalUnseen.push({ _id: conversations[i].id, total: total });
        }
        return res.status(StatusCodes.OK).json({
            conversations: conversations.length > 0 ? [...conversations] : [],
            totalUnseen: totalUnseen.length > 0 ? [...totalUnseen] : [],
        });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err });
    }
};

const getConversationDetails = async (req, res) => {
    const { converId } = req.params;
    const { userId } = req.user;
    try {
        const conversation = await Conversation.findById(converId);
        if (!conversation) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'No conversation found' });
        }
        const matchedUser = [...conversation.user].find((u) => !u._id.equals(userId));
        if (!matchedUser) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'No mathched user found' });
        }
        let name;
        let img;
        if (matchedUser.type === 'vendor') {
            const shop = await Shop.findOne({ vendor: matchedUser._id });
            if (!shop) {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'No shop found' });
            }
            name = shop.name;
            img = shop.avatar.url;
        } else {
            if (matchedUser.type === 'admin') {
                name = 'ADMINISTRATOR';
                img =
                    'https://png.pngtree.com/png-vector/20190704/ourmid/pngtree-administration-icon-in-trendy-style-isolated-background-png-image_1538647.jpg';
            } else {
                const user = await User.findById(matchedUser._id);
                if (!user) {
                    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'No user found' });
                }
                name = user.name;
                img =
                    'https://e7.pngegg.com/pngimages/178/595/png-clipart-user-profile-computer-icons-login-user-avatars-monochrome-black.png';
            }
        }
        return res.status(StatusCodes.OK).json({ title: name, img: img });
    } catch (err) {
        console.error(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err });
    }
};

const getConversationMessages = async (req, res) => {
    const { userId } = req.user;
    const { converId } = req.params;
    try {
        await Message.updateMany({ conversation: converId, sender: { $ne: userId } }, { isSeen: true });
        const messages = await Message.find({ conversation: converId }).sort({ createDate: 1 });
        return res.status(StatusCodes.OK).json({
            messages: [...messages],
        });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err });
    }
};

const markAtRead = async (req, res) => {
    const { converId } = req.params;
    const { userId } = req.user;
    try {
        const result = await Message.updateMany({ conversation: converId, sender: { $ne: userId } }, { isSeen: true });
        return res.status(StatusCodes.OK).json({ message: 'Conversation readed' });
    } catch (err) {
        console.error(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err });
    }
};

module.exports = {
    createConversation,
    getMyConversations,
    getConversationDetails,
    getConversationMessages,
    markAtRead,
};
