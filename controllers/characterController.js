
const hbs = require('express-handlebars').create({});
const express = require('express');
const res = require('express/lib/response');
const router = express.Router();
const routeRoot = '/characters';
const model = require('../models/characterModel');
const logger = require('../logger');
const authenticator = require('./authenticationHelperController')
const userModel = require('../models/userModel')
const charStatsModel = require('../models/characterStatisticsModel');

const errors = require('../models/errorModel');



hbs.handlebars.registerHelper('equals', (arg1, arg2) => {
    return arg1 == arg2
});


async function getSheetStuff(id){

}

/**
 * Sends a character to the model by taking in the request's JSON and using it
 * @param {HTTPRequest} request The http Request object
 * @param {HTTPResponse} response The http Response object
 */
async function sendCharacter(request, response) {
    requestJson = request.body;
    try {
        let charAdded = await model.addCharacter(requestJson.name, requestJson.race, requestJson.charClass, requestJson.hitpoints);
        if (charAdded === null) {
            response.status(400);
            response.render('characters.hbs', "Character was null... somehow")

        }
        else {
            let character = await model.printDb();
            response.status(201);
            response.render('characters.hbs', { charactersActive: true, success: true, message: "Character Added", title: "Success!", character: character });
        }
    } catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500);
            logger.error("database error from sendCharacter in Character Controller");
            response.render('characters.hbs', { error: true, message: "Couldn't Add Character There was a Database Error" });
        }
        else if (error instanceof errors.InvalidInputError) {
            let character = await model.printDb();
            response.status(400).render('characters.hbs', { error: true, message: "Couldn't Add Character, Input was invalid", character: character });
            logger.error('input error - from sendCharacter in characterController');
        }
        else{
            logger.error(error.message);
            response.status(500).render('home.hbs', {error: true, message: `Something went wrong...`});
        }
    }
}


/**
 * uses the model to update the hitpoints of a character with a given id
 * @param {HTTPRequest} request the request made by the user
 * @param {HTTPResponse} response the response that will be sent back in this function depending on what happened
 */
async function updateHitpoints(request, response) {
    requestJson = request.body;
    try {
        let updated = await model.addRemoveHp(request.params.id, requestJson.hp);
        response.status(201).render('sheet.hbs', { charactersActive: true, success: true, message: "Character's hitpoints have been updated", character: await model.getCharacter(request.params.id), skills: await charStatsModel.getAllSkills(), soloCharacter: 'soloCharacter.css' });
    }
    catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('characters.hbs', { error: true, message: `Database error, Couldn't update Character with id: ${request.params.id}` });
            logger.error("Database Error - From updateHitpoints in characterController")
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400).render('characters.hbs', { error: true, message: `Input error, Couldn't get Character with id: ${request.params.id}` });
            logger.error('input error - from updateHitpoints in characterController');
        }
        else{
            logger.error(error.message);
            response.status(500).render('home.hbs', {error: true, message: `Something went wrong...`});
        }
    }
}


/**
 * On a get request, the getCharacter method from the model is called
 * responds with correct error codes depending on type of error thrown in the model method
 * @param {HTTPRequest} request 
 * @param {HTTPResponse} response
 */
async function getCharacter(request, response, sessionId) {
    try {
        const id = request.params.id;
        const userId = await userModel.getUserIdFromSessionId(sessionId);
        let found = await model.getCharacter(id);
        let allSkills = await charStatsModel.getAllSkills();
        response.status(201).render('sheet.hbs', { charactersActive: true, soloCharacter: 'soloCharacter.css', character: found, skills: allSkills});
    }
    catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('characters.hbs', { error: true, message: `Database error, Couldn't get Character with id: ${id}` });
            logger.error("Database Error - From getCharacter in characterController")
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400).render('characters.hbs', { error: true, message: `Input error, Couldn't get Character with id: ${id}` });
            logger.error('input error - from getCharacter in characterController');
        }
        else{
            response.status(400).render('characters.hbs', { error: true, message: `Catastrophic Failure` });
            logger.error('Catastrophic Failure from getCharacter in characterController');
        }
    }
}


/**
 * on a get request, the getAllCharacters method from the model is called
 * responds with correct error codes depending on type of error thrown in the model method
 * @param {HTTPRequest} request 
 * @param {HTTPResponse} response
 */
