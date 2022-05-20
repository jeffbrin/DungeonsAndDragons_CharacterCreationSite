const app = require("../../app"); 
const supertest = require("supertest");
let testRequest;
const userModel = require('../../models/userModel');
const dbName = "dnd_db_testing"; 

beforeEach(async () => {
    testRequest = supertest.agent(app);    
});

afterEach(async () => {
    try{
        await userModel.closeConnection();
    }catch(error){
        console.error(error)
    }
});

// Logging in
test("POST /themes success, set to light mode", async () => {
     const testResponse = await testRequest.post('/themes').send({lightMode: true});
     // Line for getting the cookie was written by Jeffrey :)
     const lightThemeValue = testResponse.get('Set-Cookie')[0].split(';')[0].split('=')[1]
     expect(lightThemeValue).toBe('true')
});

test("POST /themes success - dark mode", async () => {
    const testResponse = await testRequest.post('/themes').send({lightMode: false});
     // Line for getting the cookie was written by Jeffrey :)
     const lightThemeValue = testResponse.get('Set-Cookie')[0].split(';')[0].split('=')[1]
     expect(lightThemeValue).toBe('false')
});
