const express = require('express');
const hbs = require('express-handlebars').create({});
const spellModel = require('../models/spellModel');
const authenticator = require('./authenticationHelperController');
const router = express.Router();
const routeRoot = '/spells';
const logger = require('../logger');
const { DatabaseError, InvalidInputError, InvalidSessionError } = require('../models/errorModel');
const userModel = require('../models/userModel');
const classModel = require('../models/classModel');
const { getAllSchools } = require('../models/spellModel');
const url = require('url');
const characterModel = require('../models/characterModel');

/**
 * Gets a render object containing default values for the spell page and any fields passed in the additionalFields object
 * @param {Object} additionalFields an object containing additional fields specific to the method calling it.
 */
async function getRenderObject(additionalFields, userId)
{
    const renderObject = {};
    renderObject.spellsActive = true;
    renderObject.pageLevelCss = 'css/spells.css';

    if (!userId) userId = 0;

    // Only get spells and stuff if there was no 500 error
    // First statement accounts for when no object was passed
    if (!additionalFields || additionalFields.status != 500)
    {
        try
        {
            // Still check in case 400 was thrown before 500
            renderObject.spells = await spellModel.getAllSpells(userId);
            renderObject.schools = await spellModel.getAllSchools();
            renderObject.Classes = await classModel.getAllClasses();
        }
        catch (error)
        {
            throw new DatabaseError('spellController', 'getRenderObject', `Failed to get spells or schools: ${ error }`);
        }
    }

    for (var field in additionalFields)
    {
        renderObject[field] = additionalFields[field];
    }

    // Make sure spells exist
    if (renderObject.spells)
        renderObject.spells = capitalizeSpells(renderObject.spells);

    return renderObject;
}

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

/**
 * Adds a spell from the body of an http request to the database.
 * On a successful add, the spell is sent in the http response.
 * On a failure, a 400 status will be sent for bad input 
 * and a 500 status will be sent for a bad database connection.
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 */
async function addSpell(request, response, sessionId)
{
    const spellToAdd = request.body;

    spellToAdd.Material = spellToAdd.Material == 'on' ? true : false;
    spellToAdd.Somatic = spellToAdd.Somatic == 'on' ? true : false;
    spellToAdd.Verbal = spellToAdd.Verbal == 'on' ? true : false;
    spellToAdd.Ritual = spellToAdd.Ritual == 'on' ? true : false;
    spellToAdd.Concentration = spellToAdd.Concentration == 'on' ? true : false;
    spellToAdd.Damage = spellToAdd.damageDice ? spellToAdd.Damage : null;

    spellToAdd.Classes = spellToAdd.ClassIds.split(',');
    if (spellToAdd.Classes.length == 1 && spellToAdd.Classes[0] == '')
        spellToAdd.Classes = [];

    try
    {
        spellToAdd.UserId = await userModel.getUserIdFromSessionId(sessionId);
        username = await userModel.getUsernameFromSessionId(sessionId);
    } catch (error)
    {
        response.status(500);
        response.redirect(getUrlFormat('/home', { error: 'Sorry, something went wrong while validating your login status.', status: 500 }));
    }

    spellModel.addSpell(spellToAdd)
        .then(async spellAddedSuccessfully =>
        {
            response.status(201);
            // Add a warning if the spell wasn't added properly
            let urlFormat;
            if (!spellAddedSuccessfully)
            {
                urlFormat = getUrlFormat('/spells', { status: 201, warning: "The spell was not added since a spell with the same details already exists. If you would like to edit the spell's description, find it in the table to edit instead." });
                logger.warn(`The spell (${ spellToAdd.name }) was not added successfully, since it already exists.`);
            }
            else
            {
                urlFormat = getUrlFormat('/spells', { status: 201, confirmation: 'Successfully added spell!' });
            }
            // Redirect to avoid refresh re-adding
            response.redirect(urlFormat);
        })
        .catch(async error =>
        {
            if (error instanceof InvalidInputError)
            {
                logger.error(`Failed to add new spell: ${ error.message }`);
                response.status(400);
                if (spellToAdd.Damage)
                {
                    const damageStuff = spellToAdd.Damage.split('d');
                    spellToAdd.damageDiceQuantity = damageStuff[0];
                    spellToAdd.damageDie = 'd' + damageStuff[1];
                }
                response.redirect(getUrlFormat('/spells/spellAddition', { error: `That spell couldn't be added due to invalid input: ${ error.message }`, status: 400, failedSpell: JSON.stringify(spellToAdd) }));
            }
            else if (error instanceof DatabaseError)
            {
                response.status(500);
                response.redirect(getUrlFormat('/home', { error: `Sorry, a database error occured while trying to add the spell. Please wait a moment and try again.`, status: 500 }));
                logger.error(error);
            }
            else
            {
                response.status(500);
                response.redirect(getUrlFormat('/home', { error: `Sorry, something went wrong.`, status: 500 }));
                logger.error(error);
            }
        });
}
router.post('/', (request, response) => authenticator.gateAccess(request, response, addSpell));

