/**
 * Class that extends error class for customized Invalid Input error
 */
class InvalidInputError extends Error {
    /**
     * Constructor to create an error with the following fields
     * @param {string} module module in which the error ocurred
     * @param {string} method in which the error ocurred
     * @param {string} message describing the error
     */
    constructor(module, method, message){
        this.module = module;
        this.method = method;
        this.message = message;
    }

    /**
     * Wil build a string to view the entire error and its details
     * @returns a string containing error info
     */
     toString(){
        return '('+this.module+') ' +  this.method + ': ' + this.message;
    }
};
/**
 * Class that extends error class for customized Database error
 */
class DatabaseError extends Error {
    /**
     * Constructor to create an error with the following fields
     * @param {string} module module in which the error ocurred
     * @param {string} method in which the error ocurred
     * @param {string} message describing the error
     */
    constructor(module, method, message){
        this.module = module;
        this.method = method;
        this.message = message;
    }
    /**
     * Wil build a string to view the entire error and its details
     * @returns a string containing error info
     */
     toString(){
        return '('+this.module+') ' +  this.method + ': ' + this.message;
    }
};
/**
 * Class that extends error class for customized User not found error
 */
class UserNotFoundError extends Error{
    /**
     * Constructor to create an error with the following fields
     * @param {string} module module in which the error ocurred
     * @param {string} method in which the error ocurred
     * @param {string} message describing the error
     */
    constructor(module, method, message){
        this.module = module;
        this.method = method;
        this.message = message;
    }
    /**
     * Wil build a string to view the entire error and its details
     * @returns a string containing error info
     */
     toString(){
        return '('+this.module+') ' +  this.method + ': ' + this.message;
    }
};
/**
 * Class that extends error class for customized incorrect password error
 */
class IncorrectPasswordError extends Error{
    /**
     * Constructor to create an error with the following fields
     * @param {string} module module in which the error ocurred
     * @param {string} method in which the error ocurred
     * @param {string} message describing the error
     */
    constructor(module, method, message){
        super()
        this.module = module;
        this.method = method;
        this.message = message;
    }

    /**
     * Wil build a string to view the entire error and its details
     * @returns a string containing error info
     */
    toString(){
        return '('+this.module+') ' +  this.method + ': ' + this.message;
    }
};


module.exports = { InvalidInputError, DatabaseError, UserNotFoundError, IncorrectPasswordError};
