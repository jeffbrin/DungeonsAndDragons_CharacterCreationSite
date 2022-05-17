const express = require('express');
const router = express.Router();
const authenticationController = require('./authenticationHelperController')
const routeRoot = '/';

async function getHomeLoggedIn(request, response, username){
    const currentRenderObj = {homeActive: true, username: username};

    const query = request.query;
    if (query.error)
        currentRenderObj.error = query.error;
    if(query.warning)
        currentRenderObj.warning = query.warning;
    if(query.confirmation)
        currentRenderObj.confirmation = query.confirmation;

    response.status(200).render('home.hbs', currentRenderObj);
}

async function getHomeLoggedOut(request, response){
    const currentRenderObj = {homeActive: true};

    const query = request.query;
    if (query.error)
        currentRenderObj.error = query.error;
    if(query.warning)
        currentRenderObj.warning = query.warning;
    if(query.confirmation)
        currentRenderObj.confirmation = query.confirmation;

    response.status(200).render('home.hbs', currentRenderObj);
}

router.get('/', (request, response) => {authenticationController.loadDifferentPagePerLoginStatus(request, response, getHomeLoggedIn, getHomeLoggedOut)});
router.get('/home', (request, response) => {response.redirect('/');});

module.exports = {
    router,
    routeRoot
}
