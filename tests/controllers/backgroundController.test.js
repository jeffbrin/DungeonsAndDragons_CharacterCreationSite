const app = require("../../app"); 
const supertest = require("supertest");
const testRequest = supertest(app);
const dbName = "dnd_db_testing"; 
const backgroundModel = require('../../models/backgroundModel');
const characterModel = require('../../models/characterModel');
const userModel = require('../../models/userModel');
const spellModel = require('../../models/spellModel');

beforeEach(async () => {
    await backgroundModel.initialize(dbName, true);    
});

afterEach(async () => {
    try{
        await backgroundModel.closeConnection();
    }catch(error){
        console.error(error)
    }
});

// List backgrounds
test('GET /backgrounds - Success', async () => {
    const testResponse = await testRequest.get('/backgrounds').send();

    expect(testResponse.status).toBe(201);
    
})

test('GET /backgrounds - Failure - Closed database connection', async () => {
    await backgroundModel.closeConnection();
    const testResponse = await testRequest.get('/backgrounds').send();

    expect(testResponse.status).toBe(500);
    
})

// Get background
test('GET /backgrounds/:id - Success', async () => {
    const testResponse = await testRequest.get('/backgrounds/1').send();

    expect(testResponse.status).toBe(200);
    
})

test('GET /backgrounds/:id - Failure - Non-Numeric id', async () => {

    const testResponse = await testRequest.get('/backgrounds/hello').send();

    expect(testResponse.status).toBe(400);
    
})

test('GET /backgrounds/:id - Failure - Non-Existant id', async () => {

    const testResponse = await testRequest.get('/backgrounds/100').send();

    expect(testResponse.status).toBe(400);
    
})

test('GET /backgrounds/:id - Failure - Closed database connection', async () => {
    await backgroundModel.closeConnection();
    const testResponse = await testRequest.get('/backgrounds').send();

    expect(testResponse.status).toBe(500);
    
})

