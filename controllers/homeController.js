const express = require('express');
const router = express.Router();
const authenticationController = require('./authenticationHelperController')
const routeRoot = '/';
const url = require('url');

/**
 * Gets a url format to be used in a redirect.
 * @param {String} pathname The path to redirect to
 * @param {Object} queryObject The object to put in the query.
 * @returns A url format to use in a redirect
 */
function getUrlFormat(pathname, queryObject){
    return url.format({pathname: pathname, query: queryObject});
}

async function getHomeLoggedIn(request, response, username){
    const currentRenderObj = {homeActive: true, username: username};

    // Add redirect query norifications
    const query = request.query;
    if (query.error)
        currentRenderObj.error = query.error;
    if(query.warning)
        currentRenderObj.warning = query.warning;
    if(query.confirmation)
        currentRenderObj.confirmation = query.confirmation;
    if(query.status)
        currentRenderObj.status = query.status;
    if(query.loginError)
        currentRenderObj.loginError = query.loginError;

    response.status(200).render('home.hbs', currentRenderObj);
}

async function getHomeLoggedOut(request, response){
    const currentRenderObj = {homeActive: true};

    // Add redirect query notifications
    const query = request.query;
    if (query.error)
        currentRenderObj.error = query.error;
    if(query.warning)
        currentRenderObj.warning = query.warning;
    if(query.confirmation)
        currentRenderObj.confirmation = query.confirmation;
    if(query.status)
        currentRenderObj.status = query.status;
    if(query.lightTheme)
        currentRenderObj.lightTheme = JSON.parse(query.lightTheme);
    if(query.loginError)
        currentRenderObj.loginError = query.loginError;

    response.status(200).render('home.hbs', currentRenderObj);
}

router.get('/', (request, response) => { authenticationController.loadDifferentPagePerLoginStatus(request, response, getHomeLoggedIn, getHomeLoggedOut) });
router.get('/home', (request, response) => { 
    const query = request.query;
    if(query)
        response.redirect(getUrlFormat('/', query))
    else
        response.redirect('/');
 });

module.exports = {
    router,
    routeRoot
}
