const CustomError = require('../errors');
const { isTokenValid } = require('../utils');
const { StatusCodes } = require('http-status-codes');

const authenticateUser = async (req, res, next) => {
    const token = req.signedCookies.token;
    if (!token) {
        // throw new CustomError.UnauthenticatedError('Authentication invalid');
        return res.status(StatusCodes.UNAUTHORIZED).json({ status: 'error', data: { message: 'Token invalid' } });
    }

    try {
        const { name, userId, role, shop } = await isTokenValid({ token });
        req.user = { name, userId, role, shop };
        console.log(req.user);
        next();
    } catch (error) {
        // throw new CustomError.UnauthenticatedError('Authentication Invalid');
        return res.status(StatusCodes.UNAUTHORIZED).json({ status: 'error', data: { message: 'Token invalid' } });
    }
};

const authorizePermissions = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            // throw new CustomError.UnauthorizedError('Unauthorized to access to this route');
            return res
                .status(StatusCodes.UNAUTHORIZED)
                .json({ status: 'error', data: { message: 'Unauthorized to access to this route' } });
        }
        next();
    };
};

module.exports = { authenticateUser, authorizePermissions };
