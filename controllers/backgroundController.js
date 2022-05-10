const express = require('express');
const router = express.Router();
const routeRoot = '/backgrounds';
const model = require('../models/backgroundModel');
const authenticator = require('./authenticationHelperController')
const errors = require('../models/errorModel');

/**
 * on a get request, the getAllBackgrounds method from the model is called
 * responds with correct error codes depending on type of error thrown in the model method
 * @param {HTTPRequest} request 
 * @param {HTTPResponse} response
 */
 async function getAllBackgrounds(request, response, username) {
    try {
        let found = await model.getAllBackgrounds();
        console.log(found);
        console.log(found[0])
        response.status(201).render('backgrounds.hbs', { backgroundsActive: true, backgrounds: found, username });
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

module.exports = {
    router,
    routeRoot
}