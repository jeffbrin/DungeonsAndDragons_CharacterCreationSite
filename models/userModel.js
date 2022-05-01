const mysql = require('mysql2/promise');
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const logger = require('../logger');
const userValidation = require('./validateUserUtils');
const {InvalidPasswordError, InvalidUsernameError, DatabaseError, IncorrectPasswordError, UserNotFoundError, UserAlreadyExistsError, InvalidSessionError} = require('./errorModel');

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

    // Create the user table
    try{
        await connection.execute('CREATE TABLE IF NOT EXISTS User (Id INT, Username TEXT, Password TEXT, PRIMARY KEY(Id));');
    }
    catch(error){
        throw new DatabaseError('userModel', 'initialize', `Failed to create the User table: ${error};`);
    }

    // Create the session table
    try{
        await connection.execute('CREATE TABLE IF NOT EXISTS Session (Id VARCHAR(200), UserId INT, ExpiryDate DATETIME, PRIMARY KEY(Id), FOREIGN KEY (UserId) REFERENCES User(Id));');
    }
    catch(error){
        throw new DatabaseError('userModel', 'initialize', `Failed to create the Session table: ${error};`);
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
        await connection.execute('DROP TABLE IF EXISTS Session;')
    }
    catch(error){
        throw new DatabaseError('userModel', 'dropReliantTables', `Failed to drop the tables which are reliant on the User table: ${error}`)
    }
}

// class Session {
//     constructor(userId, expiresAt) {
//         this.userId = username
//         this.expiresAt = expiresAt
//     }
//     // We'll use this method later to determine if the session has expired
//     isExpired() {
//         this.expiresAt < (new Date())
//     }
// }

/**
 * Adds a user to the database. If a user with the provided name is already in the database, a UserAlreadyExistsError is thrown.
 * A valid username is any non-empty alphanumeric string with no whitespaces.
 * A valid password is any password that follows the following rules.
 * minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1
 * Used for signing up.
 * @param {String} username The username of the user to add.
 * @param {String} password The unhashed of the user to add.
 * @throws {UserAlreadyExistsError} Thrown when the a user already exists with the username provided.
 * @throws {InvalidUsernameError} Thrown when the username provided is invalid.
 * @throws {InvalidPasswordError} Thrown when the password provided is invalid.
 * @returns The new user's session id.
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
    let rows;
    try{
        [rows, columns] = await connection.query(`SELECT 1 FROM User WHERE Username = '${username}';`);
    }
    catch(error){
        throw new DatabaseError('userModel', 'addUser', `Failed to check whether a user already exists: ${error}`);
    }

    // Check if the user exists
    if (rows.length > 0)
        throw new UserAlreadyExistsError('userModel', 'addUser', `The user with the username ${username} already exists.`);

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
    const hashedPassword = hashPassword(password);
    const insertQuery = `INSERT INTO User (Id, Username, Password) values (${userId}, '${username}', '${hashedPassword}');`;

    // Add the user
    try{
        await connection.execute(insertQuery);
    }
    catch(error){
        throw new DatabaseError('userModel', 'addUser', `Failed to add a user to the database: ${error}`);
    }

    return await createSession(userId)

}

/**
 * Creates a user session and adds it to the database then returns the id of the new session.
 * Also deletes any expired sessions in the database.
 * @param {Integer} userId The id of the user to make the session for.
 * @param {Integer} numMinutes The quantity of time in minutes that the session should be valid for.
 * @returns The id of the new session.
 * @throws {DatabaseError} Thrown when there is an issue adding the new session to the database.
 */
async function createSession(userId, numMinutes = 5) {

    // Delete expired sessions
    await deleteExpiredSessions();

    // Generate a random UUID as the sessionId
    const sessionId = uuid.v4()
    // Set the expiry time as numMinutes (in milliseconds) after the current time
    const expiresAt = new Date(Date.now() + numMinutes * 60000);

    // Insert the session information into the session table
    try{
        await connection.execute(`INSERT INTO Session (Id, UserId, ExpiryDate) values ('${sessionId}', ${userId}, '${dateTimeToMySqlFormat(expiresAt)}')`)
    }
    catch(error){
        throw new DatabaseError('userModel', 'createSession', `Failed to create add the session for user ${userId} to the database: ${error}`);
    }

    // // Create a session object containing information about the user and expiry time
    // const thisSession = new Session(userId, expiresAt);

    // // Add the session information to the sessions map, using sessionId as the key
    // sessions[sessionId] = thisSession;

    return sessionId;
}

/**
 * Removes expired sessions from the database.
 */
async function deleteExpiredSessions(){
    try{
        await connection.execute(`DELETE FROM Session WHERE ExpiresAt < '${dateTimeToMySqlFormat(new Date(Date.now()))}';`);
    }
    catch(error){
        throw new DatabaseError('userModel', 'deleteExpiredSessions', `Failed to delete expired sessions: ${error}`);
    }
}

/**
 * Converts a DateTime object to a string that mysql can interpret.
 * @param {DateTime} datetimeValue The date time value to convert to mysql format.
 * @returns The datetimeValue converted to a mysql datetime string.
 */