/**
 * Removes a spell which matching the id provided in the uri.
 * On a successful delete, the spells page is rerendered with the new spells listed.
 * On a failure, a 400 status will be sent for a bad id 
 * and a 500 status will be sent for a bad database connection.
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 */
async function removeSpellById(request, response, sessionId)
{
    id = request.params.id;

    let userId;
    try
    {
        userId = await userModel.getUserIdFromSessionId(sessionId);
    }
    catch (error)
    {
        if (error instanceof InvalidSessionError)
        {
            logger.error(error);
            response.status(401);
            response.redirect(getUrlFormat('/spells', { error: 'You are not authorized to delete a spell. Please log in and try again.', status: 401 }));
        }
        else if (error instanceof DatabaseError)
        {
            logger.error(error);
            response.status(500);
            response.redirect(getUrlFormat('/home', { error: 'Sorry, there was an issue authorizing your login status. Please wait a moment and try again.', status: 500 }));
        }
        else
        {
            logger.error(error);
            response.status(500);
            response.redirect(getUrlFormat('/home', { error: 'Something went wrong.', status: 500 }));
        }

    }

    spellModel.removeSpellById(id, userId)
        .then(async spellDeleted =>
        {
            response.status(200);
            response.redirect(getUrlFormat('/spells', { confirmation: 'Successfully deleted spell.' }));
        })
        .catch(async error =>
        {
            if (error instanceof InvalidInputError)
            {
                logger.error(`Failed to delete spell: ${ error.message }`);
                response.status(400);
                response.redirect(getUrlFormat('/home', { error: `Failed to delete spell due to invalid input: ${ error.message }`, status: 400 }));
            }
            else if (error instanceof DatabaseError)
            {
                response.status(500);
                response.redirect(getUrlFormat('/home', { error: `A database error was encountered while trying to delete the spell. Please wait a moment and try again.`, status: 500 }));
                logger.error(error);
            }
            else
            {
                logger.error(error);
                response.status(500);
                response.redirect(getUrlFormat('/home', { error: 'Something went wrong.', status: 500 }));
            }
        });
}
router.delete('/id/:id', (request, response) => authenticator.gateAccess(request, response, removeSpellById));


