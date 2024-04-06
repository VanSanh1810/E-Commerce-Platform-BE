const createTokenUser = (user) => {
    return {
        email: user.email,
        name: user.name,
        userId: user._id,
        role: user.role,
        status: user.status,
        shop : user.shop?._id,
    };
};

module.exports = createTokenUser;