function dateTimeToMySqlFormat(datetimeValue){

    return `${datetimeValue.getFullYear()}-${datetimeValue.getMonth()}-${datetimeValue.getDate()} ${datetimeValue.getHours()}:${datetimeValue.getMinutes()}:${datetimeValue.getSeconds()}`;

}

/**
 * Checks to see whether a username and password combination is valid and exists in the database.
 * Used for logging in.
 * @param {String} username The username of the user to be authenticated.
 * @param {String} password The unhashed password of the user to be authenticated.
 * @throws {UserNotFoundError} Thrown when the username was not found in the database.
 * @throws {IncorrectPasswordError} Thrown when the username exists in the database but the password provided does not match.
 * @throws {DatabaseError} Thrown when there was an issue reading from the database.
 * @throws {InvalidUsernameError} Thrown when the username provided is invalid.
 * @throws {InvalidPasswordError} Thrown when the password provided is invalid.
 * @returns A session id for the user.
 */
async function authenticateUser(username, password) {

    // Validate the username and password
    if(!userValidation.validatePassword(password))
        throw new InvalidPasswordError('userModel', 'authenticateUser', 'The provided password was not strong enough.');
    try{
        userValidation.validateUsername(username);
    }
    catch(error){
        throw new InvalidUsernameError('userModel', 'authenticateUser', error.message);
    }

    // Make sure the user exists
    let rows;
    try{
        [rows, columns] = await connection.query(`SELECT Username, Password, Id FROM User WHERE Username = '${username}';`);
    }
    catch(error){
        throw new DatabaseError('userModel', 'authenticateUser', `Failed to check whether a user exists: ${error}`);
    }

    // Check if the user exists
    if (rows.length > 0)
        throw new UserAlreadyExistsError('userModel', 'authenticateUser', `No user with the username ${username} exists.`);

    // Check the password
    const userInfo = rows[0];
    if(!bcrypt.compareSync(password, userInfo.password))
        throw new InvalidPasswordError('userModel', 'authenticateUser', 'The provided password was incorrect.');

    // Return a new session
    return await createSession(userInfo.Id);

}

/**
 * Hashes a password using bcrypt.
 * @param {String} password An unhashed password.
 * @returns The hashed version of the provided password.
 */
function hashPassword(password){
    return bcrypt.hashSync(password, 7);
}

/**
 * Refreshes a user session. If the session is invalid or expired, an InvalidSessionError will be thrown.
 * @param {Integer} sessionId The id of a user session.
 * @returns The new sessionId to provide the user as a cookie.
 * @throws {InvalidSessionError} Thrown when an invalid session was provided. (Expired, non-existant, null).
 * @throws {DatabaseError} Thrown when there is an issue removing an old session from the database or adding the new one.
 */
function refreshSession(sessionId) {

    // Throw if the session is invalid
    const authenticatedSession = await authenticateSession(request);
    if (!authenticatedSession) {
        throw new InvalidSessionError('userModel', 'refreshSession', 'The session id provided was invalid.');
    }

    // Create and store a new Session object that will expire in 15 minutes.
    const newSessionId = await createSession(authenticatedSession.userSession.username, 15);
    // Delete the old entry in the database
    try{
        await connection.execute(`DELETE FROM Session WHERE Id = ${sessionId}`);
    }
    catch(error){
        throw new DatabaseError('userModel', 'refreshSession', `Failed to delete an old session from the database: ${error}`);
    }

    // This should be moved to the controller
    // // Set the session cookie to the new id we generated, with a
    // // renewed expiration time
    // response.cookie("sessionId", newSessionId, { expires: sessions[newSessionId].expiresAt })

    return newSessionId;
}

/**
 * Authenticates a request from the user and returns true or false depending on the authentication. 
 * Also deletes expired sessions from the database.
 * @param {Object} request An http request object.
 * @returns True if the user session id in the request is valid, false otherwise.
 */
function authenticateSession(sessionId) {
    // If the sessionId is null, it's invalid.
    if (!sessionId) {
        return false;
    }
    
    // Remove expired sessions to not validate expired cookies.
    await deleteExpiredSessions();

    // Query the database to find the requested session id.
    try{
        [rows, columns] = await connection.query(`SELECT Id FROM Session WHERE Id = ${sessionId};`)
        if(rows.length > 0)
            return true;
        else
            return false;
    }
    catch(error){
        throw new DatabaseError('userModel', 'authenticateSession', `Failed to query the database to find a matching session id: ${error}`);
    }

    // Old way with no database
    // // We then get the session of the user from our session map
    // userSession = sessions[sessionId]
    // if (!userSession) {
    //     return null;

    // }// If the session has expired, delete the session from our map and return null
    // if (userSession.isExpired()) {
    //     delete sessions[sessionId];
    //     return null;
    // }

}

/**
 * Removes a user session from the database. 
 * Used to log out.
 * @param {String} sessionId A user session id.
 * @throws {DatabaseError} Thrown when there was an issue removing the session from the database.
 */
function removeSession(sessionId){
    try{
        await connection.execute(`DELETE FROM Session WHERE Id = '${sessionId}';`);
    }
    catch(error){
        throw new DatabaseError('userModel', 'removeSession', `Failed to remove a session from the database: ${error}`);
    }
}

module.exports = {
    addUser,
    authenticateUser,
    refreshSession,
    initialize,
    removeSession
}