/**
 * Gets all spells.
 * On a successful get, all the spells for a user are sent in the http response.
 * On a failure, a 500 status will be sent for a bad database connection. 
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 */
async function showAllSpellsLoggedIn(request, response, username, userId)
{

    try
    {
        const currentRenderObj = { Classes: await classModel.getAllClasses(), username: username };

        // Add redirect query notifications
        const query = request.query;
        if (query.error)
            currentRenderObj.error = query.error;
        if (query.warning)
            currentRenderObj.warning = query.warning;
        if (query.confirmation)
            currentRenderObj.confirmation = query.confirmation;

        response.render('spells.hbs', await getRenderObject(currentRenderObj, userId));
    } catch (error)
    {
        if (error instanceof InvalidInputError)
        {
            logger.error(`Failed to delete spell: ${ error.message }`);
            response.status(400);
            response.redirect(getUrlFormat('/home', { error: `Failed to delete spell due to invalid input: ${ error.message }`, status: 400 }));
        }
        else if (error instanceof DatabaseError)
        {
            response.status(500);
            response.redirect(getUrlFormat('/home', { error: `A database error was encountered while trying to delete the spell. Please wait a moment and try again.`, status: 500 }));
            logger.error(error);
        }
        else
        {
            logger.error(error);
            response.status(500);
            response.redirect(getUrlFormat('/home', { error: 'Something went wrong.', status: 500 }));
        }
    }
}
/**
 * Gets all spells.
 * On a successful get, all the spells from the player's handbook are sent in the http response.
 * On a failure, a 500 status will be sent for a bad database connection. 
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 */
async function showAllSpellsLoggedOut(request, response)
{

    try
    {
        const currentRenderObj = { Classes: await classModel.getAllClasses() };

        // Add redirect query notifications
        const query = request.query;
        if (query.error)
            currentRenderObj.error = query.error;
        if (query.warning)
            currentRenderObj.warning = query.warning;
        if (query.confirmation)
            currentRenderObj.confirmation = query.confirmation;


        response.render('spells.hbs', await getRenderObject(currentRenderObj));
    } catch (error)
    {
        if (error instanceof DatabaseError)
        {
            response.status(500);
            response.render('home.hbs', await getRenderObject({ error: `Sorry, a database error was encountered while trying to get the spells. Please wait a moment and try again.`, status: 500 }));
            logger.error(error);
        }
        else
        {
            response.status(500);
            response.render('home.hbs', { error: 'Sorry, something went wrong.', status: 500 });
            logger.error(error);
        }
    }
}
router.get('/', (request, response) => authenticator.loadDifferentPagePerLoginStatus(request, response, showAllSpellsLoggedIn, showAllSpellsLoggedOut));


