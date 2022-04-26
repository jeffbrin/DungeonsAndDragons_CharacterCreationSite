const validator = require('validator');
const races = ["dragonborn", "dwarf", "elf", "gnome", "half-elf", "halfling", "half-orc", "human", "tiefling"];
const classes = ["barbarian", "bard", "cleric", "druid", "fighter", "monk", "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"];

/**
 * Checks to see if all the passed in data is valid
 * @param {String} name 
 * @param {String} race 
 * @param {String} charClass 
 * @param {Integer} hitpoints 
 * @returns 
 */
async function isCharValid(name, race, charClass, hitpoints) {
    names = name.split(' ');

    for (let i = 0; i < names.length; i++) {
        if(!validator.isAlpha(names[i] || names[i] === "")){
            console.error("Name must be Alphanumeric and cannot be empty. Your input: " + name);
            return false;
        }    
    }
    if (!races.includes(race.toLowerCase())) {
        console.error("Race must be one of the Valid Races. Your input: " + race);
        return false;
    }
    if (!classes.includes(charClass.toLowerCase())) {
        console.error("Class must be one of the Valid Classes. Your input: " + charClass);
        return false;
    }
    if (hitpoints < 0 || hitpoints > 10) {
        console.error("Hit Points must be between 1 and 10. Your input: " + hitpoints);
        return false;
    }
    return true;
}

module.exports = { isCharValid }