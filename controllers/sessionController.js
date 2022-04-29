//this module is to authenticate and give sessions / cookies to users that are already in the database
const express = require('express');
const res = require('express/lib/response');
const app = require('../app.js');
const router = express.Router();
const routeRoot = '/sessions';
const uuid = require('uuid');
const model = require('../models/userModel');
const logger = require('../logger');
const errors = require('./errorController');
const SESSION_TIME = 15;




async function createSession(request, response) {
    try {
        //validate
        requestJson = request.body;
        await model.authenticateUser(requestJson.username, requestJson.password);
        //create session
        let sessionID = await model.createSession(requestJson.username, SESSION_TIME);
    } catch (error) {

    }


    await model.createSession();
}
router.post('/sessions', createSession);


module.exports = {
    router,
    routeRoot
}