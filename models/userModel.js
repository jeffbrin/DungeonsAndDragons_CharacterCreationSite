const mysql = require('mysql2/promise');
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const logger = require('../logger');
const userValidation = require('./validateUserUtils');
const {InvalidPasswordError, InvalidUsernameError, DatabaseError, IncorrectPasswordError, UserNotFoundError, UserAlreadyExistsError} = require('./errorModel');
const sessions = {};

let connection;
/**
 * Initializes the passed database with the User table.
 * If reset is set to true, any table which is reliant on the User table through a foreign key
 * constraint is also dropped.
 * @param {String} databaseName the name of the database to write to.
 * @param {Boolean} reset indicates whether the new table should be reset.
 */
async function initialize(databaseName, reset) {

    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            port: '10000',
            password: 'pass',
            database: databaseName
        });
    }
    catch (error) {
        throw new DatabaseError('raceModel', 'initialize', `Failed to connect to the dnd database in the docker container. Make sure the docker container is running: ${error.message}`);
    }

    // Drop the table and the tables who have foreign keys from the User table
    if(reset){
        await dropReliantTables();
        try{
            await connection.execute('DROP TABLE IF EXISTS User;');
        }
        catch(error){
            throw new DatabaseError('userModel', 'initialize', `Failed to drop the User table: ${error}`);
        }
    }

    // Create the table
    try{
        await connection.execute('CREATE TABLE IF NOT EXISTS User (Id INT, Username TEXT, Password TEXT, PRIMARY KEY(Id));');
    }
    catch(error){
        throw new DatabaseError('userModel', 'initialize', `Failed to create the User table: ${error};`);
    }
    
}

/**
 * Drops all the tables that would cause a foreign key constraint if the User table was dropped.
 */
async function dropReliantTables(){
    try{
        await connection.execute('DROP TABLE IF EXISTS AbilityScore;')
        await connection.execute('DROP TABLE IF EXISTS SkillProficiency;')
        await connection.execute('DROP TABLE IF EXISTS SkillExpertise;')
        await connection.execute('DROP TABLE IF EXISTS SavingThrowProficiency;')
        await connection.execute('DROP TABLE IF EXISTS SavingThrowBonus;')
        await connection.execute('DROP TABLE IF EXISTS Spell;');
        await connection.execute('DROP TABLE IF EXISTS SpellSchool;')
        await connection.execute('DROP TABLE IF EXISTS PlayerCharacter;')
    }
    catch(error){
        throw new DatabaseError('userModel', 'dropReliantTables', `Failed to drop the tables which are reliant on the User table: ${error}`)
    }
}


class Session {
    constructor(username, expiresAt) {
        this.username = username
        this.expiresAt = expiresAt
    }
    // We'll use this method later to determine if the session has expired
    isExpired() {
        this.expiresAt < (new Date())
    }
}

/**
 * Adds a user to the database. If a user with the provided name is already in the database, a UserAlreadyExistsError is thrown.
 * A valid username is any non-empty alphanumeric string with no whitespaces.
 * A valid password is any password that follows the following rules.
 * minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1
 * @param {String} username The username of the user to add.
 * @param {String} password The unhashed of the user to add.
 * @throws {UserAlreadyExistsError} Thrown when the a user already exists with the username provided.
 * @throws {InvalidUsernameError} Thrown when the username provided is invalid.
 * @throws {InvalidPasswordError} Thrown when the password provided is invalid.
 */
async function addUser(username, password) {

    // Validate the username and password
    if(!userValidation.validatePassword(password))
        throw new InvalidPasswordError('userModel', 'addUser', 'The provided password was not strong enough.');
    try{
        userValidation.validateUsername(username);
    }
    catch(error){
        throw new InvalidUsernameError('userModel', 'addUser', error.message);
    }

    // Make sure the user doesn't already exists
    try{
        [rows, columns] = await connection.query(`SELECT 1 FROM User WHERE Username = '${username}';`);
        if (rows.length > 0)
            throw new UserAlreadyExistsError('userModel', 'addUser', `The user with the username ${username} already exists.`);
    }
    catch(error){
        throw new DatabaseError('userModel', 'addUser', `Failed to check whether a user already exists: ${error}`);
    }

    // Get the new user id
    let userId = 1;
    try{
        const [rows, columns] = await connection.query('SELECT Id FROM User ORDER BY Id DESC LIMIT 1;');
        if (rows.length > 0)
            userId = Number(rows[0].Id) + 1
    }
    catch(error){
        throw new DatabaseError('userModel', 'addUser', `Failed to generate a new user id: ${error}`);
    }

    // Hash the password and make the insert query 
    const hashedPassword = bcrypt.hashSync(password, 7);
    const insertQuery = `INSERT INTO User (Id, Username, Password) values (${userId}, '${username}', '${hashedPassword}');`;

    // Add the user
    try{
        await connection.execute(insertQuery);
    }
    catch(error){
        throw new DatabaseError('userModel', 'addUser', `Failed to add a user to the database: ${error}`);
    }

}

async function createSession(username, numMinutes) {
    // Generate a random UUID as the sessionId
    const sessionId = uuid.v4()
    // Set the expiry time as numMinutes (in milliseconds) after the current time
    const expiresAt = new Date(Date.now() + numMinutes * 60000);

    // Create a session object containing information about the user and expiry time
    const thisSession = new Session(username, expiresAt);

    // Add the session information to the sessions map, using sessionId as the key
    sessions[sessionId] = thisSession;
    return sessionId;
}

/**
 * Checks to see whether a username and password combination is valid and exists in the database.
 * @param {String} username The username of the user to be authenticated.
 * @param {String} password The unhashed password of the user to be authenticated.
 * @throws {UserNotFoundError} Thrown when the username was not found in the database.
 * @throws {IncorrectPasswordError} Thrown when the username exists in the database but the password provided does not match.
 * @throws {DatabaseError} Thrown when there was an issue reading from the database.
 * @throws {InvalidUsernameError} Thrown when the username provided is invalid.
 * @throws {InvalidPasswordError} Thrown when the password provided is invalid.
 */
async function authenticateUser(username, password) {

}

function refreshSession(request, response) {
    const authenticatedSession = authenticateUser(request);
    if (!authenticatedSession) {
        response.sendStatus(401); // Unauthorized access
        return;
    }

    // Create and store a new Session object that will expire in 2 minutes.
    const newSessionId = createSession(authenticatedSession.userSession.username, 2);
    // Delete the old entry in the session map 
    delete sessions[authenticatedSession.sessionId];

    // Set the session cookie to the new id we generated, with a
    // renewed expiration time
    response.cookie("sessionId", newSessionId, { expires: sessions[newSessionId].expiresAt })
    return newSessionId;
}

function authenticateUserRequest(request) {
    // If this request doesn't have any cookies, that means it isn't authenticated. Return null.
    if (!request.cookies) {
        return null;
    }
    // We can obtain the session token from the requests cookies, which come with every request
    const sessionId = request.cookies['sessionId']
    if (!sessionId) {
        // If the cookie is not set, return null
        return null;
    }
    // We then get the session of the user from our session map
    userSession = sessions[sessionId]
    if (!userSession) {
        return null;
    }// If the session has expired, delete the session from our map and return null
    if (userSession.isExpired()) {
        delete sessions[sessionId];
        return null;
    }
    return { sessionId, userSession }; // Successfully validated.
}



module.exports = {
    addUser,
    createSession,
    authenticateUser,
    authenticateUserRequest,
    refreshSession,
    initialize
}