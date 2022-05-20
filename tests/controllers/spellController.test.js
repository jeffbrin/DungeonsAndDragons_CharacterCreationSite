const app = require("../../app");
const supertest = require("supertest");
const dbName = "dnd_db_testing";
const spellModel = require('../../models/spellModel');
const userModel = require('../../models/userModel');
const classModel = require('../../models/classModel');

const validModelSpell = 
    {Level: 1, SchoolId: 1, UserId: 1, Description: 'description', Name: 'Name One', CastingTime: 'casting time', EffectRange: 'effectRange', Verbal: true, Somatic: 
        true, Material: true, Materials: 'material components', Duration: '1 minute', Damage: '1d6', Concentration: false, Ritual: true, Classes: [1, 2, 3]}

const validSpells = [
    {Level: 1, SchoolId: 1, UserId: 1, Description: 'description', Name: 'Name One', CastingTime: 'casting time', EffectRange: 'effectRange', Verbal: 'on', Somatic: 
        'on', Material: 'on', Materials: 'material components', Duration: '1 minute', Damage: '1d6', Concentration: '', Ritual: 'on', ClassIds: '1,2,3'},
    {Level: 2, SchoolId: 2, UserId: 1, Description: 'description 2', Name: 'Name two', CastingTime: '1 minute', EffectRange: '20 feet', Verbal: '', Somatic: 
        '', Material: '', Materials: null, Duration: '1 hour', Damage: '1d10', Concentration: '', Ritual: '', ClassIds: '5'},
    {Level: 3, SchoolId: 3, UserId: 1, Description: 'description 3', Name: 'Name three', CastingTime: '4 hours', EffectRange: '1 universe', Verbal: 'on', Somatic: 
        '', Material: 'on', Materials: 'material components', Duration: '1 year', Damage: '1d12', Concentration: 'on', Ritual: '', ClassIds: '7,10'},
    {Level: 4, SchoolId: 4, UserId: 1, Description: 'description 4', Name: 'Name four', CastingTime: 'forever', EffectRange: '1 planet', Verbal: '', Somatic: 
        'on', Material: '', Materials: null, Duration: '1 minute', Damage: null, Concentration: '', Ritual: '', ClassIds: '4,3'},
    {Level: 5, SchoolId: 5, UserId: 1, Description: 'description 5', Name: 'Name five', CastingTime: 'not long', EffectRange: '100 miles', Verbal: 'on', Somatic: 
        '', Material: '', Materials: null, Duration: '1 month', Damage: '1d4', Concentration: '', Ritual: 'on', ClassIds: '1'},
    {Level: 6, SchoolId: 6, UserId: 1, Description: 'description 6', Name: 'Name six', CastingTime: '12', EffectRange: 'self', Verbal: '', Somatic: 
        '', Material: '', Materials: null, Duration: 'a fortnite', Damage: '1d20', Concentration: '', Ritual: '', ClassIds:'1,2'},
    {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: 'on', Somatic: 
        'on', Material: 'on', Materials: 'material components', Duration: 'long', Damage: null, Concentration: 'on', Ritual: '', ClassIds: '9'}
]

