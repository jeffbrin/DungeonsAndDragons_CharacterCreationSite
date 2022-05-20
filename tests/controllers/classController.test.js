const app = require("../../app"); 
const supertest = require("supertest");
const testRequest = supertest(app);

const dbName = "dnd_db_testing"; 
const classModel = require('../../models/classModel');
const raceModel = require('../../models/raceModel')

beforeEach(async () => {
    await classModel.initialize(dbName, true);    
    await raceModel.initialize(dbName, true);
});

afterEach(async () => {
    try{
        await classModel.closeConnection();
    }catch(error){
        console.error(error)
    }
});

// List Classes
test('GET /classes - Success', async () => {
    const testResponse = await testRequest.get('/classes').send();

    expect(testResponse.status).toBe(201);
    
})

test('GET /classes - Failure - Closed database connection', async () => {
    await classModel.closeConnection();
    const testResponse = await testRequest.get('/classes').send();

    expect(testResponse.status).toBe(500);
    
})

// Get class
test('GET /classes/:id - Success', async () => {
    const testResponse = await testRequest.get('/classes/1').send();

    expect(testResponse.status).toBe(200);
    
})

test('GET /classes/:id - Failure - Non-Numeric id', async () => {

    const testResponse = await testRequest.get('/classes/hello').send();

    expect(testResponse.status).toBe(400);
    
})

test('GET /classes/:id - Failure - Non-Existant id', async () => {

    const testResponse = await testRequest.get('/classes/100').send();

    expect(testResponse.status).toBe(400);
    
})

test('GET /classes/:id - Failure - Closed database connection', async () => {
    await classModel.closeConnection();
    const testResponse = await testRequest.get('/classes').send();

    expect(testResponse.status).toBe(500);
    
})

