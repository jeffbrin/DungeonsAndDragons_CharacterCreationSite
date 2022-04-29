///This controller is to add users to the database
const express = require('express');
const app = require('../app.js');
const router = express.Router();
const routeRoot = '/users';
model = require('../models/userModel');
const logger = require('../logger');
const errors = require('./errorController');
const error = logger.error;
const warn = logger.warn;
const info = logger.info;


async function createrUser(){

}

module.exports = {
    router,
    routeRoot
}