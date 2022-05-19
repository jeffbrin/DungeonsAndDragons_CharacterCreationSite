const app = require("../../app"); 
const supertest = require("supertest");
const testRequest = supertest(app);
const dbName = "dnd_db_testing"; 
const userModel = require('../../models/userModel');
const { InvalidSessionError } = require("../../models/errorModel");
const validUser = {username: 'username', password: 'Password1'}

/**
 * Gets the session id stored in the response object header as a cookie.
 * @param {Object} response A supertest http response object. 
 * @returns The session id stored in a cookie in the response. Returns null if no cookie was set.
 */
function getResponseSessionId(response){
    try{
        // String > Number > String makes sure the value was a number but still returns a string
        let sessionId = response.header['set-cookie'][0].split('sessionId=')[1].split(';')[0];
        if(sessionId)
            return String(Number(sessionId));
    }catch(error){
        return null;
    }
}

beforeEach(async () => {
    await userModel.initialize(dbName, true);    
    await userModel.addUser(validUser.username, validUser.password);
});

afterEach(async () => {
    try{
        await userModel.closeConnection();
    }catch(error){
        console.error(error)
    }
});

// Logging in
test("POST /sessions success", async () => {
    const testResponse = await testRequest.post('/sessions').send(validUser);
    expect(testResponse.status).toBe(201);

    let ct = testResponse.get('content-type');
    expect(ct.startsWith('text/html')).toBe(true);

    // Response contains a sessionId
    let sessionId = getResponseSessionId(testResponse);
    expect(sessionId == null).toBe(false);
});

test("POST /sessions failure - Invalid username", async () => {
    const testResponse = await testRequest.post('/sessions').send({username: '', password: validUser.password});
    expect(testResponse.status).toBe(400);

    let ct = testResponse.get('content-type');
    expect(ct.startsWith('text/html')).toBe(true);

    // Response doesn't contain a sessionId
    let sessionId = getResponseSessionId(testResponse);
    expect(sessionId == null).toBe(true);
});

test("POST /sessions failure - Invalid password", async () => {
    const testResponse = await testRequest.post('/sessions').send({username: validUser.username, password: ''});
    expect(testResponse.status).toBe(400);

    let ct = testResponse.get('content-type');
    expect(ct.startsWith('text/html')).toBe(true);

    // Response doesn't contain a sessionId
    let sessionId = getResponseSessionId(testResponse);
    expect(sessionId == null).toBe(true);
});

test("POST /sessions failure - Username doesn't exist", async () => {
    const testResponse = await testRequest.post('/sessions').send({username: 'user', password: validUser.password});
    expect(testResponse.status).toBe(400);

    let ct = testResponse.get('content-type');
    expect(ct.startsWith('text/html')).toBe(true);

    // Response doesn't contain a sessionId
    let sessionId = getResponseSessionId(testResponse);
    expect(sessionId == null).toBe(true);
});

test("POST /sessions failure - Empty body", async () => {
    const testResponse = await testRequest.post('/sessions').send();
    expect(testResponse.status).toBe(400);

    let ct = testResponse.get('content-type');
    expect(ct.startsWith('text/html')).toBe(true);

    // Response doesn't contain a sessionId
    let sessionId = getResponseSessionId(testResponse);
    expect(sessionId == null).toBe(true);
})

test("POST /sessions failure - Closed database connection", async () => {
    userModel.closeConnection();
    const testResponse = await testRequest.post('/sessions').send(validUser);
    expect(testResponse.status).toBe(500);

    let ct = testResponse.get('content-type');
    expect(ct.startsWith('text/html')).toBe(true);

    // Response doesn't contain a sessionId
    let sessionId = getResponseSessionId(testResponse);
    expect(sessionId == null).toBe(true);
});

// Logging out
test("DELETE /sessions Success", async () => {
    let testResponse = await testRequest.post('/sessions').send(validUser);
    let sessionId = getResponseSessionId(testResponse);

    // Log out
    testResponse = await testRequest.delete('/sessions').set('Cookie', [`sessionId=${sessionId}`]).send();
    
    expect(testResponse.status).toBe(200);

    let ct = testResponse.get('content-type');
    expect(ct.startsWith('text/html')).toBe(true);

    // Response doesn't contain a sessionId
    let newSessionId = getResponseSessionId(testResponse);
    expect(newSessionId == null).toBe(true);

    // Prove the session was deleted from the database
    await expect(userModel.getUserIdFromSessionId(sessionId)).rejects.toThrow(InvalidSessionError);
});

test("DELETE /sessions Success - Session id does not exist", async () => {

    // Log out
    testResponse = await testRequest.delete('/sessions').set('Cookie', [`sessionId=10`]).send();
    
    expect(testResponse.status).toBe(200);

    let ct = testResponse.get('content-type');
    expect(ct.startsWith('text/html')).toBe(true);

    // Response doesn't contain a sessionId
    let newSessionId = getResponseSessionId(testResponse);
    expect(newSessionId == null).toBe(true);

});

test("DELETE /sessions failure - Closed database connection", async () => {
    let testResponse = await testRequest.post('/sessions').send(validUser);
    let sessionId = getResponseSessionId(testResponse);

    // Log out
    await userModel.closeConnection();
    testResponse = await testRequest.delete('/sessions').set('Cookie', [`sessionId=${sessionId}`]).send();
    
    expect(testResponse.status).toBe(500);

    let ct = testResponse.get('content-type');
    expect(ct.startsWith('text/html')).toBe(true);

    // Response doesn't contain a sessionId
    let newSessionId = getResponseSessionId(testResponse);
    expect(newSessionId == null).toBe(true);
});