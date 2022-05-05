//this module is to authenticate and give sessions / cookies to users that are already in the database
const express = require('express');
const router = express.Router();
const routeRoot = '/sessions';
const userModel = require('../models/userModel');
const logger = require('../logger');
const {DatabaseError, UserNotFoundError, IncorrectPasswordError, InvalidUsernameError, InvalidPasswordError} = require('../models/errorModel');



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
            response.render('home.hbs', {homeActive: true})
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
        response.status(201).render('home.hbs', {homeActive: true, username: body.username});
    }
    catch(error){
        if (error instanceof UserNotFoundError){
            response.status(400).render('home.hbs', {homeActive: true, loginError: 'User not found.'})
            logger.error(error.toString())
        }
        else if (error instanceof IncorrectPasswordError){
            response.status(400).render('home.hbs', {homeActive: true, loginError: 'Incorrect password.'})
            logger.error(error.toString())
        }
        else if (error instanceof InvalidUsernameError){
            response.status(400).render('home.hbs', {homeActive: true, loginError: error.message})
            logger.error(error.toString())
        }
        else if (error instanceof InvalidPasswordError){
            response.status(400).render('home.hbs', {homeActive: true, loginError: 'Invalid Password'})
            logger.error(error.toString())
        }
        else if (error instanceof DatabaseError){
            response.status(500).render('home.hbs', {homeActive: true, error: 'Something went wrong on our end, please try logging in again in a moment.', status: 500})
            logger.error(error.toString())
        }
        else{
            response.status(500).render('home.hbs', {warning: 'Failed to log in.', status: 500, homeActive: true})
            logger.error(error)
        }
    }
}
router.post('/', login)

module.exports = {
    router,
    routeRoot
}