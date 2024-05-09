const { isTokenValid } = require('../utils');
const User = require('../models/user.model');

const loadPageResetPass = async (req, res) => {
    const { token } = req.query;
    try {
        const decodedToken = await isTokenValid({ token: token });
        console.log(decodedToken);
        return res.render('resetPass', { token: token });
    } catch (e) {
        return res.render('resetPass', { expried: true });
    }
};

const resetPass = async (req, res) => {
    try {
        const { token, pass, repass } = req.body;
        const decodedToken = await isTokenValid({ token: token });
        const user = await User.findById(decodedToken.userId);
        if (!user) {
            return res.render('resetPass', { err: 'Internal server error' });
        }
        if (pass !== repass) {
            return res.render('resetPass', { err: 'Password do not match' });
        }
        user.password = pass;
        await user.save();
        return res.render('resetPass', { success: 'You now can login with your new password' });
    } catch (e) {
        return res.render('resetPass', { expried: true });
    }
};

module.exports = {
    loadPageResetPass,
    resetPass,
};
