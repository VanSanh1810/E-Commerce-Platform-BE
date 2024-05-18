require('dotenv').config();
const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');

const users = {};
const userSocket = {};

class SocketServices {
    getUserSocket() {
        return userSocket;
    }
    connection(socket) {
        console.log(userSocket);
        console.log('connected' + socket.id + '-');
        socket.on('assign-user-data', (userId, role) => {
            console.log(userId);
            // userSocket[userId] = { userId: userId, socket: socket.id, role: role };
            userSocket[userId] = { userId: userId, socket: socket.id, role: role, socketInstance: socket };
            console.log(userSocket[userId]);
        });
        socket.on('logout', (userId) => {
            if (userId) {
                userSocket[userId] = null;
                console.log('logout:' + userId);
            }
        });

        //chat messages
        socket.on('send-message', async (messageObj, targetUserId, role, conversationId) => {
            console.log('send-message', messageObj, targetUserId, role, conversationId);
            const message = new Message();
            message.conversation = conversationId;
            message.sender = messageObj.sender;
            message.content = messageObj.content;
            message.isSeen = false;
            await message.save();
            const conver = await Conversation.findById(conversationId);
            await conver.save();
            if (targetUserId && userSocket[targetUserId] && userSocket[targetUserId].role === role) {
                userSocket[targetUserId].socketInstance.emit('receive-message', messageObj, targetUserId, role, conversationId);
            }
        });

        socket.on('join-room', (roomId) => {
            socket.join(roomId);
            console.log('joined:' + roomId);
        });

        socket.on('disconnect', (reason) => {
            console.log('disconnect' + '- ' + reason);
        });
    }
}

module.exports = new SocketServices();
