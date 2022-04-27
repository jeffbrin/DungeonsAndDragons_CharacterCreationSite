const validator = require('validator');
const races = ["dragonborn", "dwarf", "elf", "gnome", "half-elf", "halfling", "half-orc", "human", "tiefling"];
const classes = ["barbarian", "bard", "cleric", "druid", "fighter", "monk", "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"];
const errors = require('./errorModel');
const logger = require('../logger');

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
async function isCharValid(name, race, charClass, maxHitpoints, background, level, abilityScores, savingThrows, id) {
    
    let errorMessages = [];

    try {
        checkName(name);
    } catch (error) {
        errorMessages.push(error.message);
    }

    try {
        checkRace(race);
    } catch (error) {
        errorMessages.push(error.message);
    }

    try {
        checkClass(charClass);
    } catch (error) {
        errorMessages.push(error.message);
    }
    
    try {
        checkMaxHitPoints(maxHitpoints);
    } catch (error) {
        errorMessages.push(error.message);
    }
    
    

    return errorMessages;
}

function checkName(name){
    names = name.split(' ');

    for (let i = 0; i < names.length; i++) {
        if(!validator.isAlpha(names[i] || names[i] === "")){
            logger.error("Name must be Alphanumeric and cannot be empty. Your input: " + name);
            throw new errors.InvalidInputError();
        }    
    }
}
function checkRace(race){
    if (!races.includes(race.toLowerCase())) {
        logger.error("Race must be one of the Valid Races. Input: " + race);
        throw new errors.InvalidInputError();
    }
}
function checkClass(charClass){
    if (!classes.includes(charClass.toLowerCase())) {
        logger.error("Class must be one of the Valid Classes. Input: " + charClass);
        throw new errors.InvalidInputError();
    }
}
function checkMaxHitPoints(hitpoints){
    if (hitpoints < 0) {
        logger.error("Hit Points must be greater than 0. Input: " + hitpoints);
        throw new errors.InvalidInputError();
    }
}
function checkBackgound(background){

}
function checkLevel(level){

}
function checkAbilityScores(abilityScores){

}
function checkSavingThrowProficiencies(savingThrows){

}
function chckUserID(id){

}
module.exports = { isCharValid }