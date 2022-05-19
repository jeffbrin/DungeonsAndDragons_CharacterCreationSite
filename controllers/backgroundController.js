const express = require('express');
const router = express.Router();
const routeRoot = '/backgrounds';
const model = require('../models/backgroundModel');
const authenticator = require('./authenticationHelperController')
const errors = require('../models/errorModel');
const {DatabaseError, InvalidInputError} = require('../models/errorModel');
const userModel = require('../models/userModel');

/**
 * on a get request, the getAllBackgrounds method from the model is called
 * responds with correct error codes depending on type of error thrown in the model method
 * @param {HTTPRequest} request 
 * @param {HTTPResponse} response
 */
 async function getAllBackgrounds(request, response, username) {
    try {
        let found = await model.getAllBackgrounds();
        // console.log(found);
        // console.log(found[0])
        response.status(201).render('backgrounds.hbs', { backgroundsActive: true, backgrounds: found, username: username });
    }
    catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('backgrounds.hbs', { error: true, message: "Database error, Couldn't get Backgrounds" });
            console.log("Database Error - From getAllBackgrounds in backgroundController");
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400).render('backgrounds.hbs', { error: true, message: "Input Error, Couldn't get all Backgrounds" });
            console.log('input error - from getAllBackgrounds in backgroundController');
        }
        else{
            console.log(error.message);
        }
    }
}

// Using loadDifferentPagePerLoginStatus to automatically refresh the session
router.get('/', (request, response) => {authenticator.loadDifferentPagePerLoginStatus(request, response, getAllBackgrounds, getAllBackgrounds)});


// Focus on a specific background
async function showSpecificBackground(request, response, username){
    console.log("Inside showSpecificBackground");
    try{
        console.log("about to get specific background")
        const background = await model.getBackground(request.params.id);
        console.log(background);
        response.status(200).render('backgroundFocus.hbs', {background: background, username: username, backgroundsActive: true})
    }
    catch(error){
        if (error instanceof DatabaseError){
            response.status(500).render('home.hbs', {homeActive: true, error: 'An error occured getting the list of backgrounds. Please wait a moment and try again.', status: 500});
        }
        else if (error instanceof InvalidInputError){
            console.log(error)
            response.status(400).render('home.hbs', {homeActive: true, error: 'You tried to access an invalid background.', status: 400});
        }
        else{
            console.log(error)
            response.status(500).render('home.hbs', {homeActive: true, error: 'Something went wrong', status: 500});
        }
    }
}
router.get('/:id', (request, response) => {authenticator.loadDifferentPagePerLoginStatus(request, response, showSpecificBackground, showSpecificBackground)})



module.exports = {
    router,
    routeRoot
}