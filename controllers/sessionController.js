const express = require('express');
const res = require('express/lib/response');
const app = require('../app.js');
const router = express.Router();
const routeRoot = '/sessions';
model = require('../models/userModel');
const logger = require('../logger');
const errors = require('./errorController');
const error = logger.error;
const warn = logger.warn;
const info = logger.info;



module.exports = {
    router,
    routeRoot
}