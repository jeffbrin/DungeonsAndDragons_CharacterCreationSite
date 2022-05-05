const app = require("../app"); 
const supertest = require("supertest");
const testRequest = supertest(app);

const dbName = "dnd_db_testing"; 
const userModel = require('../models/userModel');
const validUser = {username: 'username', password: 'Password1'}

/**
 * Gets the session id stored in the response object header as a cookie.
 * @param {Object} response A supertest http response object. 
 * @returns The session id stored in a cookie in the response. Returns null if no cookie was set.
 */
function getResponseSessionId(response){
    try{
        // String > Number > String makes sure the value was a number but still returns a string
        return String(Number(response.header['set-cookie'][0].split('sessionId=')[1].split(';')[0]))
    }catch(error){
        return null;
    }
}

beforeEach(async () => {
    await userModel.initialize(dbName, true);    
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
    const testResponse = await testRequest.post('/users').send(validUser);
    expect(testResponse.status).toBe(201);

    let ct = testResponse.get('content-type');
    expect(ct.startsWith('text/html')).toBe(true);

    // Response contains a sessionId
    let sessionId = getResponseSessionId(testResponse);
    expect(sessionId == null).toBe(false);
});
