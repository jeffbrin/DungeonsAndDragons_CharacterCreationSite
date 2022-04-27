const validator = require('validator');
const races = ["dragonborn", "dwarf", "elf", "gnome", "half-elf", "halfling", "half-orc", "human", "tiefling"];
const classes = ["barbarian", "bard", "cleric", "druid", "fighter", "monk", "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"];
const errors = require('./errorModel');
const model = require('./characterModel');
const logger = require('../logger');
const info = logger.info;
const error = logger.error;
const warn = logger.warn;
const connection = model.getConnection();

class ValidationError extends errors.InvalidInputError {
    constructor(message) {
        this.message = message;
    }
}

//Load the data from DB not backing field
async function getFromDatabase() {

}


/**
 * 
 * @param {String} name - The Name of the character
 * @param {Integer} race - The Id of the Race chosen
 * @param {Integer} charClass - The Id of the Class chosen
 * @param {Integer} maxHitpoints  - The Number of Max Hitpoints chosen
 * @param {*} background 
 * @param {*} level 
 * @param {*} abilityScores 
 * @param {*} savingThrows 
 * @param {*} id 
 * @returns 
 */
async function isCharValid(name, race, charClass, maxHitpoints, background, ethics, morality, level, abilityScores, savingThrows, id) {

    let bigErrorMessage = `Character is NOT valid: `
    let caught = false;

    try {
        checkName(name);
    } catch (error) {
        caught = true;
        bigErrorMessage += error.message;
    }

    try {
        checkRace(race);
    } catch (error) {
        caught = true;
        bigErrorMessage += error.message;
    }

    try {
        checkClass(charClass);
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

    if (caught) {
        throw new errors.InvalidInputError(bigErrorMessage);
    }

    return true;
}

function checkName(name) {
    names = name.split(' ');

    for (let i = 0; i < names.length; i++) {
        if (!validator.isAlpha(names[i] || names[i] === "")) {
            error("Name must be Alphanumeric and cannot be empty. Your input: " + name);
            throw new ValidationError(`\nName, ${name}, must not have any special characters or numbers. `);
        }
    }
    info(`Name, ${name}, was validated inside of validateCharacter module in checkName().`);
}
function checkRace(race) {
    if (!races.includes(race.toLowerCase())) {
        error("Race must be one of the Valid Races. Input: " + race);
        throw new ValidationError(`\nRace, ${race}, must be one of the valid races`);
    }
    info(`Race, ${race}, was validated inside of validateCharacter module in checkRace().`);
}
function checkClass(charClass) {
    if (!classes.includes(charClass.toLowerCase())) {
        error("Class must be one of the Valid Classes. Input: " + charClass);
        throw new errors.InvalidInputError();
    }
    info(`Class, ${charClass}, was validated inside of validateCharacter module in checkClass().`);
}
function checkMaxHitPoints(hitpoints) {
    if (hitpoints < 0) {
        error("Hit Points must be greater than 0. Input: " + hitpoints);
        throw new errors.InvalidInputError();
    }
    info(`Max HP, ${hitpoints}, was validated inside of validateCharacter module in checkMaxHitPoints().`);
}
function checkBackgound(background) {

}
function checkLevel(level) {

}
function checkAbilityScores(abilityScores) {

}
function checkSavingThrowProficiencies(savingThrows) {

}
function checkUserID(id) {

}
module.exports = { isCharValid }