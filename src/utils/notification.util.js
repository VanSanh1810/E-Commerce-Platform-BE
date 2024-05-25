const socketService = require('../services/socket.service');
const Notify = require('../models/notification.model');

const emitNotify = (targetId, notifyData) => {
    const socketObj = socketService.getUserSocket();
    //
    if (socketObj[targetId]?.userId) {
        socketObj[targetId].socketInstance.emit('receive-notify', {
            _id: notifyData._id,
            isSeen: false,
            title: notifyData.title,
            target: {
                ...notifyData.target,
            },
            createDate: new Date().getTime(),
        });
    }
};

const saveNotifyToDb = async (target, notifyData) => {
    //target is list
    let _icon = {
        name: null,
        color: null,
    };
    //
    switch (notifyData.target.type) {
        case 'Review':
            _icon.name = 'star';
            _icon.color = 'yellow';
            break;
        case 'Order':
            _icon.name = 'local_mall';
            _icon.color = 'green';
            break;
        case 'Report':
            _icon.name = 'flags';
            _icon.color = 'red';
            break;
        case 'Product':
            _icon.name = 'package_2';
            _icon.color = 'purple';
            break;
        case 'None':
            _icon.name = 'notifications';
            _icon.color = 'blue';
            break;
        default:
            break;
    }
    try {
        for (let i = 0; i < target.length; i++) {
            const notify = new Notify();
            notify.title = notifyData.title;
            notify.to = target[i];
            notify.target = {
                id: notifyData.target.id,
                type: notifyData.target.type,
                icon: { ..._icon },
            };
            if (notifyData.target.secondId) {
                notify.target.secondId = notifyData.target.secondId;
            } else {
                notify.target.secondId = null;
            }
            notify.isSeen = false;
            await notify.save();
            emitNotify(target[i], notify);
        }
    } catch (e) {
        //err
        return new Error(e);
    }
};

module.exports = { saveNotifyToDb, emitNotify };
