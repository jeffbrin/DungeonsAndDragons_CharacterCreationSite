const {InvalidInputError} = require('./errorModel');
const validator = require('validator')

/**
 * Validates a race id. An id just means it's a possible id in the database, NOT that it exists.
 * A valid id must be an integer greater than 0.
 * @param {Number} id The id of a race to validate.
 * @throws {Error} Thrown if the id is invalid. The error will contain a message indicating the reason why the id was invalid.
 */
function validateRaceId(id){
    
    // Make sure the id is a number
    if (!validator.isNumeric(id))
        throw new Error("race id is not a number.");

    id = Number(id);

    // Make sure the id is an integer
    if(Math.floor(id) != id)
        throw new Error('race id must be an integer.')

    // Make sure the id is positive
    if (id < 1)
        throw new Error('race id must be greater than 0.');
}

module.exports = {validateRaceId}