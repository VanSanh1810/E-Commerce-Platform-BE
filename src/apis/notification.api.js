const Notify = require('../models/notification.model');
const User = require('../models/user.model');
const { StatusCodes } = require('http-status-codes');

const getAllNotify = async (req, res) => {
    const { userId } = req.user;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: 'No user found' } });
        }
        const listNotify = await Notify.find({ to: user._id });
        return res.status(StatusCodes.OK).json({ status: 'success', listNotify: listNotify });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: err } });
    }
};

const markAtReadNotify = async (req, res) => {
    const { listNotify, readedAction } = req.body;
    const { userId } = req.user;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ status: 'error', data: { msg: 'You dont have permission to do this action' } });
        }
        let query = {};
        if (listNotify) {
            query = { _id: { $in: listNotify }, to: user._id };
        } else {
            query = { to: user._id };
        }

        const result = await Notify.updateMany(query, { $set: { isSeen: readedAction } });
        // if (notify.length <= 0) {
        //     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: 'No notify found' } });
        // }
        // Notify.up
        // notify.isSeen = true;
        // await notify.save();

        const newListNotify = await Notify.find({ to: user._id });
        return res.status(StatusCodes.OK).json({ status: 'success', newListNotify: newListNotify });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: err } });
    }
};

const deleteNotify = async (req, res) => {
    const { notiId } = req.params;
    const { userId } = req.user;
    try {
        const notify = await Notify.findById(notiId);
        if (!notify) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: 'No notify found' } });
        }
        const user = await User.findById(userId);
        if (!user || !notify.to.equals(user._id)) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ status: 'error', data: { msg: 'You dont have permission to do this action' } });
        }
        await notify.delete();
        //
        const newListNotify = await Notify.find({ to: user._id });
        return res.status(StatusCodes.OK).json({ status: 'success', newListNotify: newListNotify });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { msg: err } });
    }
};

module.exports = {
    getAllNotify,
    markAtReadNotify,
    deleteNotify,
};
