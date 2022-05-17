const url = require('url');
const hbs = require('express-handlebars').create({});
const express = require('express');
const res = require('express/lib/response');
const router = express.Router();
const routeRoot = '/characters';
const model = require('../models/characterModel');
const logger = require('../logger');
const authenticator = require('./authenticationHelperController');
const userModel = require('../models/userModel');
const charStatsModel = require('../models/characterStatisticsModel');
const raceModel = require('../models/raceModel');

const errors = require('../models/errorModel');
const { getBackground, getAllBackgrounds } = require('../models/backgroundModel');



hbs.handlebars.registerHelper('equals', (arg1, arg2) => {
    return arg1 == arg2;
});

//https://stackoverflow.com/questions/8853396/logical-operator-in-a-handlebars-js-if-conditional
hbs.handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});

hbs.handlebars.registerHelper('ifIn', function (elem, list, options) {
    if (list.indexOf(elem) > -1) {
        return options.fn(this);
    }
    return options.inverse(this);
});

async function buildSheet(id, recentCharacters) {
    let bigObject = {};
    bigObject.character = await model.getCharacter(id);
    bigObject.skills = await charStatsModel.getAllSkills();
    bigObject.css = 'soloCharacter.css';
    bigObject.skillProficiencies = await charStatsModel.getSkillProficiencies(id);
    bigObject.skillExpertise = await charStatsModel.getSkillExpertise(id);
    if (!recentCharacters) {
        //create new one
        bigObject.recentCookie = await model.createRecentCharactersCookie(bigObject.character.Id);
    }
    else {
        // generate one from whats already there
        bigObject.recentCookie = await model.createRecentCharactersCookie(bigObject.character.Id, recentCharacters);
    }
    return bigObject;
}


/**
 * Sends a character to the model by taking in the request's JSON and using it
 * @param {HTTPRequest} request The http Request object
 * @param {HTTPResponse} response The http Response object
 */
