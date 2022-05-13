const express = require('express');
const hbs = require('express-handlebars').create({});
const spellModel = require('../models/spellModel');
const router = express.Router();
const routeRoot = '/spells';
const logger = require('../logger');
const {DatabaseError, InvalidInputError} = require('../models/errorModel')

/**
 * Gets a render object containing default values for the spell page and any fields passed in the additionalFields object
 * @param {Object} additionalFields an object containing additional fields specific to the method calling it.
 */
async function getRenderObject(additionalFields) {
    const renderObject = {};
    renderObject.spellsActive = true;
    renderObject.pageLevelCss = 'css/spells.css'

    // Only get spells and stuff if there was no 500 error
    // First statement accounts for when no object was passed
    if (!additionalFields || additionalFields.status != 500) {
        try {
            // Still check in case 400 was thrown before 500
            renderObject.spells = await spellModel.getAllSpells();
            renderObject.schools = await spellModel.getAllSchools();
        }
        catch (error) {
            throw new DatabaseError("Failed to get spells or spell schools.");
        }
    }

    for (var field in additionalFields) {
        renderObject[field] = additionalFields[field];
    }

    // Make sure spells exist
    if (renderObject.spells)
        renderObject.spells = capitalizeSpells(renderObject.spells);

    return renderObject;
}

/**
 * Adds a spell from the body of an http request to the database.
 * On a successful add, the spell is sent in the http response.
 * On a failure, a 400 status will be sent for bad input 
 * and a 500 status will be sent for a bad database connection.
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 */
async function addSpell(request, response) {
    const spellToAdd = request.body;

    try {
        if (spellToAdd.level != null)
            spellToAdd.level = Number(spellToAdd.level);

        if (spellToAdd.schoolId != null)
            spellToAdd.schoolId = Number(spellToAdd.schoolId);
    }
    catch (error) {
        logger.error(`Failed to add new spell: ${error.message}`);
        response.status(400);
        response.render('spells.hbs', await getRenderObject({ error: `That spell couldn't be added due to invalid input: ${error.message}`, status: 400 }))
    }

    spellModel.addSpell(spellToAdd)
        .then(async spellAddedSuccessfully => {
            response.status(201);
            const options = await getRenderObject();
            // Add a warning if the spell wasn't added properly
            if (!spellAddedSuccessfully) {
                options.warning = "The spell was not added since a spell with the same details already exists. If you would like to edit the spell's description, find it in the table to edit instead."
                logger.warn(`The spell (${spellToAdd.name}) was not added successfully, since it already exists.`);
            }
            response.render('spells.hbs', options);
        })
        .catch(async error => {
            if (error instanceof spellModel.InvalidInputError) {
                logger.error(`Failed to add new spell: ${error.message}`);
                response.status(400);
                response.render('spells.hbs', await getRenderObject({ error: `That spell couldn't be added due to invalid input: ${error.message}`, status: 400 }));
            }
            if (error instanceof spellModel.DatabaseError || error instanceof DatabaseError) {
                response.status(500);
                response.render('spells.hbs', await getRenderObject({ error: `Sorry, a database error occured while trying to add the spell. Please wait a moment and try again.`, status: 500 }))
                logger.error(error);
            }
        })
}
router.post('/', addSpell);


/**
 * Removes all spells which contain the name provided in the request uri.
 * On a successful delete, the spells page is rendered with the number of spells deleted
 * On a failure, a 400 status will be sent for a bad name 
 * and a 500 status will be sent for a bad database connection.
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 */
async function removeSpellsByName(request, response) {
    const name = request.body.name;

    spellModel.removeSpellsWithMatchingName(name)
        .then(async rowsChanged => { response.render('spells.hbs', await getRenderObject()) })
        .catch(async error => {
            if (error instanceof spellModel.InvalidInputError) {
                logger.error(`Failed to delete spell: ${error.message}`);
                response.status(400)
                response.render('spells.hbs', await getRenderObject({ error: `Spells with the selected name couldn't be deleted due to invalid input: ${error.message}`, status: 400 }))
            }
            if (error instanceof spellModel.DatabaseError || error instanceof DatabaseError) {
                response.status(500);
                response.render('spells.hbs', { error: 'Sorry, a database error was encountered while trying to delete the spells. Please wait a moment and try again.', status: 500 });
                logger.error(error);
            }
        })
}
router.delete('/name', removeSpellsByName);


