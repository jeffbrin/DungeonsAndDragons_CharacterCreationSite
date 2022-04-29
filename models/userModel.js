const mysql = require('mysql2/promise');
let connection;
const uuid = require('uuid');
const tableName = 'playercharacter';
const logger = require('../logger');
const error = logger.error;
const warn = logger.warn;
const info = logger.info;
const errors = require('./errorModel');
const sessions = {};

async function initialize(databaseName, reset){
    
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

async function addUser(username, password) {

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
    refreshSession
}