const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./custom');

class UnauthorizedError extends CustomAPIError {
    constructor(message) {
        super(message);
        this.statusCode = StatusCodes.FORBIDDEN;
    }
}

module.exports = UnauthorizedError;
