/**
 * Module made by Samuel
 */

const validator = require('validator');
const races = [];
const classes = [];
const backgrounds = [];
const ethics = [];
const moralities = [];
const ABILITY_SCORE_LENGTH = 6;
const savingThrows = [];
const users = [];
const errors = require('./errorModel');
const logger = require('../logger');
const { default: isAlpha } = require('validator/lib/isAlpha');


class ValidationError extends errors.InvalidInputError {
    constructor(message) {
        this.message = message;
    }
}



/* #region  Get Data From DB */
/**
 * Loads the required validation data from the database into the arrays
 * Sets the public constants to the data retrieved.
 */
async function getFromDatabase(connection) {
    const racesQuery = `SELECT Id FROM RACE;`;
    try {
        let [rows, column_definitions] = await connection.query(racesQuery);
        logger.info("validateCharacter - select Query to retrieve races completed - getFromDatabase");
        races = rows;

    } catch (error) {
        throw new errors.DatabaseError('validateCharacter', 'getFromDatabase', `Couldn\`t execute the races select Query: ${error.message}`);
    }


    const classesQuery = 'SELECT Id FROM CLASS;';
    try {
        let [rows, column_definitions] = await connection.query(classesQuery);
        logger.info("validateCharacter - select Query to retrieve classes completed - getFromDatabase");
        classes = rows;
    } catch (error) {
        throw new errors.DatabaseError('validateCharacter', 'getFromDatabase', `Couldn\`t execute the classes select Query: ${error.message}`);
    }


    const backgroundsQuery = 'SELECT Id FROM BACKGROUND;';
    try {
        let [rows, column_definitions] = await connection.query(backgroundsQuery);
        logger.info("validateCharacter - select Query to retrieve backgrounds completed - getFromDatabase");
        backgrounds = rows;
    } catch (error) {
        throw new errors.DatabaseError('validateCharacter', 'getFromDatabase', `Couldn\`t execute the backgrounds select Query: ${error.message}`);
    }


    const ethicsQuery = 'SELECT Id FROM ETHICS;';
    try {
        let [rows, column_definitions] = await connection.query(ethicsQuery);
        logger.info("validateCharacter - select Query to retrieve ethics completed - getFromDatabase");
        ethics = rows;
    } catch (error) {
        throw new errors.DatabaseError('validateCharacter', 'getFromDatabase', `Couldn\`t execute the ethics select Query: ${error.message}`);
    }


    const moralitiesQuery = 'SELECT Id FROM MORALITY;';
    try {
        let [rows, column_definitions] = await connection.query(moralitiesQuery);
        logger.info("validateCharacter - select Query to retrieve moralities completed - getFromDatabase");
        moralities = rows;
    } catch (error) {
        throw new errors.DatabaseError('validateCharacter', 'getFromDatabase', `Couldn\`t execute the moralities select Query: ${error.message}`);
    }


    const savingThrowsQuery = 'SELECT Id FROM ABILITY;';
    try {
        let [rows, column_definitions] = await connection.query(savingThrowsQuery);
        logger.info("validateCharacter - select Query to retrieve savingThrows completed - getFromDatabase");
        savingThrows = rows;
    } catch (error) {
        throw new errors.DatabaseError('validateCharacter', 'getFromDatabase', `Couldn\`t execute the savingThrows select Query: ${error.message}`);
    }


    const usersQuery = 'SELECT Id FROM USER;';
    try {
        let [rows, column_definitions] = await connection.query(usersQuery);
        logger.info("validateCharacter - select Query to retrieve users completed - getFromDatabase");
        users = rows;
    } catch (error) {
        throw new errors.DatabaseError('validateCharacter', 'getFromDatabase', `Couldn\`t execute the users select Query: ${error.message}`);
    }
}
/* #endregion */

/**
 * Validates a Character against a set of restrictions that are set in place.
 * If all the checks pass, then nothing is thrown.
 * if 1 more more checks fail then an error message is built
 * @param {String} name - The Name of the character
 * @param {Integer} raceId - The Id of the Race chosen
 * @param {Integer} charClassId - The Id of the Class chosen
 * @param {Integer} maxHitpoints  - The Number of Max Hitpoints chosen
 * @param {Integer} backgroundId - The Integer Representation of the Characters Background in the Background Table
 * @param {Integer} ethicsId - The Ethics of the Character - Foreign Key ID
 * @param {Integer} moralityId - The Morality of the Character
 * @param {Integer} level - The chosen Level of the Character
 * @param {Int32Array} abilityScoreValues - An array of size 6 of Ability Score IDs in order. Each index of the array is the ability score for that index's ability.
 * Ex. [1, 0, 1, 2, 0, 3] -> Starts at strength and ends with Charisma. Array is 0 based but Ability Ids are 1 based
 * @param {Int32Array} savingThrowIds - An array of Saving Throw Proficiencies IDs. Each index of the array is the Integer of the 
 * Saving Throw the Character is proficient in (1 based)
 * @param {Integer} userId - The Id of the user this character will belong to if created
 * @throws {InvalidInputError} If the Character is not valid, builds up an error message with all the things wrong with the Input.
 */
