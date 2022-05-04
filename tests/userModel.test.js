const userModel = require('../models/userModel');
const mysql = require('mysql2/promise');
const dbName = 'dnd_db_testing'
const {DatabaseError, InvalidUsernameError, InvalidSessionError, InvalidPasswordError, IncorrectPasswordError, UserAlreadyExistsError} = require('../models/errorModel');

// Initialize the database before each test.
beforeEach(async () => {
    await userModel.initialize(dbName, true);    
});

// Close the database connection after each test to prevent open handles error.
afterEach(async () => {
    await userModel.closeConnection();
});


test('addUser - Success - Returns new session', async () => {
    
})

test('addUser - Failure - Invalid username throws error', async () => {
    
})

test('addUser - Failure - Closed database connection', async () => {
    
})

test('addUser - Failure - Invalid password throws error', async () => {
    
})

test('authenticateUser - Success - Returns new session', async () => {
    
})

test('authenticateUser - Failure - Invalid username throws error', async () => {
    
})

test('authenticateUser - Failure - Invalid password throws error', async () => {
    
})

test('authenticateUser - Failure - Incorrect username throws error', async () => {
    
})

test('authenticateUser - Failure - Incorrect password throws error', async () => {
    
})

test('removeSession - Success - Removes session from database', async () => {
    const session = await userModel.addUser('username', 'validPassword1');
    await userModel.removeSession(session.sessionId);
    
    await expect(userModel.refreshSession(session.sessionId)).rejects.toThrow(InvalidSessionError);

})

test('removeSession - Failure - Session is non-existant', async () => {
    const session = await userModel.addUser('username', 'validPassword1');
    await userModel.removeSession(session.sessionId + 'DMWAKDW');
    
    const proofSessionWasNotDeleted = await userModel.refreshSession(session.sessionId);
    expect(proofSessionWasNotDeleted == null).toBe(false);

})