class InvalidInputError extends Error {
    string _module;
    string _method;
    string _message
    public InvalidInputError(string module, string method, string message){
        this._module = module;
        this._method = method;
        this._message = message;
    }
};
class DatabaseError extends Error {
    string _module;
    string _method;
    string _message
    public DatabaseError(string module, string method, string message){
        this._module = module;
        this._method = method;
        this._message = message;
    }
};
class UserNotFoundError extends Error{
    string _module;
    string _method;
    string _message
    public UserNotFoundError(string module, string method, string message){
        this._module = module;
        this._method = method;
        this._message = message;
    }

};
class IncorrectPasswordError extends Error{
string _module;
    string _method;
    string _message
    public IncorrectPasswordError(string module, string method, string message){
        this._module = module;
        this._method = method;
        this._message = message;
    }
};

module.exports = { InvalidInputError, DatabaseError, UserNotFoundError, IncorrectPasswordError};
