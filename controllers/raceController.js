const express = require('express');
const router = express.Router();
const routeRoot = '/races';
const raceModel = require('../models/raceModel');
const logger = require('../logger');
const {DatabaseError, InvalidInputError} = require('../models/errorModel')
const userModel = require('../models/userModel');


// Get all races
async function showAllRaces(request, response){
    try{
        // Check if the user is logged in
        let username = null;
        try{
            username = await userModel.getUsernameFromSessionId(request.cookie.sessionId);
        }
        catch(error){
            // Not logged in
        }

        const allRaces = await raceModel.getAllRaces();
        response.status(200).render('raceList.hbs', {races: allRaces, username: username})
    }
    catch(error){
        if (error instanceof DatabaseError){
            response.status(500).render('home.hbs', {homeActive: true, error: 'An error occured getting the list of races. Please wait a moment and try again.', status: 500});
        }
        else{
            response.status(500).render('home.hbs', {homeActive: true, error: 'Something went wrong', status: 500});
        }
    }
}
router.get('/', showAllRaces)

// Focus on a specific race

module.exports = {
    router,
    routeRoot
}