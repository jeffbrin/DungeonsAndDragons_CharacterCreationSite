// const userModel = require('../models/userModel');
// const mysql = require('mysql2/promise');
// const dbName = 'dnd_db_testing'
// const {DatabaseError, InvalidUsernameError, InvalidSessionError, InvalidPasswordError, IncorrectPasswordError, UserAlreadyExistsError, UserNotFoundError} = require('../models/errorModel');

// const VALID_PASSWORD = 'validPassword1';
// const INVALID_PASSWORD = 'pass';
// const VALID_USERNAME = 'username';
// const INVALID_USERNAME = '';

// // Initialize the database before each test.
// beforeEach(async () => {
//     await userModel.initialize(dbName, true);    
// });

// // Close the database connection after each test to prevent open handles error.
// afterEach(async () => {
//     await userModel.closeConnection();
// });


// test('addUser - Success - Returns new session', async () => {
//     const session = await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);

//     expect(session == null).toBe(false);
//     expect(typeof session.sessionId).toBe('string');
//     expect(typeof session.expiryDate).toBe('object');
// })

// test('addUser - Failure - Invalid username throws error', async () => {
//     await expect(userModel.addUser(INVALID_USERNAME, VALID_PASSWORD)).rejects.toThrow(InvalidUsernameError);
// })

// test('addUser - Failure - Closed database connection', async () => {
//     await userModel.closeConnection();
//     await expect(userModel.addUser(VALID_USERNAME, VALID_PASSWORD)).rejects.toThrow(DatabaseError);
// })

// test('addUser - Failure - Invalid password throws error', async () => {
//     await expect(userModel.addUser(VALID_USERNAME, INVALID_PASSWORD)).rejects.toThrow(InvalidPasswordError);
// })

// test('addUser - Failure - Existing username throws error', async () => {
//     await userModel.addUser(VALID_USERNAME, VALID_PASSWORD)
//     await expect(userModel.addUser(VALID_USERNAME, VALID_PASSWORD)).rejects.toThrow(UserAlreadyExistsError);
// })

// test('authenticateUser - Success - Returns new session', async () => {
//     await userModel.addUser(VALID_USERNAME, VALID_PASSWORD)
//     const session = await userModel.authenticateUser(VALID_USERNAME, VALID_PASSWORD);

//     expect(session == null).toBe(false);
//     expect(typeof session.sessionId).toBe('string');
//     expect(typeof session.expiryDate).toBe('object');
// })

// test('authenticateUser - Failure - Invalid username throws error', async () => {
//     await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);
//     await expect(userModel.authenticateUser(INVALID_USERNAME, VALID_PASSWORD)).rejects.toThrow(InvalidUsernameError);
// })

// test('authenticateUser - Failure - Invalid password throws error', async () => {
//     await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);
//     await expect(userModel.authenticateUser(VALID_USERNAME, INVALID_PASSWORD)).rejects.toThrow(InvalidPasswordError);
// })

// test('authenticateUser - Failure - Non-existant username throws error', async () => {
//     await userModel.addUser(VALID_USERNAME, VALID_PASSWORD)
//     await expect(userModel.authenticateUser(VALID_USERNAME + 'a', VALID_PASSWORD)).rejects.toThrow(UserNotFoundError);
// })

// test('authenticateUser - Failure - Incorrect password throws error', async () => {
//     await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);
//     await expect(userModel.authenticateUser(VALID_USERNAME, VALID_PASSWORD + 'a')).rejects.toThrow(IncorrectPasswordError);

// })

// test('removeSession - Success - Removes session from database', async () => {
//     const session = await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);
//     await userModel.removeSession(session.sessionId);
    
//     await expect(userModel.refreshSession(session.sessionId)).rejects.toThrow(InvalidSessionError);

// })

// test('removeSession - Failure - Session is non-existant', async () => {
//     const session = await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);
//     await userModel.removeSession(session.sessionId + 'DMWAKDW');
    
//     const proofSessionWasNotDeleted = await userModel.refreshSession(session.sessionId);
//     expect(proofSessionWasNotDeleted == null).toBe(false);

// })

// test('removeSession - Failure - Closed database connection', async () => {
//     const session = await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);
//     await userModel.closeConnection();
//     await expect(userModel.removeSession(session.sessionId + 'DMWAKDW')).rejects.toThrow(DatabaseError);
// })

// test('refreshSession - Success - Returns new session and deletes old session from db', async () => {
//     const session = await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);
//     const newSession = await userModel.refreshSession(session.sessionId);

//     expect(newSession == null).toBe(false);
//     // Old session was deleted
//     await expect(userModel.refreshSession(session.sessionId)).rejects.toThrow(InvalidSessionError);
// })

// test('refreshSession - Failure - Expired session', async () => {
//     const session = await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);
//     // Get a session that expired 10 minutes ago
//     const newSession = await userModel.refreshSession(session.sessionId, -10);

//     // new session is expired
//     await expect(userModel.refreshSession(newSession.sessionId)).rejects.toThrow(InvalidSessionError);
// })

// test('refreshSession - Failure - Invalid session', async () => {
//     await expect(userModel.refreshSession("-10")).rejects.toThrow(InvalidSessionError);
// })

// test('refreshSession - Failure - Closed database connection', async () => {
//     await userModel.closeConnection();
//     await expect(userModel.refreshSession("a")).rejects.toThrow(DatabaseError);
// })

// test('getUsernameFromSessionId - Success - Returns username', async () => {
//     const session = await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);
//     const username = await userModel.getUsernameFromSessionId(session.sessionId);
    
//     expect(username).toBe(VALID_USERNAME);
// })

// test('getUsernameFromSessionId - Failure - Invalid session id', async () => {
//     await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);
//     await expect(userModel.getUsernameFromSessionId("a")).rejects.toThrow(InvalidSessionError);
// })

// test('getUsernameFromSessionId - Failure - Expired session', async () => {
//     const session = await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);
//     const expiredSession = await userModel.refreshSession(session.sessionId, -10);
//     await expect(userModel.getUsernameFromSessionId(expiredSession.sessionId)).rejects.toThrow(InvalidSessionError);
// })

// test('getUsernameFromSessionId - Failure - Closed database connection', async () => {
//     const session = await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);
//     await userModel.closeConnection();
//     await expect(userModel.getUsernameFromSessionId(session.sessionId)).rejects.toThrow(DatabaseError);
// })

// test('getUserIdFromSessionId - Success - Returns id', async () => {
//     const session = await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);
//     const userId = await userModel.getUserIdFromSessionId(session.sessionId);
    
//     expect(userId).toBe(1);
// })

// test('getUserIdFromSessionId - Failure - Invalid session id', async () => {
//     await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);
//     await expect(userModel.getUserIdFromSessionId("a")).rejects.toThrow(InvalidSessionError);
// })

// test('getUserIdFromSessionId - Failure - Expired session', async () => {
//     const session = await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);
//     const expiredSession = await userModel.refreshSession(session.sessionId, -10);
//     await expect(userModel.getUserIdFromSessionId(expiredSession.sessionId)).rejects.toThrow(InvalidSessionError);
// })

// test('getUserIdFromSessionId - Failure - Closed database connection', async () => {
//     const session = await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);
//     await userModel.closeConnection();
//     await expect(userModel.getUserIdFromSessionId(session.sessionId)).rejects.toThrow(DatabaseError);
// })