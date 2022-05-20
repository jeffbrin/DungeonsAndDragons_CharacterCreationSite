const express = require('express');
const router = express.Router();
const routeRoot = '/backgrounds';
const model = require('../models/backgroundModel');
const authenticator = require('./authenticationHelperController')
const errors = require('../models/errorModel');
const {DatabaseError, InvalidInputError} = require('../models/errorModel');
const userModel = require('../models/userModel');
const logger = require('../logger')

/**
 * on a get request, the getAllBackgrounds method from the model is called
 * responds with correct error codes depending on type of error thrown in the model method
 * @param {HTTPRequest} request 
 * @param {HTTPResponse} response
 */
 async function getAllBackgrounds(request, response, username) {
    try {
        let found = await model.getAllBackgrounds();
        response.status(201).render('backgrounds.hbs', { backgroundsActive: true, backgrounds: found, username: username });
    }
    catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('home.hbs', { status: 500, homeActive: true, error: "Database error, Couldn't get Backgrounds" });
            logger.error("Database Error - From getAllBackgrounds in backgroundController");
        }
        else{
            response.status(500).render('home.hbs', { status: 500, homeActive: true, error: "Database error, Couldn't get Backgrounds" });
            logger.error(error.message);
        }
    }
}

// Using loadDifferentPagePerLoginStatus to automatically refresh the session
router.get('/', (request, response) => {authenticator.loadDifferentPagePerLoginStatus(request, response, getAllBackgrounds, getAllBackgrounds)});


/**
 * retrieves a single background based on the id in the request
 * @param {HTTPRequest} request 
 * @param {HTTPResponse} response 
 * @param {authenticated user} username 
 */
async function showSpecificBackground(request, response, username){
    try{
        const background = await model.getBackground(request.params.id);
        response.status(200).render('backgroundFocus.hbs', {background: background, username: username, backgroundsActive: true})
    }
    catch(error){
        if (error instanceof DatabaseError){
            response.status(500).render('home.hbs', {homeActive: true, error: 'An error occured getting the list of backgrounds. Please wait a moment and try again.', status: 500});
        }
        else if (error instanceof InvalidInputError){
            logger.error(error)
            response.status(400).render('home.hbs', {homeActive: true, error: 'You tried to access an invalid background.', status: 400});
        }
        else{
            logger.error(error)
            response.status(500).render('home.hbs', {homeActive: true, error: 'Something went wrong', status: 500});
        }
    }
}
router.get('/:id', (request, response) => {authenticator.loadDifferentPagePerLoginStatus(request, response, showSpecificBackground, showSpecificBackground)})



module.exports = {
    router,
    routeRoot
}