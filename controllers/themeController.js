//this module is to authenticate and give sessions / cookies to users that are already in the database
const express = require('express');
const router = express.Router();
const routeRoot = '/themes';
const logger = require('../logger');
const url = require('url')

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
 * Creates a boolean theme and adds it as a cookie. Used for login.
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 */
async function lightSwitch(request, response){
    //validate
    try{
        let lightBool = JSON.parse(request.body.lightMode);
        


        const body = request.body;
        response.cookie("lightTheme", lightBool);
        
        // Recent characters added by jeffrey since it wasn't loading the recent characters after a colour preference change
        response.redirect(getUrlFormat('/home', {lightTheme:lightBool, recentCharacters: request.query.recentCharacters}));
    }
    catch(error){
        logger.error(error);
    }
}
router.post('/', lightSwitch)

module.exports = {
    router,
    routeRoot
}