const invalidSpells = [
    {Level: -1, SchoolId: 1, UserId: 1, Description: 'description', Name: 'Name One', CastingTime: 'casting time', EffectRange: 'effectRange', Verbal: 'on', Somatic: 
        'on', Material: 'on', Materials: 'material components', Duration: '1 minute', Damage: '1d6', Concentration: '', Ritual: 'on', ClassIds: '1,2,3'},
    {Level: 2, SchoolId: 1000, UserId: 1, Description: 'description 2', Name: 'Name two', CastingTime: '1 minute', EffectRange: '20 feet', Verbal: '', Somatic: 
        '', Material: '', Materials: null, Duration: '1 hour', Damage: '1d10', Concentration: '', Ritual: '', ClassIds: '5'},
    {Level: 3, SchoolId: 3, UserId: 45, Description: 'description 3', Name: 'Name three', CastingTime: '4 hours', EffectRange: '1 universe', Verbal: 'on', Somatic: 
        '', Material: 'on', Materials: 'material components', Duration: '1 year', Damage: '1d12', Concentration: 'on', Ritual: '', ClassIds: '7,10'},
    {Level: 4, SchoolId: 4, UserId: 1, Description: null, Name: 'Name four', CastingTime: 'forever', EffectRange: '1 planet', Verbal: '', Somatic: 
        'on', Material: '', Materials: null, Duration: '1 minute', Damage: null, Concentration: '', Ritual: '', ClassIds: '4,3'},
    {Level: 5, SchoolId: 5, UserId: 1, Description: 'description 5', Name: null, CastingTime: 'not long', EffectRange: '100 miles', Verbal: 'on', Somatic: 
        '', Material: '', Materials: null, Duration: '1 month', Damage: '1d4', Concentration: '', Ritual: 'on', ClassIds: '1'},
    {Level: 6, SchoolId: 6, UserId: 1, Description: 'description 6', Name: 'Name six', CastingTime: null, EffectRange: 'self', Verbal: '', Somatic: 
        '', Material: '', Materials: null, Duration: 'a fortnite', Damage: '1d20', Concentration: '', Ritual: '', ClassIds: '1,2'},
    {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: null, Verbal: 'on', Somatic: 
        'on', Material: 'on', Materials: 'material components', Duration: 'long', Damage: null, Concentration: 'on', Ritual: '', ClassIds: '9'},
        {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: null, Somatic: 
        'on', Material: 'on', Materials: 'material components', Duration: 'long', Damage: null, Concentration: 'on', Ritual: '', ClassIds: '9'},
        {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: 'on', Somatic: 
        null, Material: 'on', Materials: 'material components', Duration: 'long', Damage: null, Concentration: 'on', Ritual: '', ClassIds: '9'},
        {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: 'on', Somatic: 
        'on', Material: '', Materials: 'material components', Duration: 'long', Damage: null, Concentration: 'on', Ritual: '', ClassIds: '9'},
        {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: 'on', Somatic: 
        'on', Material: 'on', Materials: null, Duration: 'long', Damage: null, Concentration: 'on', Ritual: '', ClassIds: '9'},
        {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: 'on', Somatic: 
        'on', Material: 'on', Materials: 'material components', Duration: null, Damage: null, Concentration: 'on', Ritual: '', ClassIds: '9'},
        {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: 'on', Somatic: 
        'on', Material: 'on', Materials: 'material components', Duration: 'long', Damage: null, Concentration: null, Ritual: '', ClassIds: '9'},
        {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: 'on', Somatic: 
        'on', Material: 'on', Materials: 'material components', Duration: 'long', Damage: null, Concentration: 'on', Ritual: null, ClassIds: '9'},
        {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: 'on', Somatic: 
        'on', Material: 'on', Materials: 'material components', Duration: 'long', Damage: null, Concentration: 'on', Ritual: '', ClassIds: ''},
        {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: 'on', Somatic: 
        'on', Material: 'on', Materials: 'material components', Duration: 'long', Damage: null, Concentration: 'on', Ritual: '', ClassIds: '1000'},
]

/**
 * Gets a copy of a random valid spell.
 * @returns A copy of a random spell from an array of premade valid spells.
 */
function randomValidSpell()
{
    const random = Math.floor(Math.random() * validSpells.length);
    return { ...validSpells.slice(random, random + 1)[0] };
}

/**
 * Gets a copy of a random invalid spell.
 * @returns A copy of a random spell from an array of premade invalid spells.
 */
function randomInvalidSpell()
{
    const random = Math.floor(Math.random() * invalidSpells.length);
    return { ...invalidSpells.slice(random, random + 1)[0] };
}

// Initialize the database before each test.
beforeAll(async () => {
    await userModel.initialize(dbName, true);
    await classModel.initialize(dbName, true);
    await spellModel.initialize(dbName, true);
});

let testRequest;
// Initialize the database before each test.
beforeEach(async () => {
    jest.setTimeout(60000);
    testRequest = supertest.agent(app)
    await userModel.initialize(dbName, true);
    await classModel.initialize(dbName, true);
    await spellModel.initialize(dbName, false);
});

