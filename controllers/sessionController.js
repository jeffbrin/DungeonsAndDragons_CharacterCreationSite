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
 * Removes a session from the database and the cookie. Used for logout.
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

}
router.delete('/', removeSession);


/**
 * Creates a session and adds it as a cookie. Used for login.
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 */
async function login(request, response){
    //validate
    try{
        const body = request.body;
        const {sessionId, expiryDate} = await userModel.authenticateUser(body.username, body.password);
        response.cookie("sessionId", sessionId, { expires: expiryDate }); 
        response.render('home.hbs', {homeActive: true, username: body.username});
    }
    catch(error){
        if (error instanceof DatabaseError){
            response.status(500).render('home.hbs', {homeActive: true})
        }
        else{
            response.status(500).render('home.hbs', {warning: 'Failed to log out, it may not have worked.', status: 500, homeActive: true})
        }
    }
}
router.post('/', login)

module.exports = {
    router,
    routeRoot
}