const express = require('express');
const router = express.Router();
const routeRoot = '/races';
const raceModel = require('../models/raceModel');
const hbs = require('express-handlebars').create();
const logger = require('../logger');
const {DatabaseError, InvalidInputError} = require('../models/errorModel')
const userModel = require('../models/userModel');
const classModel = require('../models/classModel');
const url = require('url');
const logger = require('../logger');

let allClasses;

hbs.handlebars.registerHelper('randomClass', () => {
    return allClasses[Math.floor(Math.random() * allClasses.length)].Name;
});

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

// Get all races
async function showAllRaces(request, response){

    try{

        // On the first request, get all the classes
        if(!allClasses)
            allClasses = await classModel.getAllClasses();


        // Check if the user is logged in
        let username = null;
        try{
            const newSession = await userModel.refreshSession(request.cookies.sessionId);
            response.cookie("sessionId", newSession.sessionId, { expires: newSession.expiryDate });
            username = await userModel.getUsernameFromSessionId(newSession.sessionId);
        }
        catch(error){
            // Not logged in
            response.clearCookie('sessionId');
        }

        const allRaces = await raceModel.getAllRaces();
        response.status(200).render('raceList.hbs', {races: allRaces, username: username, racesActive: true})
    }
    catch(error){
        if (error instanceof DatabaseError){
            response.status(500);
            response.redirect(getUrlFormat('/home', {homeActive: true, error: 'An error occured getting the list of races. Please wait a moment and try again.', status: 500}));
            logger.error(error);
        }
        else{
            response.status(500);
            response.redirect(getUrlFormat('/home', {homeActive: true, error: 'Something went wrong', status: 500}));
            logger.error(error);
        }
    }
}
router.get('/', showAllRaces)

// Focus on a specific race
async function showSpecificRace(request, response){

    try{

        // Check if the user is logged in
        let username = null;
        try{
            const newSession = await userModel.refreshSession(request.cookies.sessionId);
            response.cookie("sessionId", newSession.sessionId, { expires: newSession.expiryDate });
            username = await userModel.getUsernameFromSessionId(newSession.sessionId);
        }
        catch(error){
            // Not logged in
            response.clearCookie('sessionId');
        }

        const race = await raceModel.getRace(request.params.id);
        response.status(200).render('raceFocus.hbs', {race: race, username: username, racesActive: true})
    }
    catch(error){
        if (error instanceof DatabaseError){
            response.status(500);
            response.redirect(getUrlFormat('/home', {homeActive: true, error: 'An error occured getting the list of races. Please wait a moment and try again.', status: 500}));
            logger.error(error);
        }
        else if (error instanceof InvalidInputError){
            response.status(400);
            response.redirect(getUrlFormat('/home', {homeActive: true, error: 'You tried to access an invalid race.', status: 400}));
            logger.error(error);
        }
        else{
            response.status(500);
            response.redirect(getUrlFormat('/home', {homeActive: true, error: 'Something went wrong', status: 500}));
            logger.error(error);
        }
    }
}
router.get('/:id', showSpecificRace)


module.exports = {
    router,
    routeRoot
}