// Close the database connection after each test to prevent open handles error.
afterEach(async () =>
{

    // Remove the user's spells after the tests
    // Try catch in case the db is closed when it gets here
    try
    {
        const userSpells = await spellModel.getSpellsWithSpecifications(null, null, 1, null, null, null, null, null, null, null, null, null, null, true);
        for (spell of userSpells)
        {
            await spellModel.removeSpellById(spell.Id, 1);
        }
    } catch (error)
    {
        await spellModel.initialize(dbName, false);
            try{
                const userSpells = await spellModel.getSpellsWithSpecifications(null, null, 1, null, null, null, null, null, null, null, null, null, null, true);
                for (spell of userSpells){
                    await spellModel.removeSpellById(spell.Id, 1);
                }
            }catch (error){
        
            }

    }
    
    await spellModel.closeConnection();
    await classModel.closeConnection();
    await userModel.closeConnection();

});

const user = { username: 'Jeffrey', password: 'Password1' };

// Adding a spell
test("POST /spells - Success", async () => {

    const registerResponse = await testRequest.post('/users').send(user);
          expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();
    
    const randomSpell = randomValidSpell();
    const testResponse = await testRequest.post('/spells').send(randomSpell)
    
    // Redirect to spells page
    expect(testResponse.status).toBe(302);

    // Spell was added
    const allSpellNames = (await spellModel.getAllSpells(1)).map(spell => spell.Name.toLowerCase())
    expect(allSpellNames).toContain(randomSpell.Name.toLowerCase());
    
})

test("POST /spells - Failure - Invalid input", async () => {

    const registerResponse = await testRequest.post('/users').send(user);
          expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();
    
    const testResponse = await testRequest.post('/spells').send(randomInvalidSpell())
    
    // Redirect to spell addition page
     expect(testResponse.status).toBe(302);
    
})

test("POST /spells - Failure - Closed database connection", async () => {

    const registerResponse = await testRequest.post('/users').send(user);
          expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();
    
    await spellModel.closeConnection();
    const testResponse = await testRequest.post('/spells').send(randomInvalidSpell())
    
    // Redirect to home page
     expect(testResponse.status).toBe(302);
    
})

test("POST /spells - Failure - Not logged in", async () => {
   
    const testResponse = await testRequest.post('/spells').send(randomInvalidSpell())
    
    // Redirect to home page
     expect(testResponse.status).toBe(302);
    
})


// DELETE
test("DELETE /spells/id/:id - Success", async () => {
   
    const registerResponse = await testRequest.post('/users').send(user);
          expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();

    const newSpell = await spellModel.addSpell(validModelSpell);
    const startingSpells = await spellModel.getAllSpells(1);
    const testResponse = await testRequest.delete(`/spells/id/${newSpell.Id}`);
    const newSpells = await spellModel.getAllSpells(1);
    
    // Redirect to spells page
     expect(testResponse.status).toBe(302);

     expect(newSpells.length).toBe(startingSpells.length-1);
    
})

test("DELETE /spells/id/:id - Failure - Wrong user's spell", async () => {
   
    const registerResponse = await testRequest.post('/users').send(user);
          expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();

    const startingSpells = await spellModel.getAllSpells(1);
    const testResponse = await testRequest.delete(`/spells/id/1`);
    const newSpells = await spellModel.getAllSpells(1);
    
    // Redirect to home page
     expect(testResponse.status).toBe(302);

     expect(newSpells.length).toBe(startingSpells.length);
    
})

test("DELETE /spells/id/:id - Failure - Spell does not exist", async () => {
   
    const registerResponse = await testRequest.post('/users').send(user);
          expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();

    const startingSpells = await spellModel.getAllSpells(1);
    const testResponse = await testRequest.delete(`/spells/id/10000000`);
    const newSpells = await spellModel.getAllSpells(1);
    
    // Redirect to home page
     expect(testResponse.status).toBe(302);

     expect(newSpells.length).toBe(startingSpells.length);
    
})

test("DELETE /spells/id/:id - Failure - Not logged in", async () => {

    const startingSpells = await spellModel.getAllSpells(0);
    const testResponse = await testRequest.delete(`/spells/id/1`);
    const newSpells = await spellModel.getAllSpells(0);
    
    // Redirect to home page
     expect(testResponse.status).toBe(302);

     expect(newSpells.length).toBe(startingSpells.length);
    
})

test("DELETE /spells/id/:id - Failure - Closed Database Connection", async () => {

    const registerResponse = await testRequest.post('/users').send(user);
    expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();

    await spellModel.closeConnection();
    const testResponse = await testRequest.delete(`/spells/id/1`);
    
    // Redirect to home page
     expect(testResponse.status).toBe(302);
    
})

