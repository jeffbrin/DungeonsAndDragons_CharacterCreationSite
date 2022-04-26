const express = require('express');
const res = require('express/lib/response');
const app = require('../app.js');
const router = express.Router();
const routeRoot = '/characters';
model = require('../model/dndModel.js');
const handlebars = require('handlebars')


handlebars.registerHelper('equals', function(arg1, arg2, options) {
    return (arg1 == arg2);
});





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
        if (error instanceof model.DatabaseError) {
            response.status(500);
            console.log("database error from sendCharacter in Character Controller");
            response.render('characters.hbs', { error: true, message: "Couldn't Add Character There was a Database Error" });
        }
        else if (error instanceof model.InvalidInputError) {
            let character = await model.printDb();
            response.status(400).render('characters.hbs', { error: true, message: "Couldn't Add Character, Input was invalid", character: character });
            console.log('input error - from sendCharacter in characterController');
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
        let updated = await model.hitpointsModifier(request.params.id, requestJson.hp);
        response.status(201).render('characters.hbs', { charactersActive: true, success: true, message: "Character's hitpoints have been updated" });
    }
    catch (error) {
        if (error instanceof model.DatabaseError) {
            response.status(500).render('characters.hbs', { error: true, message: `Database error, Couldn't update Character with id: ${request.params.id}` });
            console.log("Database Error - From updateHitpoints in characterController")
        }
        else if (error instanceof model.InvalidInputError) {
            response.status(400).render('characters.hbs', { error: true, message: `Input error, Couldn't get Character with id: ${request.params.id}` });
            console.log('input error - from updateHitpoints in characterController');
        }
    }
}


/**
 * on a get request, the getCharacter method from the model is called
 * responds with correct error codes depending on type of error thrown in the model method
 * @param {HTTPRequest} request 
 * @param {HTTPResponse} response
 */
async function getCharacter(request, response) {
    try {
        let id = request.params.id;
        let found = await model.getCharacter(id);
        response.status(201).render('soloCharacter.hbs', { charactersActive: true, found: found});
    }
    catch (error) {
        if (error instanceof model.DatabaseError) {
            response.status(500).render('characters.hbs', { error: true, message: `Database error, Couldn't get Character with id: ${id}` });
            console.log("Database Error - From getCharacter in characterController")
        }
        else if (error instanceof model.InvalidInputError) {
            response.status(400).render('characters.hbs', { error: true, message: `Input error, Couldn't get Character with id: ${id}` });
            console.log('input error - from getCharacter in characterController');
        }
    }
}


/**
 * on a get request, the getAllCharacters method from the model is called
 * responds with correct error codes depending on type of error thrown in the model method
 * @param {HTTPRequest} request 
 * @param {HTTPResponse} response
 */
async function getAllCharacters(request, response) {
    try {
        let found = await model.printDb();
        response.status(201).render('characters.hbs', { charactersActive: true, character: found});
    }
    catch (error) {
        if (error instanceof model.DatabaseError) {
            response.status(500).render('characters.hbs', { error: true, message: "Database error, Couldn't get Characters" });
            console.log("Database Error - From getAllCharacters in characterController");
        }
        else if (error instanceof model.InvalidInputError) {
            response.status(400).render('characters.hbs', { error: true, message: "Input Error, Couldn't get all Characters" });
            console.log('input error - from getAllCharacters in characterController');
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
        if (error instanceof model.DatabaseError) {
            response.status(500).render('characters.hbs', { error: true, message: `Database error, Couldn't update Character with id: ${request.params.id}` });
            console.log("Database Error - From updateCharacter in characterController")
        }
        else if (error instanceof model.InvalidInputError) {
            response.status(400).render('characters.hbs', { error: true, message: `Input error, Couldn't update Character with id: ${request.params.id}` });
            console.log('input error - from updateCharacter in characterController');
        }
        else{
            response.status(400).render('characters.hbs', { error: true, message: `${error.message}` });
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
        response.status(201).render('characters.hbs', { charactersActive: true, success:true, message: "Character has been deleted", character: found });
    }
    catch (error) {
        if (error instanceof model.DatabaseError) {
            let found = await model.printDb();
            response.status(500).render('characters.hbs', { error: true, message: `Database error, Couldn't delete Character with id: ${request.params.id}`, character: found });
            console.log("Database Error - From deleteCharacter in characterController");
        }
        else if (error instanceof model.InvalidInputError) {
            let found = await model.printDb();
            response.status(400).render('characters.hbs', { error: true, message: `Input error, Couldn't delete Character with id: ${request.params.id}`, character: found });
            console.log('input error - from deleteCharacter in characterController');
        }
    }
}


async function formRoute(request, response){
    requestJson = request.body;
    switch(requestJson.choice){
        case("editCharacter"):
            let character = await model.printDb();
            response.status(201).render('characters.hbs', {  charactersActive: true, chosenId: requestJson.characterId, character: character});
            break;
        default:
            break;
    }
}
router.put('/:id', updateCharacter);
router.post('/', sendCharacter);
router.post('/forms', formRoute)
router.delete('/:id', deleteCharacter);
router.get('/:id', getCharacter);
router.get('/', getAllCharacters);
router.put('/:id/hp', updateHitpoints);

module.exports = {
    router,
    routeRoot
}
