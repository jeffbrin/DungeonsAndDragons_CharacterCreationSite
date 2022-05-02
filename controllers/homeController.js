const express = require('express');
const { InvalidSessionError, DatabaseError } = require('../models/errorModel');
const router = express.Router();
const userModel = require('../models/userModel');
const routeRoot = '/';


/**
 * Responds to an http request with a response containing the spells home page.
 * @param {object} request An http request object.
 * @param {object} response An http response object.
 */
async function getHome(request, response){

    // Check if there are no cookies
    if(!request.cookies){
        response.status(200);
        response.render('home.hbs', {homeActive: true});
    }
    else{
        // Get the cookie and authenticate
        userModel.refreshSession(request.cookies.sessionId)
        .then(async newSession => {
            response.status(200);
            response.cookie("sessionId", newSession.sessionId, { expires: newSession.expiryDate });
            response.render('home.hbs', {homeActive: true, username: await userModel.getUsernameFromSessionId(newSession.sessionId)})
        })
        .catch(error => {
            if (error instanceof InvalidSessionError){
                // Delete the cookie
                response.clearCookie('sessionId');
                response.status(400).render('home.hbs', {homeActive: true});
            }
            else if(error instanceof DatabaseError){
                response.status(500).render('home.hbs', {homeActive: true, error: 'Something went wrong on our end, you may have been logged out.', status: 500});
            }
            else{
                response.status(500).render('home.hbs', {homeActive: true, error: 'Something went wrong, if you were logged in, you may have been logged out.'});
            }
        })
    }

}

router.get('/', getHome);
router.get('/home', getHome);

module.exports = {
    router,
    routeRoot
}
