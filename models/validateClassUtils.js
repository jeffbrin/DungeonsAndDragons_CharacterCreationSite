const {InvalidInputError} = require('./errorModel');

/**
 * Validates a class id. An id just means it's a possible id in the database, NOT that it exists.
 * A valid id must be an integer greater than 0.
 * @param {Number} id The id of a class to validate.
 * @throws {Error} Thrown if the id is invalid. The error will contain a message indicating the reason why the id was invalid.
 */
function validateClassId(id){
    
    // Make sure the id is a number
    if (typeof id != 'number')
        throw new Error("class id is not a number.");

    // Make sure the id is an integer
    if(Math.floor(id) != id)
        throw new Error('class id must be an integer.')

    // Make sure the id is positive
    if (id < 1)
        throw new Error('class id must be greater than 0.');
}

module.exports = {validateClassId}