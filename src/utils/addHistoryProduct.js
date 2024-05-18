const User = require('../models/user.model');

const addTagHistory = async (tagList, _score, userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const pTagList = tagList.split(',').map((tag) => tag.trim());
        const historyList = Array.isArray(user.productHistory) ? [...user.productHistory] : [];
        const addToList = (tag, score) => {
            const index = historyList.findIndex((item) => item.name === tag);
            if (index !== -1) {
                historyList[index].score += score;
            } else {
                historyList.push({ name: tag, score: score });
            }
        };
        for (let i = 0; i < pTagList.length; i++) {
            addToList(pTagList[i], _score);
        }
        user.productHistory = [...historyList];
        await user.save();
    } catch (e) {
        return new Error(e);
    }
};

module.exports = addTagHistory
