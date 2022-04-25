const validator = require('validator')

/**
 * Validates a spell's level.
 * A valid spell level must be an integer from 0 to 9.
 * @param {Number} level the level of the spell to validate.
 * @throws If an invalid spell level was passed.
 */
async function validateSpellLevel(level){

    if (typeof level != 'number')
        throw new Error("spell level is not a number.");

    if (level % 1 != 0)
        throw new Error("spell level is not an integer.");
    
    if (level < 0 || level > 9)
        throw new Error("spell level must be between 0 and 9.");

}

/**
 * Validates a spell's name.
 * A valid spell name must not contain any numeric values.
 * @param {String} name the name of the spell to validate.
 * @throws If an invalid spell name was passed.
 */
 async function validateSpellName(name){

    if(typeof name != 'string')
        throw new Error("spell name is not a string.")

    // Split on the space or single quote
    // https://stackoverflow.com/questions/650022/how-do-i-split-a-string-with-multiple-separators-in-javascript
    const splitName = name.split(/'| /)

    if(!name)
        throw new Error("spell name can not be empty.")

    // Check each word in the name
    splitName.forEach(nameSection => {
        if (name.match(/[0-9]/))
            throw new Error("spell name should not contain numbers.")
    });
    
}

/**
 * Validates a spell's school.
 * A spell school is valid if it is one of the valid options.
 * @param {Number} schoolId the id of the school to validate.
 * @throws If an invalid spell school was passed or if the database connection was invalid.
 */
 async function validateSpellSchool(schoolId, validSchools){

    if(typeof schoolId != 'number')
        throw new Error("spell school is not a number.")
    
    if (!validSchools.includes(schoolId))
        throw new Error(`spell school id should be one of the following values: ${validSchools}`)    
    
}

/**
 * Validates a spell's description.
 * A spell description is valid if it is a string and is not empty.
 * @param {String} description the description to validate. 
 * @throws If an invalid spell description was passed.
 */
async function validateSpellDescription(description){

    if(typeof description != 'string')
        throw new Error("spell description is not a string.")

    if (!description)
        throw new Error('spell description can not be empty.')  
    
}

/**
 * Validates a spell's info and throws an error if it's invalid.
 * @param {Number} level the spell's level (between 0-9).
 * @param {String} name the spell's name.
 * @param {String} school the spell's school.
 * @param {String} description a description of what the spell does.
 * @param {Object} validSchools a list of valid school ids.
 */
async function validateSpell(level, name, school, description, validSchools){

    if (level == null || name == null || school == null || description == null)
        throw new Error("spell data is incomplete.");

    await validateSpellLevel(level)
        .then(()=> validateSpellName(name))
        .then(() => validateSpellSchool(school, validSchools))
        .then(() => validateSpellDescription(description))
}

/**
 * Validate's an id for an Sql table. An idea in this instance is
 * the primary key of a table, which should always be a positive integer.
 * @param {Number} id The id to validate.
 */
async function validateSqlTableId(id){
    if (id % 1 != 0)
        throw new Error("id must be an integer.")

    if (id <= 0)
        throw new Error("id must be greater than 0.")
}

module.exports = {
    validateSpellLevel,
    validateSpellName,
    validateSpellSchool,
    validateSpellDescription,
    validateSpell,
    validateSqlTableId
}