// GET
test("GET /spells - Success - Logged in", async () => {

    const registerResponse = await testRequest.post('/users').send(user);
    expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();

    const testResponse = await testRequest.get(`/spells`);
    
     expect(testResponse.status).toBe(200);
    
})

test("GET /spells - Success - Logged out", async () => {

    const testResponse = await testRequest.get(`/spells`);
    
     expect(testResponse.status).toBe(200);
    
})

test("GET /spells - Failure - Closed database connection signed in", async () => {

    const registerResponse = await testRequest.post('/users').send(user);
    expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();

    await spellModel.closeConnection();
    const testResponse = await testRequest.get(`/spells`);
    
     expect(testResponse.status).toBe(302);
    
})

test("GET /spells - Failure - Closed database connection signed out", async () => {


    await spellModel.closeConnection();
    const testResponse = await testRequest.get(`/spells`);
    
     expect(testResponse.status).toBe(302);
    
})

// GET specific
test("GET /spells/id/:id - Success - Logged in", async () => {

    const registerResponse = await testRequest.post('/users').send(user);
    expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();

    const testResponse = await testRequest.get(`/spells/id/1`);
    
     expect(testResponse.status).toBe(200);
    
})

test("GET /spells/id/:id - Success - Logged out", async () => {

    const testResponse = await testRequest.get(`/spells/id/1`);
    
     expect(testResponse.status).toBe(200);
    
})

test("GET /spells/id/:id - Success - Logged out can't get homebrew spell", async () => {

    await userModel.addUser(user.username, user.password);
    const addedSpell = await spellModel.addSpell(validModelSpell);
    const testResponse = await testRequest.get(`/spells/id/${addedSpell.Id}`);
    
     expect(testResponse.status).toBe(302);
    
})

test("GET /spells/id/:id - Success - Logged in can get homebrew spell", async () => {

    const registerResponse = await testRequest.post('/users').send(user);
    expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();

    const addedSpell = await spellModel.addSpell(validModelSpell);
    const testResponse = await testRequest.get(`/spells/id/${addedSpell.Id}`);
    
     expect(testResponse.status).toBe(200);
    
})

test("GET /spells/id/:id - Failure - Closed database connection signed in", async () => {

    const registerResponse = await testRequest.post('/users').send(user);
    expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();

    await spellModel.closeConnection();
    const testResponse = await testRequest.get(`/spells/id/1`);
    
     expect(testResponse.status).toBe(302);
    
})

test("GET /spells/id/:id - Failure - Closed database connection signed out", async () => {


    await spellModel.closeConnection();
    const testResponse = await testRequest.get(`/spells/id/1`);
    
     expect(testResponse.status).toBe(302);
    
})

function filterToString(filter){
    q = '?'
    for(prop in filter){
        q += `${prop}=${filter[prop]}&`;
    }
    return q;
}

const nullFilter = {}
const fullFilter = {Level: 1, Name: 'Fire'}

// Filtered spells
test("GET /spells/filter - Success - Logged in null filter", async () => {
    const registerResponse = await testRequest.post('/users').send(user);
    expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();

    const testResponse = await testRequest.get(`/spells/filter${filterToString(nullFilter)}`);
    
     expect(testResponse.status).toBe(200);
    
})

test("GET /spells/filter - Success - Logged out null filter", async () => {

    const testResponse = await testRequest.get(`/spells/filter${filterToString(nullFilter)}`);
    
     expect(testResponse.status).toBe(200);
    
})

test("GET /spells/filter - Success - Logged in full filter", async () => {
    const registerResponse = await testRequest.post('/users').send(user);
    expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();

    const testResponse = await testRequest.get(`/spells/filter${filterToString(fullFilter)}`);
    
     expect(testResponse.status).toBe(200);
    
})

test("GET /spells/filter - Success - Logged out full filter", async () => {

    const testResponse = await testRequest.get(`/spells/filter${filterToString(fullFilter)}`);
    
     expect(testResponse.status).toBe(200);
    
})

test("GET /spells/filter - Failure - bad filter", async () => {

    const newFilter = {...fullFilter}
    newFilter.Level = 100;
    const testResponse = await testRequest.get(`/spells/filter${filterToString(newFilter)}`);
    
     expect(testResponse.status).toBe(302);
    
})

