require('dotenv').config();

const users = {};
const userSocket = {};

class SocketServices {
    connection(socket) {
        console.log(userSocket);
        console.log('connected' + socket.id + '-');
        socket.on('assign-user-data', (userId, role) => {
            console.log(userId);
            userSocket[userId] = { userId: userId, socket: socket.id, role: role };
            console.log(userSocket[userId]);
        });
        socket.on('logout', (userId) => {
            if (userId) {
                userSocket[userId] = null;
                console.log('logout:' + userId);
            }
        });

        //chat messages
        socket.on('send-dm-message', async (messageObj, roomId, curentUserUid, targetUserId) => {
            // if (roomId) {
            //     global.__io.to(roomId).emit('resive-dm-message', messageObj, roomId, curentUserUid);
            //     // console.log(`send-dm-message from ${roomId} by ${curentUserUid}`);
            //     const chatGroupRef = admin.db.collection('chatLists').doc(roomId);
            //     const data = await chatGroupRef.get();
            //     const users = await data.data().users;
            //     if (users.includes(curentUserUid)) {
            //         chatGroupRef
            //             .collection('messages')
            //             .doc(messageObj.id)
            //             .set({
            //                 message: messageObj.messData,
            //                 mediaData: messageObj.mediaData,
            //                 sendAt: messageObj.sendAt,
            //                 sendBy: curentUserUid,
            //                 type: messageObj.type ? messageObj.type : null,
            //                 isSeen: false,
            //             });
            //         chatGroupRef.update({
            //             isSeen: [curentUserUid],
            //             lastModified: Date.now(),
            //         });
            //         if (messageObj.mediaData) {
            //             messageObj.mediaData.forEach((item) => {
            //                 chatGroupRef.collection('media').add({
            //                     media: item,
            //                     sendAt: Date.now(),
            //                 });
            //             });
            //         }
            //     }
            // }
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