async function sendCharacter(request, response) {
    requestJson = request.body;
    let charAddedId;
    try {
        let abilityScores = [];
        abilityScores.push(requestJson.characterStrength);
        abilityScores.push(requestJson.characterDexterity);
        abilityScores.push(requestJson.characterConstitution);
        abilityScores.push(requestJson.characterIntelligence);
        abilityScores.push(requestJson.characterWisdom);
        abilityScores.push(requestJson.characterCharisma);

        let userId = await userModel.getUserIdFromSessionId(request.cookies.sessionId);
        charAddedId = await model.addCharacter(requestJson.characterClass, requestJson.characterRace, requestJson.characterName, requestJson.characterMaxHp,
            requestJson.characterBackground, requestJson.characterEthics, requestJson.characterMorality, requestJson.characterLevel, abilityScores, [],
            requestJson.characterProficiencyBonus, userId, requestJson.characterArmorClass);
        if (charAddedId === null) {
            response.status(400);
            response.render('characters.hbs', "Character was null... somehow");

        }
        else {
            await model.updateSpeed(charAddedId, requestJson.characterSpeed);
            await model.updateInitiative(charAddedId, requestJson.characterInitiative);
            response.redirect(`/characters/${charAddedId}`);
        }
    } catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500);
            logger.error("database error from sendCharacter in Character Controller");
            response.render('home.hbs', { error: "Couldn't Add Character There was a Database Error" });
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400).render('home.hbs', { error: "Couldn't Add Character, Input was invalid", character: character });
            logger.error('input error - from sendCharacter in characterController');
        }
        else {
            logger.error(error.message);
            response.status(500).render('home.hbs', { error: `Something went wrong...` });
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
        let built = await buildSheet(request.params.id);

        response.status(201).render('sheet.hbs', { success: "Character's hitpoints have been updated", character: built.character, skills: built.skills, soloCharacter: built.css, skillProficiencies: built.skillProficiencies, skillExpertise: built.skillExpertise });
    }
    catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('characters.hbs', { error: `Database error, Couldn't update Character` });
            logger.error("Database Error - From updateHitpoints in characterController");
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400).render('characters.hbs', { error: `Input error, Couldn't get Character` });
            logger.error('input error - from updateHitpoints in characterController');
        }
        else {
            logger.error(error.message);
            response.status(500).render('home.hbs', { error: `Something went wrong...` });
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
        let built = await buildSheet(id, request.cookies.recentCharacters);
        let error;
        if (request.query.error) {
            response.status(201)
                .cookie(built.recentCookie.name, built.recentCookie.recentCharacters, { expires: built.recentCookie.expires, overwrite: true })
                .render('sheet.hbs', {
                    soloCharacter: built.css, character: built.character, skills: built.skills,
                    skillProficiencies: built.skillProficiencies, skillExpertise: built.skillExpertise,
                    recentCharacters: built.recentCookie.recentCharacters, error: request.query.error
                });
        }
        else if (request.query.success) {
            response.status(201)
                .cookie(built.recentCookie.name, built.recentCookie.recentCharacters, { expires: built.recentCookie.expires, overwrite: true })
                .render('sheet.hbs', {
                    soloCharacter: built.css, character: built.character, skills: built.skills,
                    skillProficiencies: built.skillProficiencies, skillExpertise: built.skillExpertise,
                    recentCharacters: built.recentCookie.recentCharacters, success: request.query.success
                });
        }
        else {
            response.status(201)
                .cookie(built.recentCookie.name, built.recentCookie.recentCharacters, { expires: built.recentCookie.expires, overwrite: true })
                .render('sheet.hbs', {
                    soloCharacter: built.css, character: built.character, skills: built.skills,
                    skillProficiencies: built.skillProficiencies, skillExpertise: built.skillExpertise,
                    recentCharacters: built.recentCookie.recentCharacters
                });
        }
    }
    catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('characters.hbs', { error: `Database error, Couldn't get Character` });
            logger.error("Database Error - From getCharacter in characterController");
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400).render('characters.hbs', { error: `Input error, Couldn't get Character` });
            logger.error('input error - from getCharacter in characterController');
        }
        else {
            response.status(400).render('characters.hbs', { error: `Catastrophic Failure` });
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
        response.status(201).render('characters.hbs', { characters: userCharacters, username: await userModel.getUsernameFromSessionId(sessionId) });
    }
    catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('characters.hbs', { error: "Database error, Couldn't get Characters" });
            logger.error("Database Error - From getAllCharacters in characterController");
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400).render('characters.hbs', { error: "Input Error, Couldn't get all Characters" });
            logger.error('input error - from getAllCharacters in characterController');
        }
        else if (error instanceof errors.InvalidSessionError) {
            response.clearCookie('sessionId');
            response.status(400).render('home.hbs', { homeActive: true });
            logger.error('tried to access /characters with an invalid session');
        }
        else {
            logger.error(error.message);
            response.status(500).render('home.hbs', { error: `Something went wrong...` });
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
    let json = request.body;

    try {
        let abilityScores = [];
        abilityScores.push(json.strength);
        abilityScores.push(json.dexterity);
        abilityScores.push(json.constitution);
        abilityScores.push(json.intelligence);
        abilityScores.push(json.wisdom);
        abilityScores.push(json.charisma);
        let userId = await userModel.getUserIdFromSessionId(request.cookies.sessionId);
        let characterId = await model.updateCharacter(request.params.id, json.charClass, json.race, json.ethics, json.morality, json.background, json.charName, json.maxHp,
            json.level, abilityScores, json.savingThrows, json.proficiencyBonus, userId, json.armorClass);

        //add speed and initiative
        await model.updateInitiative(characterId, json.initiative);
        await model.updateSpeed(characterId, json.speed);

        response.redirect(`/characters/${characterId}`);
    }
    catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('characters.hbs', { error: `Database error, Couldn't update Character with id: ${request.params.id}` });
            logger.error("Database Error - From updateCharacter in characterController");
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400).render('characters.hbs', { error: `Input error, Couldn't update Character with id: ${request.params.id}` });
            logger.error('input error - from updateCharacter in characterController');
        }
        else {
            logger.error(error.message);
            response.status(500).render('home.hbs', { error: `Something went wrong...` });
        }
    }
}



/**
 * on a delete request, the delete method from the model is called
 * responds with correct error codes depending on type of error thrown in the model method
 * @param {HTTPRequest} request 
 * @param {HTTPResponse} response 
 */
async function deleteCharacter(request, response, sessionId) {
    try {
        let userId = await userModel.getUserIdFromSessionId(sessionId);
        await model.removeCharacter(request.params.id);
        let userCharacters = await model.getUserCharacters(userId);
        response.status(201).render('characters.hbs', { success: "Character has been deleted", username: await userModel.getUsernameFromSessionId(sessionId), characters: userCharacters });
    }
    catch (error) {
        if (error instanceof errors.DatabaseError) {
            let found = await model.printDb();
            response.status(500).render('characters.hbs', { error: `Database error, Couldn't delete Character with id: ${request.params.id}`, character: found });
            logger.error("Database Error - From deleteCharacter in characterController");
        }
        else if (error instanceof errors.InvalidInputError) {
            let found = await model.printDb();
            response.status(400).render('characters.hbs', { error: `Input error, Couldn't delete Character with id: ${request.params.id}`, character: found });
            logger.error('input error - from deleteCharacter in characterController');
        }
        else {
            logger.error(error.message);
            response.status(500).render('home.hbs', { error: `Something went wrong...` });
        }
    }
}


/**
 * calls the level up function in the model
 * Catches all errors and logs them and renders the pages based on the error
 * @param {HTTP} request 
 * @param {HTTP} response 
 */