test("GET /spells/filter - Failure - closed database", async () => {

    await spellModel.closeConnection();
    const testResponse = await testRequest.get(`/spells/filter${filterToString(nullFilter)}`);
    
     expect(testResponse.status).toBe(302);
    
})

// UPDATE
test("put /spells/id/:id - Success", async () => {
    const registerResponse = await testRequest.post('/users').send(user);
    expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();

    const newSpell = await spellModel.addSpell(validModelSpell);
    const spellToEditTo = randomValidSpell();
    spellToEditTo.spellId = newSpell.Id;
    const testResponse = await testRequest.put(`/spells/${filterToString(spellToEditTo)}`);
    
     expect(testResponse.status).toBe(302);
    
})
test("put /spells/id/:id - Failure - can not update other user's spell", async () => {
    const registerResponse = await testRequest.post('/users').send(user);
    expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();

    const newSpell = await spellModel.addSpell(validModelSpell);
    const spellToEditTo = randomValidSpell();
    spellToEditTo.spellId = newSpell.Id;
    const testResponse = await testRequest.put(`/spells/${filterToString(spellToEditTo)}`);
    
     expect(testResponse.status).toBe(302);
    
})

test("put /spells/id/:id - Failure - Logged out", async () => {

    await userModel.addUser(user.username, user.password);
    const newSpell = await spellModel.addSpell(validModelSpell);
    const spellToEditTo = randomValidSpell();
    spellToEditTo.spellId = newSpell.Id;
    const testResponse = await testRequest.put(`/spells/${filterToString(spellToEditTo)}`);
    
     expect(testResponse.status).toBe(302);
    
})

test("put /spells/id/:id - Failure - Closed database connection", async () => {

    await spellModel.closeConnection();
    const testResponse = await testRequest.put(`/spells${filterToString(randomValidSpell())}`);
    
     expect(testResponse.status).toBe(302);
    
})

// Get edit page
test("get spells/editform/:id - Success", async () => {
    const registerResponse = await testRequest.post('/users').send(user);
    expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();

    const addedSpell = await spellModel.addSpell(validModelSpell);
    const testResponse = await testRequest.get(`/spells/editform/${addedSpell.Id}`);
    
     expect(testResponse.status).toBe(200);
    
})

test("get spells/editform/:id - Failure - Don't own spell", async () => {
    const registerResponse = await testRequest.post('/users').send(user);
    expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();

    const testResponse = await testRequest.get(`/spells/editform/1`);
    
     expect(testResponse.status).toBe(302);
    
})

test("get spells/editform/:id - Failure - Not signed in", async () => {

    const testResponse = await testRequest.get(`/spells/editform/1`);
    
     expect(testResponse.status).toBe(302);
    
})

test("get spells/editform/:id - Failure - Spell doesn't exist", async () => {
    const registerResponse = await testRequest.post('/users').send(user);
    expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();

    const testResponse = await testRequest.get(`/spells/editform/1`);
    
     expect(testResponse.status).toBe(302);
    
})

test("get spells/editform/:id - Failure - Database connection closed", async () => {
    await spellModel.closeConnection();
    const testResponse = await testRequest.get(`/spells/editform/1`);
    
     expect(testResponse.status).toBe(302);
    
})

// Get Add form
test("get /spells/spelladdition/ - Success", async () => {
    const registerResponse = await testRequest.post('/users').send(user);
    expect (registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user)
    expect (loginResponse.get('Set-Cookie')).toBeDefined();

    const addedSpell = await spellModel.addSpell(validModelSpell);
    const testResponse = await testRequest.get(`/spells/spelladdition/`);
    
     expect(testResponse.status).toBe(200);
    
})

test("get /spells/spelladdition/ - Failure - Not signed in", async () => {

    const testResponse = await testRequest.get(`/spells/spelladdition/`);
    
     expect(testResponse.status).toBe(302);
    
})


test("get /spells/spelladdition/ - Failure - Database connection closed", async () => {
    await spellModel.closeConnection();
    const testResponse = await testRequest.get(`/spells/spelladdition/`);
    
     expect(testResponse.status).toBe(302);
    
})

