/**
 * Class that extends error class for customized Invalid Input error
 */
class InvalidInputError extends Error {
    /**
     * Constructor to create an error with the following fields
     * @param {string} module 
     * @param {string} method 
     * @param {string} message 
     */
    constructor(module, method, message){
        this.module = module;
        this.method = method;
        this.message = message;
    }
};
/**
 * Class that extends error class for customized Database error
 */
class DatabaseError extends Error {
    /**
     * Constructor to create an error with the following fields
     * @param {string} module 
     * @param {string} method 
     * @param {string} message 
     */
    constructor(module, method, message){
        this.module = module;
        this.method = method;
        this.message = message;
    }
};
/**
 * Class that extends error class for customized User not found error
 */
class UserNotFoundError extends Error{
    /**
     * Constructor to create an error with the following fields
     * @param {string} module 
     * @param {string} method 
     * @param {string} message 
     */
    constructor(module, method, message){
        this.module = module;
        this.method = method;
        this.message = message;
    }
};
/**
 * Class that extends error class for customized incorrect password error
 */
class IncorrectPasswordError extends Error{
    /**
     * Constructor to create an error with the following fields
     * @param {string} module 
     * @param {string} method 
     * @param {string} message 
     */
    constructor(module, method, message){
        this.module = module;
        this.method = method;
        this.message = message;
    }
};


module.exports = { InvalidInputError, DatabaseError, UserNotFoundError, IncorrectPasswordError};
