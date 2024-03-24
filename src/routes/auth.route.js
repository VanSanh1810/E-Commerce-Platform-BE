const express = require('express');
const route = express.Router();

const authApi = require('../apis/auth.api');

route.post('/login', authApi.login);
route.post('/register', authApi.register);
route.post('/logout', authApi.logout);

module.exports = route;