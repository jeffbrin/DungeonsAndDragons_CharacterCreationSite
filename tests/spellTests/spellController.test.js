const app = require("../../app");
const supertest = require("supertest");
const dbName = "dnd_db_testing";
const spellModel = require('../../models/spellModel');
const userModel = require('../../models/userModel');
const classModel = require('../../models/classModel');
const fs = require('fs/promises');

const validSpells = [
    {
        Level: 1, SchoolId: 1, UserId: 1, Description: 'description', Name: 'Name One', CastingTime: 'casting time', EffectRange: 'effectRange', Verbal: true, Somatic:
            true, Material: true, Materials: 'material components', Duration: '1 minute', Damage: '1d6', Concentration: false, Ritual: true, Classes: [1, 2, 3]
    },
    {
        Level: 2, SchoolId: 2, UserId: 1, Description: 'description 2', Name: 'Name two', CastingTime: '1 minute', EffectRange: '20 feet', Verbal: false, Somatic:
            false, Material: false, Materials: null, Duration: '1 hour', Damage: '1d10', Concentration: false, Ritual: false, Classes: [5]
    },
    {
        Level: 3, SchoolId: 3, UserId: 1, Description: 'description 3', Name: 'Name three', CastingTime: '4 hours', EffectRange: '1 universe', Verbal: true, Somatic:
            false, Material: true, Materials: 'material components', Duration: '1 year', Damage: '1d12', Concentration: true, Ritual: false, Classes: [7, 10]
    },
    {
        Level: 4, SchoolId: 4, UserId: 1, Description: 'description 4', Name: 'Name four', CastingTime: 'forever', EffectRange: '1 planet', Verbal: false, Somatic:
            true, Material: false, Materials: null, Duration: '1 minute', Damage: null, Concentration: false, Ritual: false, Classes: [4, 3]
    },
    {
        Level: 5, SchoolId: 5, UserId: 1, Description: 'description 5', Name: 'Name five', CastingTime: 'not long', EffectRange: '100 miles', Verbal: true, Somatic:
            false, Material: false, Materials: null, Duration: '1 month', Damage: '1d4', Concentration: false, Ritual: true, Classes: [1]
    },
    {
        Level: 6, SchoolId: 6, UserId: 1, Description: 'description 6', Name: 'Name six', CastingTime: '12', EffectRange: 'self', Verbal: false, Somatic:
            false, Material: false, Materials: null, Duration: 'a fortnite', Damage: '1d20', Concentration: false, Ritual: false, Classes: [1, 2]
    },
    {
        Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: true, Somatic:
            true, Material: true, Materials: 'material components', Duration: 'long', Damage: null, Concentration: true, Ritual: false, Classes: [9]
    }
];

const invalidSpells = [
    {
        Level: -1, SchoolId: 1, UserId: 1, Description: 'description', Name: 'Name One', CastingTime: 'casting time', EffectRange: 'effectRange', Verbal: true, Somatic:
            true, Material: true, Materials: 'material components', Duration: '1 minute', Damage: '1d6', Concentration: false, Ritual: true, Classes: [1, 2, 3]
    },
    {
        Level: 2, SchoolId: 1000, UserId: 1, Description: 'description 2', Name: 'Name two', CastingTime: '1 minute', EffectRange: '20 feet', Verbal: false, Somatic:
            false, Material: false, Materials: null, Duration: '1 hour', Damage: '1d10', Concentration: false, Ritual: false, Classes: [5]
    },
    {
        Level: 3, SchoolId: 3, UserId: 45, Description: 'description 3', Name: 'Name three', CastingTime: '4 hours', EffectRange: '1 universe', Verbal: true, Somatic:
            false, Material: true, Materials: 'material components', Duration: '1 year', Damage: '1d12', Concentration: true, Ritual: false, Classes: [7, 10]
    },
    {
        Level: 4, SchoolId: 4, UserId: 1, Description: null, Name: 'Name four', CastingTime: 'forever', EffectRange: '1 planet', Verbal: false, Somatic:
            true, Material: false, Materials: null, Duration: '1 minute', Damage: null, Concentration: false, Ritual: false, Classes: [4, 3]
    },
    {
        Level: 5, SchoolId: 5, UserId: 1, Description: 'description 5', Name: null, CastingTime: 'not long', EffectRange: '100 miles', Verbal: true, Somatic:
            false, Material: false, Materials: null, Duration: '1 month', Damage: '1d4', Concentration: false, Ritual: true, Classes: [1]
    },
    {
        Level: 6, SchoolId: 6, UserId: 1, Description: 'description 6', Name: 'Name six', CastingTime: null, EffectRange: 'self', Verbal: false, Somatic:
            false, Material: false, Materials: null, Duration: 'a fortnite', Damage: '1d20', Concentration: false, Ritual: false, Classes: [1, 2]
    },
    {
        Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: null, Verbal: true, Somatic:
            true, Material: true, Materials: 'material components', Duration: 'long', Damage: null, Concentration: true, Ritual: false, Classes: [9]
    },
    {
        Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: null, Somatic:
            true, Material: true, Materials: 'material components', Duration: 'long', Damage: null, Concentration: true, Ritual: false, Classes: [9]
    },
    {
        Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: true, Somatic:
            null, Material: true, Materials: 'material components', Duration: 'long', Damage: null, Concentration: true, Ritual: false, Classes: [9]
    },
    {
        Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: true, Somatic:
            true, Material: false, Materials: 'material components', Duration: 'long', Damage: null, Concentration: true, Ritual: false, Classes: [9]
    },
    {
        Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: true, Somatic:
            true, Material: true, Materials: null, Duration: 'long', Damage: null, Concentration: true, Ritual: false, Classes: [9]
    },
    {
        Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: true, Somatic:
            true, Material: true, Materials: 'material components', Duration: null, Damage: null, Concentration: true, Ritual: false, Classes: [9]
    },
    {
        Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: true, Somatic:
            true, Material: true, Materials: 'material components', Duration: 'long', Damage: null, Concentration: null, Ritual: false, Classes: [9]
    },
    {
        Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: true, Somatic:
            true, Material: true, Materials: 'material components', Duration: 'long', Damage: null, Concentration: true, Ritual: null, Classes: [9]
    },
    {
        Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: true, Somatic:
            true, Material: true, Materials: 'material components', Duration: 'long', Damage: null, Concentration: true, Ritual: false, Classes: []
    },
    {
        Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: true, Somatic:
            true, Material: true, Materials: 'material components', Duration: 'long', Damage: null, Concentration: true, Ritual: false, Classes: [1000]
    },
];

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
beforeAll(async () =>
{
    await spellModel.initialize(dbName, true);
});


let testRequest;
// Initialize the database before each test.
beforeEach(async () =>
{
    testRequest = supertest.agent(app);
    await userModel.initialize(dbName, true);
    await userModel.addUser('TestUser', 'TestPass1243');
    await userModel.addUser('username2', 'Password2');
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
        const userSpells = await spellModel.getSpellsWithSpecifications(null, null, 1, null, null, null, null, null, null, null, null, null, null, true);
        for (spell of userSpells)
        {
            await spellModel.removeSpellById(spell.Id, 1);
        }
    }
    await spellModel.closeConnection();
    await classModel.closeConnection();
    await userModel.closeConnection();

});

const user = { username: 'Jeffrey', password: 'Password1' };

// Adding a spell
test("POST /spells - Succes", async () =>
{

    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(200);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    const testResponse = await testRequest.post('/spells').send(randomValidSpell);

    expect(testResponse.status).toBe(200);

});