async function getAllUserCharacters(request, response, sessionId) {
    try {
        const userId = await userModel.getUserIdFromSessionId(sessionId);
        let userCharacters = await model.getUserCharacters(userId);
        // Get all the characters
        response.status(201).render('characters.hbs', { charactersActive: true, characters: userCharacters, username: await userModel.getUsernameFromSessionId(sessionId) });
    }
    catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('characters.hbs', { error: true, message: "Database error, Couldn't get Characters" });
            logger.error("Database Error - From getAllCharacters in characterController");
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400).render('characters.hbs', { error: true, message: "Input Error, Couldn't get all Characters" });
            logger.error('input error - from getAllCharacters in characterController');
        }
        else if (error instanceof errors.InvalidSessionError) {
            response.clearCookie('sessionId');
            response.status(400).render('home.hbs', {homeActive: true});
            logger.error('tried to access /characters with an invalid session');
        }
        else{
            logger.error(error.message);
            response.status(500).render('home.hbs', {error: true, message: `Something went wrong...`});
        }
    }
}



/**
 * on a put request, the update method from the model is called
 * responds with correct error codes depending on type of error thrown in the model method
 * @param {HTTPRequest} request 
 * @param {HTTPResponse} response
 */
async function updateCharacter(request, response) {
    requestJson = request.body;
    try {
        await model.updateCharacter(request.params.id, requestJson.name, requestJson.race, requestJson.charClass, requestJson.hitpoints);
        let found = await model.printDb();
        response.status(201).render('characters.hbs', { charactersActive: true, success: true, message: "Character has been Updated", character: found });
    }
    catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('characters.hbs', { error: true, message: `Database error, Couldn't update Character with id: ${request.params.id}` });
            logger.error("Database Error - From updateCharacter in characterController")
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400).render('characters.hbs', { error: true, message: `Input error, Couldn't update Character with id: ${request.params.id}` });
            logger.error('input error - from updateCharacter in characterController');
        }
        else{
            logger.error(error.message);
            response.status(500).render('home.hbs', {error: true, message: `Something went wrong...`});
        }
    }
}



/**
 * on a delete request, the delete method from the model is called
 * responds with correct error codes depending on type of error thrown in the model method
 * @param {HTTPRequest} request 
 * @param {HTTPResponse} response 
 */
async function deleteCharacter(request, response) {
    try {
        await model.deleteCharacter(request.params.id);
        let found = await model.printDb();
        response.status(201).render('characters.hbs', { charactersActive: true, success: true, message: "Character has been deleted", character: found });
    }
    catch (error) {
        if (error instanceof errors.DatabaseError) {
            let found = await model.printDb();
            response.status(500).render('characters.hbs', { error: true, message: `Database error, Couldn't delete Character with id: ${request.params.id}`, character: found });
            logger.error("Database Error - From deleteCharacter in characterController");
        }
        else if (error instanceof errors.InvalidInputError) {
            let found = await model.printDb();
            response.status(400).render('characters.hbs', { error: true, message: `Input error, Couldn't delete Character with id: ${request.params.id}`, character: found });
            logger.error('input error - from deleteCharacter in characterController');
        }
        else{
            logger.error(error.message);
            response.status(500).render('home.hbs', {error: true, message: `Something went wrong...`});
        }
    }
}


/**
 * calls the level up function in the model
 * Catches all errors and logs them and renders the pages based on the error
 * @param {HTTP} request 
 * @param {HTTP} response 
 */
async function updateLevel(request, response){
    try{
        await model.levelUp(request.params.id);
        response.status(200).render('sheet.hbs', {character: await model.getCharacter(request.params.id), skills: await charStatsModel.getAllSkills(), soloCharacter: 'soloCharacter.css', success: true, message:"You Leveled Up!"});
    }
    catch(error){
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('home.hbs', { success: true, message: `Database error, Couldn't level up Character with id: ${request.params.id}`});
            logger.error("Database Error - From updateLevel in characterController");
        }
        else if (error instanceof errors.InvalidInputError) {
            let found = await model.printDb();
            response.status(400).render('sheet.hbs', { error: true, message: `Input error, Couldn't level up Character with id: ${request.params.id}`, character: found, skills: await charStatsModel.getAllSkills(), soloCharacter: 'soloCharacter.css' });
            logger.error('input error - from updateLevel in characterController');
        }
        else{
            logger.error(error.message);
            response.status(500).render('home.hbs', {error: true, message: `Something went wrong...`});
        }
    }
}


router.put('/:id', updateCharacter);
router.post('/', sendCharacter);
router.delete('/:id', deleteCharacter);
router.get('/:id', (request, response) => authenticator.gateAccess(request, response, getCharacter));
router.get('/', (request, response) => authenticator.gateAccess(request, response, getAllUserCharacters));
router.put('/:id/hp', updateHitpoints);
router.put('/:id/levels', updateLevel);

module.exports = {
    router,
    routeRoot
}