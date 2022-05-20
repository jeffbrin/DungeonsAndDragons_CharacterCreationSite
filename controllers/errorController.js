const express = require('express');
const router = express.Router();
const routeRoot = '/';
const userModel = require('../models/userModel');

/**
 * Handles invalid http requests in the domain.
 * @param {Object} request The http request
 * @param {Object} response The http response
 */
async function handleInvalidEndpoint(request, response){
    response.status(404);

    try{
        let username, recentCharacters;
        if(request.cookies){
            username = await userModel.getUsernameFromSessionId(request.cookies.sessionId);
            recentCharacters = request.cookies.recentCharacters;
        }
    response.render('404Error.hbs', {username: username, recentCharacters: recentCharacters});
    }
    catch(error){
        response.render('404Error.hbs');
    }
}
router.all("*", handleInvalidEndpoint)

module.exports = {
    router, 
    routeRoot
}