/**
 * Removes a spell which matching the id provided in the uri.
 * On a successful delete, the spells page is rerendered with the new spells listed.
 * On a failure, a 400 status will be sent for a bad id 
 * and a 500 status will be sent for a bad database connection.
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 */
async function removeSpellById(request, response) {
    id = request.body.spellChoiceId;

    spellModel.removeSpellById(id)
        .then(async spellDeleted => { response.render('spells.hbs', await getRenderObject()) })
        .catch(async error => {
            if (error instanceof spellModel.InvalidInputError) {
                logger.error(`Failed to delete spell: ${error.message}`);
                response.status(400);
                response.render('spells.hbs', await getRenderObject({ error: `Failed to delete spell due to invalid input: ${error.message}`, status: 400 }));
            }
            if (error instanceof spellModel.DatabaseError || error instanceof DatabaseError) {
                response.status(500);
                response.render('spells.hbs', await getRenderObject({ error: `A database error was encountered while trying to delete the spell. Please wait a moment and try again.`, status: 500 }));
                logger.error(error);
            }
        })
}
router.delete('/', removeSpellById);


/**
 * Gets all spells.
 * On a successful get, all the spells are sent in the http response.
 * On a failure, a 500 status will be sent for a bad database connection. 
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 */
async function showAllSpells(request, response) {
    try {
        response.render('spells.hbs', await getRenderObject())
    } catch (error) {
        if (error instanceof spellModel.DatabaseError || error instanceof DatabaseError) {
            response.status(500);
            response.render('spells.hbs', await getRenderObject({ error: `Sorry, a database error was encountered while trying to get the spells. Please wait a moment and try again.`, status: 500 }))
            logger.error(error);
        }
    }
}
router.get('/', showAllSpells);


/**
 * Gets all spells which match the filter provided in the request body.
 * On a successful get, all the spells matching the filter requirements
 *  are sent in the http response.
 * On a failure, a 400 status is sent for a bad filter, and a 
 * 500 status will be sent for a bad database connection. 
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 */
async function showFilteredSpells(request, response) {
    filter = request.query;

    // Unspecified values get passed as empty strings, they should be null for the filter
    if (filter.name == '')
        filter.name = null;


    try {
        // Convert strings to integer, if the string is empty
        // set it to null so it doesn't get parsed to 0
        if (filter.schoolId == '')
            filter.schoolId = null;
        else {
            if (filter.schoolId != null)
                filter.schoolId = Number(filter.schoolId);
        }

        if (filter.level == '')
            filter.level = null;
        else if (filter.level != null) {
            filter.level = Number(filter.level);
        }
    }
    catch (error) {
        logger.error(`Failed to get filtered spells: ${error.message}`);
        response.status(400);
        response.render('spells.hbs', await getRenderObject({ error: `Failed to get the filtered list of spells since the provided filter contained invalid data. The id of the school or the level of the spell was not a number.`, status: 400, filter: filter }))
    }

    spellModel.getSpellsWithSpecifications(filter.level, filter.name, filter.schoolId)
        .then(async filteredSpells => { response.render('spells.hbs', await getRenderObject({ spells: filteredSpells, filter: filter })) })
        .catch(async error => {
            if (error instanceof spellModel.InvalidInputError) {
                logger.error(`Failed to get filtered list of spells: ${error.message}`);
                response.status(400)
                response.render('spells.hbs', await getRenderObject({ error: `Failed to get the filtered list of spells since the provided filter contained invalid data: ${error.message}`, status: 400 }));
            }
            if (error instanceof spellModel.DatabaseError || error instanceof DatabaseError) {
                response.status(500);
                response.render('spells.hbs', await getRenderObject({ error: `Sorry, a database error was encountered while trying to get the filtered list of spells. Please wait a moment and try again.`, status: 500 }));
                logger.error(error);
            }
        })
}
router.get('/filter', showFilteredSpells)


/**
 * Gets the spell with the id provided in the uri.
 * On a successful get, the spell is sent in the http response.
 * On a failure, a 400 status is sent for a bad id, and a 
 * 500 status will be sent for a bad database connection. 
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 */
async function showSpellWithId(request, response) {
    const id = request.params.id;

    spellModel.getSpellById(id)
        .then(async spell => { response.render('focusSpell.hbs', { spell: capitalizeSpells([spell])[0], spellsActive: true }) })
        .catch(async error => {
            if (error instanceof DatabaseError) {
                response.status(500);
                response.render('spells.hbs', await getRenderObject({ error: `Sorry, we couldn't get the spell you wanted to focus on due to a server issue. Please try again in a moment.`, status: 500 }))
                logger.error(error);
            }
            if (error instanceof InvalidInputError) {
                logger.error(`Failed to get spell: ${error.message}`);
                response.status(400)
                response.render('spells.hbs', await getRenderObject({ error: `Sorry, we couldn't get the spell you wanted to focus on. Please try again in a moment.`, status: 400 }))
            }
        });
}
router.get('/:id', showSpellWithId);


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
async function editSpellWithId(request, response) {

    const requestJson = request.body;
    let id;
    let level;
    let school;

    try {
        if (requestJson.spellChoiceId != null)
            id = Number(requestJson.spellChoiceId);

        if (requestJson.level != null)
            level = Number(requestJson.level);

        if (requestJson.schoolId != null)
            school = Number(requestJson.schoolId);
    }
    catch (error) {
        response.status(400).render('spells.hbs', await getRenderObject({ error: 'Failed to edit the spell you selected. The id, level or school was not a number.', status: 400 }))
    }


    const name = requestJson.name;
    const description = requestJson.description;

    spellModel.updateSpellById(id, level, name, school, description)
        .then(async successfulUpdate => { response.render('spells.hbs', await getRenderObject()) })
        .catch(async error => {
            if (error instanceof spellModel.InvalidInputError) {
                logger.error(`Failed to get update spell with id ${id}: ${error.message}`);
                response.status(400)
                response.render('spells.hbs', await getRenderObject({ error: `The spell was not edited due to invalid input: ${error.message}`, status: 400 }))
            }
            if (error instanceof spellModel.DatabaseError || error instanceof DatabaseError) {
                response.status(500);
                response.render('spells.hbs', await getRenderObject({ error: `Sorry, we couldn't get the spell you wanted to edit due to a server side issue. Please try again in a moment.`, status: 500 }))
                logger.error(error);
            }
        })

}
router.put('/', editSpellWithId);

