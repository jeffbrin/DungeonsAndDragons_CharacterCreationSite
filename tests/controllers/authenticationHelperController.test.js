const helperController = require('../../controllers/authenticationHelperController');
const userModel = require('../../models/userModel');
const app = require('../../app');
const supertest = require('supertest');
const testRequest = supertest(app);
let gateAccessMethodCalled;
let loggedInMethodCalled;
let loggedOutMethodCalled;
const validUser = {username: 'username', password: 'Password1'}
const dbName = 'dnd_db_testing';


beforeEach(async () => {
    gateAccessMethodCalled = false;
    loggedInMethodCalled = false;
    loggedOutMethodCalled = false;
    await userModel.initialize(dbName, true);
    await userModel.addUser(validUser.username, validUser.password);
});

afterEach(async () => {
    await userModel.closeConnection();
});

async function gatedCall(){
    gateAccessMethodCalled = true;
}

async function loggedIn(request, response){
    loggedInMethodCalled = true;
    response.status(200);
} 

async function loggedOut(request, response){
    loggedOutMethodCalled = true;
    response.status(200);
} 

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

function mockRequestWithSessionId(sessionId){
    return {cookies: {sessionId: sessionId}};
}

class MockResponse{

    constructor(){
        this.cookies = {};
    }

    status(val){
        this.status = val;
        return this;
    }

    cookie(name, val){
        this.cookies[name] = val;
    }

    clearCookie(name){
        delete this.cookies[name];
    }

    render(){
    }

    getCookie(name){
        return this.cookies[name];
    }

    redirect(){
        this.status = 302;
        return this;
    }

}

// Gate access
test('gateAccess - Authorized request', async () => {

    const response = await testRequest.post('/sessions').send(validUser);
    const sessionId = getResponseSessionId(response);

    const mockResponse = new MockResponse();
    mockResponse.cookie('sessionId', sessionId);
    await helperController.gateAccess(mockRequestWithSessionId(sessionId), mockResponse, gatedCall);
    expect(mockResponse.status).toBe(200);
    expect(mockResponse.getCookie('sessionId') == sessionId).toBe(false) // New session
    expect(gateAccessMethodCalled).toBe(true);
})

test('gateAccess - Unauthorized request', async () => {
    const response = await testRequest.post('/sessions').send(validUser);
    const sessionId = getResponseSessionId(response);

    const mockResponse = new MockResponse();
    mockResponse.cookie('sessionId', sessionId);
    await helperController.gateAccess(mockRequestWithSessionId(null), mockResponse, gatedCall);
    expect(mockResponse.status).toBe(302);
    expect(mockResponse.getCookie('sessionId') == null).toBe(true) // Cookie was deleted
    expect(gateAccessMethodCalled).toBe(false);
})

test('gateAccess - No cookies', async () => {
    const mockResponse = new MockResponse();
    await helperController.gateAccess({}, mockResponse, gatedCall);
    expect(mockResponse.status).toBe(302);
    expect(mockResponse.getCookie('sessionId') == null).toBe(true) // No session
    expect(gateAccessMethodCalled).toBe(false);
})

test('gateAccess - Closed database connection', async () => {
    const response = await testRequest.post('/sessions').send(validUser);
    const sessionId = getResponseSessionId(response);

    const mockResponse = new MockResponse();
    mockResponse.cookie('sessionId', sessionId);

    await userModel.closeConnection();
    await helperController.gateAccess(mockRequestWithSessionId(sessionId), mockResponse, gatedCall);
    expect(mockResponse.status).toBe(302);
    expect(mockResponse.getCookie('sessionId')).toBe(sessionId) // Same session
    expect(gateAccessMethodCalled).toBe(false);
})

// loadDifferentPagePerLoginStatus
test('loadDifferentPagePerLoginStatus - Logged in', async () => {

    // Login
    const response = await testRequest.post('/sessions').send(validUser);
    const sessionId = getResponseSessionId(response);
    const mockResponse = new MockResponse();
    mockResponse.cookie('sessionId', sessionId);

    await helperController.loadDifferentPagePerLoginStatus(mockRequestWithSessionId(sessionId), mockResponse, loggedIn, loggedOut);
    expect(mockResponse.status).toBe(200);
    expect(mockResponse.getCookie('sessionId') == sessionId).toBe(false) // New session
    expect(mockResponse.getCookie('sessionId') == null).toBe(false) // New session
    expect(loggedInMethodCalled).toBe(true);
    expect(loggedOutMethodCalled).toBe(false);
})

test('loadDifferentPagePerLoginStatus - Logged out', async () => {
    // Login
    const mockResponse = new MockResponse();

    await helperController.loadDifferentPagePerLoginStatus({}, mockResponse, loggedIn, loggedOut);
    expect(mockResponse.status).toBe(200);
    expect(mockResponse.getCookie('sessionId') == null).toBe(true) // No session
    expect(loggedInMethodCalled).toBe(false);
    expect(loggedOutMethodCalled).toBe(true);
})

test('loadDifferentPagePerLoginStatus - Expired Session', async () => {
    // Login
    const response = await testRequest.post('/sessions').send(validUser);
    const sessionId = await userModel.refreshSession(getResponseSessionId(response), -10); // Get an expired session id
    const mockResponse = new MockResponse();
    mockResponse.cookie('sessionId', sessionId);

    await helperController.loadDifferentPagePerLoginStatus(mockRequestWithSessionId(sessionId), mockResponse, loggedIn, loggedOut);
    expect(mockResponse.status).toBe(200);
    expect(mockResponse.getCookie('sessionId') == null).toBe(true) // No session
    expect(loggedInMethodCalled).toBe(false);
    expect(loggedOutMethodCalled).toBe(true);

})

test('loadDifferentPagePerLoginStatus - Closed database connection', async () => {
    // Login
    const response = await testRequest.post('/sessions').send(validUser);
    const sessionId = getResponseSessionId(response)
    const mockResponse = new MockResponse();
    mockResponse.cookie('sessionId', sessionId);

    await userModel.closeConnection();

    await helperController.loadDifferentPagePerLoginStatus(mockRequestWithSessionId(sessionId), mockResponse, loggedIn, loggedOut);
    expect(mockResponse.status).toBe(302);
    expect(mockResponse.getCookie('sessionId')).toBe(sessionId) // Same Session
    expect(loggedInMethodCalled).toBe(false);
    expect(loggedOutMethodCalled).toBe(false);
})