/**
 * Gets all spells which match the filter provided in the request body.
 * On a successful get, all the spells matching the filter requirements
 *  are sent in the http response.
 * On a failure, a 400 status is sent for a bad filter, and a 
 * 500 status will be sent for a bad database connection. 
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 */
async function showFilteredSpells(request, response, username, userId)
{
    filter = request.query;

    const characterId = filter.characterId;
    userId = userId ? userId : 0;
    filter.Level = filter.Level ? filter.Level : null;
    filter.SchoolId = filter.SchoolId ? filter.SchoolId : null;
    filter.Name = filter.Name ? filter.Name : null;
    filter.CastingTime = filter.CastingTime ? filter.CastingTime : null;
    filter.Verbal = filter.includeVerbal == 'on' ? filter.Verbal == 'on' : null;
    filter.Somatic = filter.includeSomatic == 'on' ? filter.Somatic == 'on' : null;
    filter.Material = filter.includeMaterial == 'on' ? filter.Material == 'on' : null;
    filter.Duration = filter.Duration ? filter.Duration : null;
    filter.EffectRange = filter.EffectRange ? filter.EffectRange : null;
    filter.Concentration = filter.includeConcentration == 'on' ? filter.Concentration == 'on' : null;
    filter.Ritual = filter.includeRitual == 'on' ? filter.Ritual == 'on' : null;
    filter.Classes = filter.ClassIds ? filter.ClassIds.split(',') : null;
    filter.HomebrewOnly = filter.includeHomebrew ? filter.Homebrew == 'on' : null;

    spellModel.getSpellsWithSpecifications(filter.Level, filter.SchoolId, userId, filter.Name, filter.CastingTime, filter.Verbal, filter.Somatic, filter.Material, filter.Duration, filter.EffectRange, filter.Concentration, filter.Ritual, filter.Classes, filter.HomebrewOnly)
        .then(async filteredSpells =>
        {
            if (filter.characterId)
            {
                const character = await characterModel.getCharacter(characterId, userId);
                if ((await characterModel.getUserCharacters(userId)).map(character => character.Id).includes(Number(character.Id)))
                    response.render('addSpellToCharacter.hbs', await getRenderObject({ characterId: characterId, character: character, spells: filteredSpells, filter: filter, username: username }, userId));
                else
                {
                    response.status(400);
                    response.redirect(getUrlFormat('/home', { error: 'You are not authorized to add spells to that character.', status: 400 }));
                }
            }
            else
                response.render('spells.hbs', await getRenderObject({ spells: filteredSpells, filter: filter, Classes: await classModel.getAllClasses(), username: username }, userId));
        })
        .catch(async error =>
        {
            if (error instanceof InvalidInputError)
            {
                logger.error(`Failed to get filtered list of spells: ${ error.message }`);
                response.status(400);
                response.render('home.hbs', { error: `Failed to get the filtered list of spells since the provided filter contained invalid data: ${ error.message }`, status: 400, username: username });
            }
            else if (error instanceof DatabaseError)
            {
                response.status(500);
                response.render('home.hbs', { error: `Sorry, a database error was encountered while trying to get the filtered list of spells. Please wait a moment and try again.`, status: 500, username: username });
                logger.error(error);
            }
            else
            {
                response.status(500);
                response.render('home.hbs', { error: `Sorry, something went wrong.`, status: 500, username: username });
                logger.error(error);
            }
        });
}
router.get('/filter', (request, response) => authenticator.loadDifferentPagePerLoginStatus(request, response, showFilteredSpells, showFilteredSpells));


/**
 * Gets the spell with the id provided in the uri.
 * On a successful get, the spell is sent in the http response.
 * On a failure, a 400 status is sent for a bad id, and a 
 * 500 status will be sent for a bad database connection. 
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 */
async function showSpellWithId(request, response, username, userId)
{
    const id = request.params.id;

    userId = userId ? userId : 0;

    spellModel.getSpellById(id, userId)
        .then(async spell =>
        {
            response.render('focusSpell.hbs', { username: username, spell: capitalizeSpells([spell])[0], spellsActive: true });
        })
        .catch(async error =>
        {
            if (error instanceof DatabaseError)
            {
                response.status(500);
                response.redirect(getUrlFormat('/home', { error: `Sorry, we couldn't get the spell you wanted to focus on due to a server issue. Please try again in a moment.`, status: 500 }));
                logger.error(error);
            }
            else if (error instanceof InvalidInputError)
            {
                logger.error(`Failed to get spell: ${ error.message }`);
                response.status(400);
                response.redirect(getUrlFormat('/home', { error: `Sorry, we couldn't get the spell you wanted to focus on. Please try again in a moment.`, status: 400 }));
            }
            else
            {
                logger.error(error);
                response.status(500);
                response.redirect(getUrlFormat('/home', { error: 'Something went wrong', status: 500 }));
            }
        });
}
router.get('/id/:id', (request, response) => authenticator.loadDifferentPagePerLoginStatus(request, response, showSpellWithId, showSpellWithId));


