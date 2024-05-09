const express = require('express');
const route = express.Router();

const resetPassController = require('../controllers/resetPass.controller');

route.get('/', resetPassController.loadPageResetPass);
route.post('/', resetPassController.resetPass);

module.exports = route;
