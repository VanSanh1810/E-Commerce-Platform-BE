const express = require('express');
const route = express.Router();
const uploadI = require('../utils/upload');

const { authenticateUser, authorizePermissions, authenticateUser2 } = require('../middlewares/authentication');

const shipCostApi = require('../apis/shipCost.api');

route.post('/calculateShipCost', shipCostApi.calculateShipCost);
route.post('/', authenticateUser, authorizePermissions('admin'), shipCostApi.updateShipCost);
route.get('/', shipCostApi.getShipCost);

module.exports = route;