/**
 * Edits the spell with the id provided in the uri to contain the
 * properties indicated in the request body. 
 * On a successful edit, a boolean value indicating whether a spell was 
 * updated with the provided id is sent in the response.
 * On a failure, a 400 status is sent for an invalid id, and a 500 status
 * is sent for database issues.
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 */
async function editSpellWithId(request, response, sessionId)
{

    let userId;
    try
    {
        userId = await userModel.getUserIdFromSessionId(sessionId);
    }
    catch (error)
    {
        if (error instanceof InvalidSessionError)
        {
            logger.error(error);
            response.status(401);
            response.redirect(getUrlFormat('/spells', { error: 'You are not authorized to delete a spell. Please log in and try again.', status: 401 }));
        }
        else if (error instanceof DatabaseError)
        {
            logger.error(error);
            response.status(500);
            response.redirect(getUrlFormat('/home', { error: 'Sorry, there was an issue authorizing your login status. Please wait a moment and try again.', status: 500 }));
        }
        else
        {
            logger.error(error);
            response.status(500);
            response.redirect(getUrlFormat('/home', { error: 'Something went wrong.', status: 500 }));
        }

    }

    const query = request.query;
    const id = query.spellId;
    const level = query.Level;
    const name = query.Name;
    const description = query.Description;
    const schoolId = query.SchoolId;
    const castingTime = query.Casting;
    spellModel.updateSpellById(id, UserId, level, schoolId, description, name,)
        .then(async successfulUpdate => { response.render('spells.hbs', await getRenderObject({ confirmation: 'Successfully edited spell' })); })
        .catch(async error =>
        {
            if (error instanceof InvalidInputError)
            {
                logger.error(`Failed to get update spell with id ${ id }: ${ error.message }`);
                response.status(400);
                response.redirect(getUrlFormat(`/spells/editform/${ id }`, { error: `The spell was not edited due to invalid input: ${ error.message }`, status: 400 }));
            }
            if (error instanceof DatabaseError)
            {
                response.status(500);
                response.redirect(getUrlFormat('/home', { error: `Sorry, we couldn't get the spell you wanted to edit due to a server side issue. Please try again in a moment.`, status: 500 }));
                logger.error(error);
            }
        });

}
router.put('/', (request, response) => authenticator.gateAccess(request, response, editSpellWithId));

/**
 * Shows the spell edit page.
 * @param {Object} request The http request.
 * @param {Object} response The http response.
 * @param {String} sessionId The new session id of the user.
 */
async function showEditSpellPage(request, response, sessionId)
{

    let spellChoiceId = request.params.id;

    // Add redirect query notifications
    const query = request.query;
    let queryError;
    if (query.error)
        queryError = query.error;

    try
    {
        const spellToEdit = await spellModel.getSpellById(spellChoiceId, await userModel.getUserIdFromSessionId(sessionId));
        if (spellToEdit.Damage)
        {
            const damageStuff = spellToEdit.Damage.split('d');
            spellToEdit.damageDiceQuantity = damageStuff[0];
            spellToEdit.damageDie = 'd' + damageStuff[1];
        }
        spellToEdit.Classes = spellToEdit.Classes.map(Class => Class.Id);
        let options = { error: queryError, schools: await spellModel.getAllSchools(), Classes: await classModel.getAllClasses(), username: await userModel.getUsernameFromSessionId(sessionId), spellsActive: true, spellToEdit: spellToEdit };
        response.status(200);
        response.render('spellEdit.hbs', options);
    } catch (error)
    {
        if (error instanceof InvalidSessionError)
        {
            logger.error(error);
            response.status(401);
            response.redirect(getUrlFormat('/spells', { error: 'You are not authorized to edit a spell. Please log in and try again.', status: 401 }));
        }
        else if (error instanceof DatabaseError)
        {
            logger.error(error);
            response.status(500);
            response.redirect(getUrlFormat('/home', { error: 'Sorry, there was an issue authorizing your login status. Please wait a moment and try again.', status: 500 }));
        }
        else if (error instanceof InvalidInputError)
        {
            logger.error(error);
            response.status(400);
            response.redirect(getUrlFormat('/spells', { error: 'The spell you attempted to edit was not found.', status: 400 }));
        }
        else
        {
            logger.error(error);
            response.status(500);
            response.redirect(getUrlFormat('/home', { error: 'Something went wrong.', status: 500 }));
        }
    }


}
router.get('/editform/:id', (request, response) => authenticator.gateAccess(request, response, showEditSpellPage));

