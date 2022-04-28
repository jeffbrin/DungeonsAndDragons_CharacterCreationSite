class InvalidInputError extends Error {
    
};
class DatabaseError extends Error {

};
class UserNotFoundError extends Error{

};
class IncorrectPasswordError extends Error{

};

module.exports = { InvalidInputError, DatabaseError, UserNotFoundError, IncorrectPasswordError};
