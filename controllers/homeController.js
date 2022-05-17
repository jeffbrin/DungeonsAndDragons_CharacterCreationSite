const express = require('express');
const { InvalidSessionError, DatabaseError } = require('../models/errorModel');
const router = express.Router();
const userModel = require('../models/userModel');
const authenticationController = require('./authenticationHelperController');
const characterAuthentication = require('./characterController');
const routeRoot = '/';


// /**
//  * Responds to an http request with a response containing the spells home page.
//  * @param {object} request An http request object.
//  * @param {object} response An http response object.
//  */
// async function getHome(request, response){

//     // Check if there are no cookies
//     if(!request.cookies){
//         response.status(200);
//         response.render('home.hbs', {homeActive: true});
//     }
//     else{
//         // Get the cookie and authenticate
//         userModel.refreshSession(request.cookies.sessionId)
//         .then(async newSession => {
//             response.status(200);
//             response.cookie("sessionId", newSession.sessionId, { expires: newSession.expiryDate });
//             response.render('home.hbs', {homeActive: true, username: await userModel.getUsernameFromSessionId(newSession.sessionId)})
//         })
//         .catch(error => {
//             if (error instanceof InvalidSessionError){
//                 // Delete the cookie
//                 response.clearCookie('sessionId');
//                 response.status(400).render('home.hbs', {homeActive: true});
//             }
//             else if(error instanceof DatabaseError){
//                 response.status(500).render('home.hbs', {homeActive: true, error: 'Something went wrong on our end, you may have been logged out.', status: 500});
//             }
//             else{
//                 response.status(500).render('home.hbs', {homeActive: true, error: 'Something went wrong, if you were logged in, you may have been logged out.'});
//             }
//         })
//     }

// }

async function getHomeLoggedIn(request, response, username, userId) {
    try {
        let cookieObj = await characterAuthentication.getCookieObjectFromRequestAndUserId(request, userId);

        if (!cookieObj) {
            response.status(200).render('home.hbs', {
                homeActive: true, username: username
            });
        }
        else {
            response.status(200).render('home.hbs', {
                homeActive: true, username: username, recentCharacters: cookieObj
            });
        }

    } catch (error) {
        response.status(400).render('home.hbs', { homeActive: true, username: username, error: `Error getting the recent Characters list` });
    }

}

async function getHomeLoggedOut(request, response) {
    response.status(200).render('home.hbs', { homeActive: true });
}

router.get('/', (request, response) => { authenticationController.loadDifferentPagePerLoginStatus(request, response, getHomeLoggedIn, getHomeLoggedOut) });
router.get('/home', (request, response) => { response.redirect('/'); });

module.exports = {
    router,
    routeRoot
}
