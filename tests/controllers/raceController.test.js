const app = require("../../app"); 
const supertest = require("supertest");
const testRequest = supertest(app);

const dbName = "dnd_db_testing"; 
const raceModel = require('../../models/raceModel');
const classModel = require('../../models/classModel')

beforeEach(async () => {
    await raceModel.initialize(dbName, true);    
    await classModel.initialize(dbName, true);
});

afterEach(async () => {
    try{
        await raceModel.closeConnection();
    }catch(error){
        console.error(error)
    }
});

// List races
test('GET /races - Success', async () => {
    const testResponse = await testRequest.get('/races').send();

    expect(testResponse.status).toBe(200);
    
})

test('GET /races - Failure - Closed database connection', async () => {
    await raceModel.closeConnection();
    const testResponse = await testRequest.get('/races').send();

    expect(testResponse.status).toBe(500);
    
})

// Get race
test('GET /races/:id - Success', async () => {
    const testResponse = await testRequest.get('/races/1').send();

    expect(testResponse.status).toBe(200);
    
})

test('GET /races/:id - Failure - Non-Numeric id', async () => {

    const testResponse = await testRequest.get('/races/hello').send();

    expect(testResponse.status).toBe(400);
    
})

test('GET /races/:id - Failure - Non-Existant id', async () => {

    const testResponse = await testRequest.get('/races/100').send();

    expect(testResponse.status).toBe(400);
    
})

test('GET /races/:id - Failure - Closed database connection', async () => {
    await raceModel.closeConnection();
    const testResponse = await testRequest.get('/races').send();

    expect(testResponse.status).toBe(500);
    
})