/**
 * Displays the page used by users to add spells.
 * @param {Object} request An http request object
 * @param {Object} response An http response object
 * @param {String} sessionId The session id of the user trying to add a spell.
 */
async function getAddSpellForm(request, response, sessionId)
{

    let currentRenderObj;
    try
    {
        currentRenderObj = { username: await userModel.getUsernameFromSessionId(sessionId), schools: await getAllSchools(), Classes: await classModel.getAllClasses(), spellsActive: true };
    }
    catch (error)
    {
        if (error instanceof InvalidSessionError)
        {
            logger.error(error);
            response.status(401);
            response.redirect(getUrlFormat('/spells', { error: 'You are not authorized to delete a spell. Please log in and try again.', status: 401 }));
        }
        else if (error instanceof DatabaseError)
        {
            logger.error(error);
            response.status(500);
            response.redirect(getUrlFormat('/home', { error: 'Sorry, there was an issue authorizing your login status. Please wait a moment and try again.', status: 500 }));
        }
        else
        {
            logger.error(error);
            response.status(500);
            response.redirect(getUrlFormat('/home', { error: 'Something went wrong.', status: 500 }));
        }
    }

    // Add redirect query notifications
    const query = request.query;
    if (query.error)
        currentRenderObj.error = query.error;
    if (query.warning)
        currentRenderObj.warning = query.warning;
    if (query.confirmation)
        currentRenderObj.confirmation = query.confirmation;
    if (query.failedSpell)
        currentRenderObj.failedSpell = JSON.parse(query.failedSpell);

    response.render('spellCreation.hbs', currentRenderObj);

}
router.get('/spelladdition', (request, response) => authenticator.gateAccess(request, response, getAddSpellForm));

hbs.handlebars.registerHelper('equals', (arg1, arg2) =>
{
    if (!arg1 && !arg2)
        return true;
    return arg1 == arg2;
});
hbs.handlebars.registerHelper('numEquals', (arg1, arg2) =>
{
    if ((arg1 == null || arg2 == null) && arg1 != arg2)
        return false;
    return arg1 == arg2;
});
hbs.handlebars.registerHelper('in', (item, container) =>
{
    return container ? container.includes(item) : false;
});
hbs.handlebars.registerHelper('stringIn', (item, container) =>
{
    return container ? container.includes(String(item)) || container.includes(item) : false;
});
hbs.handlebars.registerHelper('trim', (text, length = 200) =>
{
    if (text.fn(this).length < length)
        return text.fn(this);
    return text.fn(this).substring(0, length) + '...';
});
hbs.handlebars.registerHelper('isNoneOf', (arg1, arg2) =>
{
    if (!arg1)
        arg1 = null;
    return !JSON.parse(arg2).includes(arg1);
});
hbs.handlebars.registerHelper('isEmpty', (array) =>
{

    return array.length == 0;
});


/**
 * Capitalizes the first letter of every word in each spell name, and the school of the spell.
 * @param {Object} spells The list of spells to capitalize.
 * @returns {Array} the list of spells after being capitalized.
 */
function capitalizeSpells(spells)
{
    for (let spell of spells)
    {
        // Return the spells if the spell is null
        let words;
        try
        {
            words = spell.Name.split(' ');
        } catch (error)
        {
            return spells;
        }

        if (words.length != 0)
        {

            // Capitalize this
            let newName = '';
            words.forEach(word =>
            {
                if (word.length == 1)
                    newName += word.toUpperCase();
                else
                    newName += `${ word[0].toUpperCase() }${ word.substring(1, word.length) } `;
            });

            if (newName.length > 1)
                spell.Name = newName.substring(0, newName.length - 1);
            else
                spell.Name = newName;
            spell.school = `${ spell.school[0].toUpperCase() }${ spell.school.substring(1, spell.school.length) }`;

        }

    }

    return spells;

}

module.exports = {
    router,
    routeRoot
};