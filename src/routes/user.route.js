const express = require('express');
const route = express.Router();
const uploadI = require('../utils/upload');

const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');

const userApi = require('../apis/user.api');

route.patch('/updateUserPassword', authenticateUser, userApi.updateUserPassword);

module.exports = route;
