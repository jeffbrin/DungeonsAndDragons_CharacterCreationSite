const validator = require('validator')
const {DatabaseError} = require('./errorModel')

/**
 * Validates a spell's level.
 * A valid spell level must be an integer from 0 to 9.
 * @param {Number} level the level of the spell to validate.
 * @throws If an invalid spell level was passed.
 */
async function validateSpellLevel(level){

    if (!validator.isNumeric(level))
        throw new Error("spell level is not a number.");

    if (level % 1 != 0)
        throw new Error("spell level is not an integer.");
    
    if (level < 0 || level > 9)
        throw new Error("spell level must be between 0 and 9.");

}

/**
 * Validates a spell's name.
 * A valid spell name must not be empty.
 * @param {String} name the name of the spell to validate.
 * @throws If an invalid spell name was passed.
 */
 async function validateSpellName(name){

    if(typeof name != 'string')
        throw new Error("spell name is not a string.")

    if(!name)
        throw new Error("spell name can not be empty.")
    
}

/**
 * Validates a spell's school.
 * A spell school is valid if it is one of the valid options.
 * @param {Number} schoolId The id of the school to validate.
 * @param {Object} conneciton A connection to the database.
 * @throws {InvalidInputError} If an invalid spell school was passed or if the database connection was invalid.
 */
 async function validateSpellSchool(schoolId, connection){

    if(!validator.isNumeric(level))
        throw new Error("spell school is not a number.")
    
        let spellSchoolIds;
    try{
        [spellSchoolIds, cols] = connection.query('SELECT Id from SpellSchool');
        spellSchoolIds = spellSchoolIds.map(obj => obj.Id);
    } 
    catch(error){
        throw new DatabaseError('validateSpellUtils', 'validateSpellSchool', `Failed to query the database for spell schools: ${error}`);
    }

    if(!spellSchoolIds.includes(schoolId)){
        throw new Error('Spell school does not exist');
    }
    
}

/**
 * Validates a spell's user.
 * A user id is valid if it exists in the user table.
 * @param {Number} userId The id of the user to validate.
 * @param {Object} conneciton A connection to the database.
 * @throws {InvalidInputError} If an invalid user id was passed or if the database connection was invalid.
 */
async function validateUser(userId, connection){

    if(!validator.isNumeric(userId))
        throw new Error("user id is not a number.")
    
        let userIds;
    try{
        [userIds, cols] = connection.query('SELECT Id from User');
        userIds = userIds.map(obj => obj.Id);
    } 
    catch(error){
        throw new DatabaseError('validateSpellUtils', 'validateUser', `Failed to query the database for user ids: ${error}`);
    }

    if(!userIds.includes(userId)){
        throw new Error('User id does not exist');
    }
    
}

/**
 * Validates a value that is valid if it is a non-empty string.
 * @param {String} term the string to validate. 
 * @param {String} name the name of the value being passed.
 * @throws {Error} If an empty string was passed.
 */
async function validateSpellGenericString(term, name){

    if(typeof term != 'string')
        throw new Error(`spell ${name} is not a string.`)

    if (!term)
        throw new Error(`spell ${name} can not be empty.`)  
    
}

/**
 * Validates a component boolean to make sure it's a boolean value
 * @param {Boolean} boolVal The boolean value to validate.
 * @throws {Error} Thrown if the value passed is not a boolean.
 */
async function validateSpellComponentBool(boolVal){
    if (typeof boolVal != 'boolean'){
        throw new Error('One of the spell components are not a valid type.')
    }
}

async function validateMaterials(material, materials){
    if(typeof material != 'boolean')
        throw new Error('The material component value was not a valid type.');

    if(material && materials == null)
        throw new Error('The material components must be indicated for a spell which require them.');
        
    if(!materials && materials != null)
        throw new error('Material components should be empty for a spell not requiring them, did you mean to require material components for this spell?')
}

/**
 * Validates a spell's info and throws an error if it's invalid.
  * @param {Integer} level the spell's level (between 0-9).
  * @param {Integer} schoolId the id of the spell's school.
  * @param {Integer} userId The id of the user linked to the spell.
  * @param {Integer} level The level of the spell.
  * @param {String} description a description of what the spell does.
  * @param {String} name the spell's name.
  * @param {String} castingTime The casting time of the spell.
  * @param {String} target The target of the spell.
  * @param {Boolean} verbal Indicates whether the spell requires verbal components.
  * @param {Boolean} somatic Indicates whether the spell requires somatic components.
  * @param {Boolean} material Indicates whether the spell requires material components.
  * @param {String} materials The materials required for a spell, must be null if material is false, can not be null if material is true.
  * @param {String} duration The duration of the spell. 
  * @param {String} damage The damage of the spell, can be null.
  * @param {Object} connection A connection to the database.
  * @throws {Error} Thrown if the spell data was invalid.
  * @throws {DatabaseError} Thrown if the validation could not be performed due to a database issue.
  */
async function validateSpell(level, schoolId, userId, level, description, name, castingTime, target, verbal, somatic, material, materials, duration, damage, connection){

    if (level == null || name == null || userId == null || description == null || schoolId == null || castingTime == null
         || target == null || verbal == null || somatic == null || material == null || duration == null)
        throw new Error("spell data is incomplete.");

    await validateSpellLevel(level)
        .then(()=> validateSpellName(name))
        .then(() => validateSpellSchool(schoolId, connection))
        .then(() => validateSpellGenericString(description, 'description'))
        .then(() => validateUser(userId))
        .then(() => validateSpellGenericString(castingTime, 'casting time'))
        .then(() => validateSpellGenericString(target, 'target'))
        .then(() => validateSpellComponentBool(verbal))
        .then(() => validateSpellComponentBool(somatic))
        .then(() => validateMaterials(material, materials))
        .then(() => validateSpellGenericString(duration, 'duration'))
        .then(() => validateSpellDamage(damage, 'damage'))
        
}

module.exports = {
    validateSpellLevel,
    validateSpellName,
    validateSpellSchool,
    validateSpellGenericString,
    validateSpell,
}