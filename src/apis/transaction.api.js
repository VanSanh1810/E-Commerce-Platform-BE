const { StatusCodes } = require('http-status-codes');
const Transaction = require('../models/transaction.model');

const getTransactionOrders = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ status: 'error', data: { message: 'No transaction found' } });
        }
        const ordersInTransaction = JSON.parse(transaction.stringyData);
        res.status(StatusCodes.OK).json({ status: 'success', data: { orders: [...ordersInTransaction] } });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ status: 'error', data: { message: err } });
    }
};

module.exports = {
    getTransactionOrders,
};