async function isCharValid(connection, name, raceId, charClassId, maxHitpoints, backgroundId, ethicsId, moralityId, level, abilityScoreValues, savingThrowIds, userId) {

    let bigErrorMessage = `Character is NOT valid: `
    let caught = false;

    //CALLS THE characterStatisticsModel to validate some things
    await getFromDatabase(connection);
    try {
        checkName(name);
    } catch (error) {
        caught = true;
        bigErrorMessage += error.message;
    }

    try {
        checkRace(raceId);
    } catch (error) {
        caught = true;
        bigErrorMessage += error.message;
    }

    try {
        checkClass(charClassId);
    } catch (error) {
        caught = true;
        bigErrorMessage += error.message;
    }

    try {
        checkMaxHitPoints(maxHitpoints);
    } catch (error) {
        caught = true;
        bigErrorMessage += error.message;
    }

    try {
        checkBackground(backgroundId);
    } catch (error) {
        caught = true;
        bigErrorMessage += error.message;
    }

    try {
        checkEthics(ethicsId);
    } catch (error) {
        caught = true;
        bigErrorMessage += error.message;
    }

    try {
        checkMorality(moralityId);
    } catch (error) {
        caught = true;
        bigErrorMessage += error.message;
    }

    try {
        checkLevel(level);
    } catch (error) {
        caught = true;
        bigErrorMessage += error.message;
    }

    try {
        checkAbilityScores(abilityScoreValues);
    } catch (error) {
        caught = true;
        bigErrorMessage += error.message;
    }

    try {
        checkSavingThrowProficiencies(savingThrowIds);
    } catch (error) {
        caught = true;
        bigErrorMessage += error.message;
    }

    try {
        checkUserID(userId);
    } catch (error) {
        caught = true;
        bigErrorMessage += error.message;
    }

    if (caught) {
        throw new errors.InvalidInputError('validateCharacter', 'isCharValid', bigErrorMessage);
    }

}



/* #region  Check Functions */

/**
 * Checks the name of the character in order to see if it is Alphabetized
 * @param {String} name 
 * @throws {ValidationError} If The name can't be validated
 */
function checkName(name) {
    names = name.split(' ');
    for (let i = 0; i < names.length; i++) {
        if (!validator.isAlpha(names[i] || names[i] === "")) {
            logger.error("Name must be Alphanumeric and cannot be empty. Your input: " + name);
            throw new ValidationError(`\nName, ${name}, must not have any special characters or numbers. `);
        }
    }
    logger.info(`Name, ${name}, was validated inside of validateCharacter module in checkName.`);
}
/**
 * Checks the RaceId of the character to make sure it is a valid race in the database
 * @param {Integer} raceId The Id of the selected race
 * @throws {ValidationError} If the raceId was not found in the database.
 */
function checkRace(raceId) {
    if (!races.includes(raceId)) {
        logger.error(`Race must be one of the Valid Races. ${raceId} is not a valid Id of a race`);
        throw new ValidationError(`\nRace, must be one of the valid races`);
    }
    logger.info(`Race, ${race}, was validated inside of validateCharacter module in checkRace.`);
}
/**
 * Validates the class Id to ensure it is in the database.
 * @param {Integer} charClassId - The class Id of the character being validated.
 * @throws {ValidationError} If the charClassId was not found in the database.
 */
function checkClass(charClassId) {
    if (!classes.includes(charClass.toLowerCase())) {
        logger.error("Class must be one of the Valid Classes. Input: " + charClass);
        throw new ValidationError(`\nClass, ${charClassId}, must be one of the valid classes`);
    }
    logger.info(`Class, ${charClass}, was validated inside of validateCharacter module in checkClass.`);
}
/**
 * Validates the Max Hit Points of the character being validated
 * @param {Integer} maxHitpoints - The Number of Max Hit Points the Character will have.
 * @throws {ValidationError} If the maxHitpoints is < 1.
 */
function checkMaxHitPoints(maxHitpoints) {
    if (maxHitpoints < 0) {
        logger.error("Hit Points must be greater than 0. Input: " + maxHitpoints);
        throw new ValidationError(`\nMaximum Hit Points, ${maxHitpoints}, must be more than 0`);
    }
    logger.info(`Max HP, ${maxHitpoints}, was validated inside of validateCharacter module in checkMaxHitPoints.`);
}
/**
 * Validates the background Id against the database
 * @param {Integer} backgroundId - The Background Id that needs to be validated.
 * @throws {ValidationError} If the backgroundId was not found in the database.
 */
