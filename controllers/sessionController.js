//this module is to authenticate and give sessions / cookies to users that are already in the database
const express = require('express');
const res = require('express/lib/response');
const app = require('../app.js');
const router = express.Router();
const routeRoot = '/sessions';
const userModel = require('../models/userModel');
const logger = require('../logger');
const {DatabaseError} = require('../models/errorModel');



/**
 * 
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 */
async function removeSession(request, response) {
        //validate
        try{
            const cookies = request.cookies;
            response.clearCookie('sessionId');
            await userModel.removeSession(cookies.sessionId);
        }
        catch(error){
            if (error instanceof DatabaseError){
                response.status(500).render('home.hbs', {homeActive: true})
            }
            else{
                response.status(500).render('home.hbs', {warning: 'Failed to log out, it may not have worked.', status: 500, homeActive: true})
            }
        }


    await model.createSession();
}
router.delete('/', createSession);


module.exports = {
    router,
    routeRoot
}