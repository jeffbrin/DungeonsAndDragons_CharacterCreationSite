const validator = require('validator')

/**
 * Validates a password using the validator npm module.
 * @param {String} password The password to be validated.
 * @returns True if the password is valid, False if it's invalid.
 */
function validatePassword(password){
    return validator.isStrongPassword(password, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0, returnScore: false, pointsPerUnique: 1, pointsPerRepeat: 0.5, pointsForContainingLower: 10, pointsForContainingUpper: 10, pointsForContainingNumber: 10, pointsForContainingSymbol: 10 });
}

/**
 * Validates a username to ensure it isn't empty and that it doesn't contain any whitespaces.
 * @param {String} username The username to be validated.
 */
function validateUsername(username){
    if(!username)
        throw new Error('A username can not be empty.');
    if (username.includes(' '))
        throw new Error('A username can not include any whitespaces.');
}

module.exports = {validatePassword, validateUsername};