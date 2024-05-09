const express = require('express');
const route = express.Router();

const authApi = require('../apis/auth.api');

route.post('/login', authApi.login);
route.post('/register', authApi.register);
route.post('/logout', authApi.logout);

route.post('/validate', authApi.validateToken);
route.post('/resetPass', authApi.forgotPassword);

module.exports = route;