/**
 * Edits all spells with the name provided in the uri to contain the
 * name indicated in the request body. 
 * On a successful edit, the number of spells changed 
 * with the provided name is sent in the response.
 * On a failure, a 400 status is sent for an invalid name, and a 500 status
 * is sent for database issues.
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 */
async function editSpellNames(request, response) {

    const fromName = request.body.fromName;
    const toName = request.body.toName;

    spellModel.updateSpellNames(fromName, toName)
        .then(async spellsChanged => { response.render('spells.hbs', await getRenderObject()) })
        .catch(async error => {
            if (error instanceof spellModel.InvalidInputError) {
                logger.error(`Failed to get update spells with name ${fromName}: ${error.message}`);
                response.status(400)
                response.render('spells.hbs', await getRenderObject({ error: `Failed to change the spell names due to invalid input: ${error.message}`, status: 400 }));
            }
            if (error instanceof spellModel.DatabaseError || error instanceof DatabaseError) {
                response.status(500);
                response.render('spells.hbs', await getRenderObject({ error: `Failed to change the spell names due to a server error`, status: 500 }));
                logger.error(error);
            }
        });

}
router.put('/name', editSpellNames)

/**
 * Manages the requests to edit a spell
 * @param {Object} request The http request
 * @param {Object} response The http response
 */
async function editSpell(request, response) {

    const choice = request.body.choice;
    let spellChoiceId;
    try {
        if (request.body.spellChoiceId != null)
            spellChoiceId = Number(request.body.spellChoiceId);
    } catch (error) {
        logger.error(`Failed to get the id of the chosen spell: ${error.message}`);
        response.status(400)
        response.render('spells.hbs', { error: `Failed to get the id of the chosen spell: ${error.message}`, status: 400 })
    }

    switch (choice) {
        case 'editForm':
            try {
                let options = await getRenderObject({ spellToEditId: spellChoiceId })
                response.render('spells.hbs', options)
            } catch (error) {
                if (error instanceof spellModel.InvalidInputError) {
                    logger.error(`Failed to get update spell page: ${error.message}`);
                    response.status(400)
                    response.render('spells.hbs', await getRenderObject({ error: `Sorry, an error occured while trying to update the page for editing, please try again in a moment.`, status: 400 }))
                }
                if (error instanceof spellModel.DatabaseError || error instanceof DatabaseError) {
                    response.status(500);
                    response.render('spells.hbs', await getRenderObject({ error: `Sorry, a server side issue occured while trying to update the page for editing, please try again in a moment.`, status: 500 }))
                    logger.error(error);
                }
            }
            break;
        default:
            response.render('spells.hbs', await getRenderObject({ error: 'Something went wrong with that button you pressed. Please try again.', status: 400 }))
            break;
    }

}
router.post('/editform', editSpell)

hbs.handlebars.registerHelper('equals', (arg1, arg2) => {
    return arg1 == arg2
});

/**
 * Capitalizes the first letter of every word in each spell name, and the school of the spell.
 * @param {Object} spells The list of spells to capitalize.
 * @returns {Array} the list of spells after being capitalized.
 */
function capitalizeSpells(spells) {
    for (let spell of spells) {
        // Return the spells if the spell is null
        let words;
        try {
            words = spell.name.split(' ')
        } catch (error) {
            return spells;
        }

        if (words.length != 0) {

            // Capitalize this
            let newName = '';
            words.forEach(word => {
                if (word.length == 1)
                    newName += word.toUpperCase();
                else
                    newName += `${word[0].toUpperCase()}${word.substring(1, word.length)} `;
            });

            if (newName.length > 1)
                spell.name = newName.substring(0, newName.length - 1);
            else
                spell.name = newName;
            spell.school = `${spell.school[0].toUpperCase()}${spell.school.substring(1, spell.school.length)}`

        }

    }

    return spells

}

module.exports = {
    router,
    routeRoot
}