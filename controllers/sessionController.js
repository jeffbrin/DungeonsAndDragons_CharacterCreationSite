//this module is to authenticate and give sessions / cookies to users that are already in the database
const express = require('express');
const router = express.Router();
const routeRoot = '/sessions';
const userModel = require('../models/userModel');
const logger = require('../logger');
const {DatabaseError, UserNotFoundError, IncorrectPasswordError, InvalidUsernameError, InvalidPasswordError} = require('../models/errorModel');
const url = require('url');


/**
 * Gets a url format to be used in a redirect.
 * @param {String} pathname The path to redirect to
 * @param {Object} queryObject The object to put in the query.
 * @returns A url format to use in a redirect
 */
function getUrlFormat(pathname, queryObject)
{
    return url.format({ pathname: pathname, query: queryObject });
}

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
            response.status(200)
            if(response.recentCharacters)
                response.recentCharacters = null;
            response.redirect(getUrlFormat('/home', {homeActive: true}))
        }
        catch(error){
            if (error instanceof DatabaseError){
                if(response.recentCharacters)
                    response.recentCharacters = null;
                response.status(500);
                response.redirect(getUrlFormat('/home', {homeActive: true}));
            }
            else{
                if(response.recentCharacters)
                    response.recentCharacters = null;
                response.status(500);
                response.redirect(getUrlFormat('/home', {warning: 'Failed to log out, it may not have worked.', status: 500, homeActive: true}))
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
        response.status(201);
        response.redirect(getUrlFormat('/home', {homeActive: true, username: body.username}));
    }
    catch(error){
        if (error instanceof UserNotFoundError){
            response.status(400);
            response.redirect(getUrlFormat('/home', {homeActive: true, loginError: 'User not found.'}));
            logger.error(error.toString())
        }
        else if (error instanceof IncorrectPasswordError){
            response.status(400);
            response.redirect(getUrlFormat('/home', {homeActive: true, loginError: 'Incorrect password.'}))
            logger.error(error.toString())
        }
        else if (error instanceof InvalidUsernameError){
            response.status(400);
            response.redirect(getUrlFormat('/home', {homeActive: true, loginError: error.message}));
            logger.error(error.toString())
        }
        else if (error instanceof InvalidPasswordError){
            response.status(400);
            response.redirect(getUrlFormat('/home', {homeActive: true, loginError: 'Invalid Password'}));
            logger.error(error.toString())
        }
        else if (error instanceof DatabaseError){
            response.status(500);
            response.redirect(getUrlFormat('/home', {homeActive: true, error: 'Something went wrong on our end, please try logging in again in a moment.', status: 500}));
            logger.error(error.toString())
        }
        else{
            response.status(500);
            response.redirect(getUrlFormat('/home', {warning: 'Failed to log in.', status: 500, homeActive: true}));
            logger.error(error)
        }
    }
}
router.post('/', login)

module.exports = {
    router,
    routeRoot
}