async function updateLevel(request, response) {
    try {
        await model.levelUp(request.params.id);
        response.redirect(url.format({
            pathname: `/characters/${request.params.id}`,
            query: {
                "success": "You Leveled Up!"
            }
        }));
    }
    catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('home.hbs', { error: `Database error, Couldn't level up Character with id: ${request.params.id}` });
            logger.error("Database Error - From updateLevel in characterController");
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400).redirect(url.format({
                pathname: "/",
                query: {
                    "id": request.params.Id,
                    "error": "Input error, Couldn't Level Up"
                }
            }));
            logger.error('input error - from updateLevel in characterController');
        }
        else {
            logger.error(error.message);
            response.status(500).render('home.hbs', { error: `Something went wrong...` });
        }
    }
}

async function addItem(request, response) {
    requestJson = request.body;
    try {
        await model.addItem(parseInt(request.params.id), requestJson.itemName, requestJson.itemQuantity);
        response.redirect(`/characters/${request.params.id}`);
    }
    catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('home.hbs', { error: `Database error, Couldn't level up Character with id: ${request.params.id}` });
            logger.error("Database Error - From addItem in characterController");
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400);
            response.redirect(url.format({
                pathname: "/characters",
                query: {
                    "id": request.params.Id,
                    "error": "Input error, Couldn't Add Item!"
                }
            }));
            logger.error('input error - from addItem in characterController');
        }
        else {
            logger.error(error.message);
            response.status(500).render('home.hbs', { error: `Something went wrong...` });
        }
    }
}

/**
 * Sends the user to the update page with all required Data
 * Catches all errors and logs them and writes error messages on banners on the page
 * @param {HTTP} request - Request to this page
 * @param {HTTP} response - Response that wil be sent back
 */
async function sendToUpdateController(request, response) {
    try {
        let classModel = require('../models/classModel');
        let races = await raceModel.getAllRaces();
        let classes = await classModel.getAllClasses();
        let built = await buildSheet(request.params.id);
        response.status(200).render('characterUpdate.hbs', { character: built.character });
        logger.info(`Navigated to Update Page with character ${request.params.id}`);
    } catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('home.hbs', { error: `Database error, Couldn't level up Character with id: ${request.params.id}` });
            logger.error(`Database Error - From sendToUpdateController in characterController: ${error.message}`);
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400).redirect(url.format({
                pathname: "/characters",
                query: {
                    "id": request.params.Id,
                    "error": "Input error, Couldn't send to Update Page!"
                }
            }));
            logger.error(`input error - from sendToUpdateController in characterController: ${error.message}`);
        }
        else {
            logger.error(error.message + 'From sendToCreatePage.');
            response.status(500).render('home.hbs', { error: `Something went wrong...` });
        }
    }
}

/**
 * Sends the user to the create page with all required Data
 * Catches all errors and logs them and writes error messages on banners on the page
 * @param {HTTP} request - Request to this page
 * @param {HTTP} response - Response that wil be sent back
 */
async function sendToCreatePage(request, response) {
    try {
        let userId = await userModel.getUserIdFromSessionId(request.cookies.sessionId);
        response.status(200).render('newCharacter.hbs', { UserId: userId, createCharacterStyle: '/createStyling.css', backgrounds: await getAllBackgrounds(), races: await raceModel.getAllRaces() });
        logger.info(`Navigated to Create Page with user ${userId}`);
    } catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('home.hbs', { error: `Database error` });
            logger.error(`Database Error - From sendToCreatePage in characterController: ${error.message}`);
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400).render('home.hbs', { error: `Input error, Couldn't Navigate to Create Page!` });
            logger.error(`input error - from sendToCreatePage in characterController: ${error.message}`);
        }
        else {
            logger.error(error.message + 'From sendToCreatePage.');
            response.status(500).render('home.hbs', { error: `Something went wrong...` });
        }
    }
}

async function addProficiencyController(request, response) {
    const json = request.body;
    try {
        await charStatsModel.addSkillProficiency(json.characterId, json.skillId);
        logger.info(`Successfully added skill proficiency with id: ${json.skillId} to character: ${json.characterId}`);
        let built = await buildSheet(json.characterId);

        response.status(200).render('sheet.hbs', {
            success: `Successfully added Skill Proficiency`, character: built.character, skills: built.skills, soloCharacter: built.css, skillProficiencies: built.skillProficiencies, skillExpertise: built.skillExpertise,
            recentCharacters: built.recentCookie.recentCharacters
        });
    } catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('home.hbs', { error: `Database error couldn't add proficiency` });
            logger.error(`Database Error - From addProficiencyController in characterController: ${error.message}`);
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400).render('home.hbs', { error: `Input error, Couldn't Add proficiency!` });
            logger.error(`input error - from addProficiencyController in characterController: ${error.message}`);
        }
        else {
            logger.error(error.message + 'From addProficiencyController.');
            response.status(500).render('home.hbs', { error: `Something went wrong...` });
        }
    }
}