function checkBackground(backgroundId) {
    if (!backgrounds.includes(backgroundId)) {
        logger.error(`Background with id ${backgroundId} was not found inside of validateCharacter module in checkBackground`);
        throw new ValidationError(`\nBackground  of id ${backgroundId}must be a valid background. There is no background that matches.`);
    }
    logger.info(`Background with ID: ${backgroundId} was validated inside of validateCharacter module in checkBackgound`);
}
/**
 * Validates the Ethics Id against the database.
 * @param {Integer} ethicsId - The Ethics Id that needs to be validated
 * @throws {ValidationError} If the ethicsId was not found in the database.
 */
function checkEthics(ethicsId) {
    if (!ethics.includes(ethicsId)) {
        logger.error(`ethics with id ${ethicsId} was not found inside of validateCharacter module in checkEthics`);
        throw new ValidationError(`\nethics  of id ${ethicsId}must be a valid ethics. There is no ethics that matches.`);
    }
    logger.info(`ethics with ID: ${ethicsId} was validated inside of validateCharacter module in checkEthics`);
}
/**
 * Validates the Morality Id agianst the database
 * @param {Integer} moralityId - The Morality Id that needs to be validated
 * @throws {ValidationError} If the moralityId was not found in the database.
 */
function checkMorality(moralityId) {
    if (!moralities.includes(moralityId)) {
        logger.error(`Morality with id ${moralityId} was not found inside of validateCharacter module in checkMorality`);
        throw new ValidationError(`\nMorality  of id ${moralityId}must be a valid Morality. There is no morality that matches.`);
    }
    logger.info(`Morality with ID: ${moralityId} was validated inside of validateCharacter module in checkMorality`);
}
/**
 * Validates the level to make sure it is > 0
 * @param {Integer} level - The level that needs validating
 * @throws {ValidationError} If the level passed is < 0.
 */
function checkLevel(level) {
    if (level < 1) {
        logger.error(`Level: ${level} is not a valid level inside of validateCharacter module in checkLevel`);
        throw new ValidationError(`\nLevel must be greater than 0.`);
    }
    logger.info(`Level: ${level} was validated inside of validateCharacter module in checkLevel`);
}
/**
 * Validates the ability score values array to ensure it is 6 long and has all integers in it.
 * @param {IntegerArray} abilityScoreValues - The 6 ability score values
 * @throws {ValidationError} If the ability scores array does not have a length of 6.
 * If any of the entries in the array are alpha.
 */
function checkAbilityScores(abilityScoreValues) {
    if (!abilityScoreValues.length != ABILITY_SCORE_LENGTH) {
        logger.error(`AbilityScores must have 6 entries in the array inside of validateCharacter module in checkAbilityScores`);
        throw new ValidationError(`\nAbility Scores MUST have 6 values.`);
    }
    for (let i = 0; i < ABILITY_SCORE_LENGTH; i++) {
        if (isAlpha(abilityScoreValues[i])) {
            logger.error(`AbilityScores must have 6 integers in the array inside of validateCharacter module in checkAbilityScores`);
            throw new ValidationError(`\nAbility Scores MUST have 6 integers, not strings.`);
        }

    }
    logger.info(`AbilityScores Array was validated inside of validateCharacter module in checkAbilityScores`);
}
/**
 * Validates The Saving throw Ids to ensure they all correspond to skills.
 * @param {IntegerArray} savingThrowIds 
 * @throws {ValidationError} If any savingThrowId was not found in the database.
 */
function checkSavingThrowProficiencies(savingThrowIds) {

    for (let i = 0; i < savingThrowIds.length; i++) {
        if (!savingThrows.includes(savingThrowIds[i])) {
            logger.error(`savingThrows with id ${savingThrowIds[i]} was not found inside of validateCharacter module in checkSavingThrowProficiencies`);
            throw new ValidationError(`\savingThrows  of id ${savingThrowIds[i]}must be a valid background. There is no background that matches.`);
        }
    }
    logger.info(`savingThrows with ID: ${savingThrowIds} was validated inside of validateCharacter module in checkSavingThrowProficiencies`);
}
/**
 * Validates the userId to ensure that it is a valid user
 * @param {Integer} userId - The Id of the user who is creating a character
 * @throws {ValidationError} If the userId was not found in the database.
 */
function checkUserID(userId) {
    if (!users.includes(userId)) {
        logger.error(`User with id ${userId} was not found inside of validateCharacter module in checkUserID`);
        throw new ValidationError(`\nUser  of id ${userId}must be a valid User. There is no User that matches.`);
    }
    logger.info(`User with ID: ${userId} was validated inside of validateCharacter module in checkUserID`);
}
/* #endregion */


module.exports = { isCharValid, checkSavingThrowProficiencies, checkAbilityScores };