async function addExpertiseController(request, response) {
    const json = request.body;
    try {
        await charStatsModel.addSkillExpertise(json.characterId, json.skillId);
        logger.info(`Successfully added skill Expertise with id: ${json.skillId} to character: ${json.characterId}`);
        let built = await buildSheet(json.characterId);

        response.status(200).render('sheet.hbs', {
            success: `Successfully added Skill Expertise`, character: built.character, skills: built.skills, soloCharacter: built.css, skillProficiencies: built.skillProficiencies, skillExpertise: built.skillExpertise,
            recentCharacters: built.recentCookie.recentCharacters
        });
    } catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('home.hbs', { error: `Database error couldn't add Expertise` });
            logger.error(`Database Error - From addSkillExpertise in characterController: ${error.message}`);
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400).render('home.hbs', { error: `Input error, Couldn't Add Expertise!` });
            logger.error(`input error - from addSkillExpertise in characterController: ${error.message}`);
        }
        else {
            logger.error(error.message + 'From addSkillExpertise.');
            response.status(500).render('home.hbs', { error: `Something went wrong...` });
        }
    }
}

async function removeAllExpertiseAndProficiencies(request, response) {
    const json = request.body;
    try {
        await charStatsModel.removeSkillExpertise(json.characterId, json.skillId);
        logger.info(`Successfully removed skill Expertise with id: ${json.skillId} to character: ${json.characterId}`);
        let built = await buildSheet(json.characterId);

        response.status(200).render('sheet.hbs', {
            success: `Successfully removed Skill Expertise`, character: built.character, skills: built.skills, soloCharacter: built.css, skillProficiencies: built.skillProficiencies, skillExpertise: built.skillExpertise,
            recentCharacters: built.recentCookie.recentCharacters
        });
    } catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('home.hbs', { error: `Database error couldn't add Expertise` });
            logger.error(`Database Error - From removeAllExpertiseAndProficiencies in characterController: ${error.message}`);
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400).render('home.hbs', { error: `Input error, Couldn't Add Expertise!` });
            logger.error(`input error - from removeAllExpertiseAndProficiencies in characterController: ${error.message}`);
        }
        else {
            logger.error(error.message + 'From removeAllExpertiseAndProficiencies.');
            response.status(500).render('home.hbs', { error: `Something went wrong...` });
        }
    }
}

async function addExperiencePoints(request, response) {
    let json = request.body;
    try {
        await model.updateExp(request.params.id, json.experiencePoints);
        logger.info(`Successfully updated exp or id: ${request.params.id} to: ${json.experiencePoints}`);
        let built = await buildSheet(request.params.id);

        response.status(200).render('sheet.hbs', {
            success: `Successfully updated Experience Points`, character: built.character, skills: built.skills, soloCharacter: built.css, skillProficiencies: built.skillProficiencies, skillExpertise: built.skillExpertise,
            recentCharacters: built.recentCookie.recentCharacters
        });
    } catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('home.hbs', { error: `Database error couldn't update Exp!` });
            logger.error(`Database Error - From addExperiencePoints in characterController: ${error.message}`);
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400).render('home.hbs', { error: `Input error, Couldn't Update Exp!` });
            logger.error(`input error - from addExperiencePoints in characterController: ${error.message}`);
        }
        else {
            logger.error(error.message + 'From addExperiencePoints.');
            response.status(500).render('home.hbs', { error: `Something went wrong... Try again` });
        }
    }
}




router.put('/:id', updateCharacter);
router.post('/', sendCharacter);
router.delete('/:id(\\d+)', (request, response) => authenticator.gateAccess(request, response, deleteCharacter));
//(\d+) is regex and makes it so id can be 1 or more numeric digits, this frees up other string endpoints as well as prevents database query errors
//where the database was trying to get a string Id from an integer column
router.get('/:id(\\d+)', (request, response) => authenticator.gateAccess(request, response, getCharacter));
router.get('/', (request, response) => authenticator.gateAccess(request, response, getAllUserCharacters));
router.put('/:id(\\d+)/hp', updateHitpoints);
router.put('/:id/levels', updateLevel);
router.put("/:id/items", addItem);
router.get("/forms/:id(\\d+)", sendToUpdateController);
router.get("/new", sendToCreatePage);
router.put('/:id(\\d+)/proficiencies', addProficiencyController);
router.put('/:id(\\d+)/expertise', addExpertiseController);
router.delete('/:id(\\d+)/proficiencies', removeAllExpertiseAndProficiencies);
router.put('/:id(\\d+)/experiencepoints', addExperiencePoints);


module.exports = {
    router,
    routeRoot
};