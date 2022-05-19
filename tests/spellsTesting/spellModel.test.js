const spellModel = require('../../models/spellModel');
const userModel = require('../../models/userModel');
const classModel = require('../../models/classModel');
const { InvalidInputError, DatabaseError } = require('../../models/errorModel');
const dbName = 'dnd_db_testing'

const validSpells = [
    {Level: 1, SchoolId: 1, UserId: 1, Description: 'description', Name: 'Name One', CastingTime: 'casting time', EffectRange: 'effectRange', Verbal: true, Somatic: 
        true, Material: true, Materials: 'material components', Duration: '1 minute', Damage: '1d6', Concentration: false, Ritual: true, Classes: [1, 2, 3]},
    {Level: 2, SchoolId: 2, UserId: 1, Description: 'description 2', Name: 'Name two', CastingTime: '1 minute', EffectRange: '20 feet', Verbal: false, Somatic: 
        false, Material: false, Materials: null, Duration: '1 hour', Damage: '1d10', Concentration: false, Ritual: false, Classes: [5]},
    {Level: 3, SchoolId: 3, UserId: 1, Description: 'description 3', Name: 'Name three', CastingTime: '4 hours', EffectRange: '1 universe', Verbal: true, Somatic: 
        false, Material: true, Materials: 'material components', Duration: '1 year', Damage: '1d12', Concentration: true, Ritual: false, Classes: [7, 10]},
    {Level: 4, SchoolId: 4, UserId: 1, Description: 'description 4', Name: 'Name four', CastingTime: 'forever', EffectRange: '1 planet', Verbal: false, Somatic: 
        true, Material: false, Materials: null, Duration: '1 minute', Damage: null, Concentration: false, Ritual: false, Classes: [4,3]},
    {Level: 5, SchoolId: 5, UserId: 1, Description: 'description 5', Name: 'Name five', CastingTime: 'not long', EffectRange: '100 miles', Verbal: true, Somatic: 
        false, Material: false, Materials: null, Duration: '1 month', Damage: '1d4', Concentration: false, Ritual: true, Classes: [1]},
    {Level: 6, SchoolId: 6, UserId: 1, Description: 'description 6', Name: 'Name six', CastingTime: '12', EffectRange: 'self', Verbal: false, Somatic: 
        false, Material: false, Materials: null, Duration: 'a fortnite', Damage: '1d20', Concentration: false, Ritual: false, Classes: [1, 2]},
    {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: true, Somatic: 
        true, Material: true, Materials: 'material components', Duration: 'long', Damage: null, Concentration: true, Ritual: false, Classes: [9]}
]

const invalidSpells = [
    {Level: -1, SchoolId: 1, UserId: 1, Description: 'description', Name: 'Name One', CastingTime: 'casting time', EffectRange: 'effectRange', Verbal: true, Somatic: 
        true, Material: true, Materials: 'material components', Duration: '1 minute', Damage: '1d6', Concentration: false, Ritual: true, Classes: [1, 2, 3]},
    {Level: 2, SchoolId: 1000, UserId: 1, Description: 'description 2', Name: 'Name two', CastingTime: '1 minute', EffectRange: '20 feet', Verbal: false, Somatic: 
        false, Material: false, Materials: null, Duration: '1 hour', Damage: '1d10', Concentration: false, Ritual: false, Classes: [5]},
    {Level: 3, SchoolId: 3, UserId: 45, Description: 'description 3', Name: 'Name three', CastingTime: '4 hours', EffectRange: '1 universe', Verbal: true, Somatic: 
        false, Material: true, Materials: 'material components', Duration: '1 year', Damage: '1d12', Concentration: true, Ritual: false, Classes: [7, 10]},
    {Level: 4, SchoolId: 4, UserId: 1, Description: null, Name: 'Name four', CastingTime: 'forever', EffectRange: '1 planet', Verbal: false, Somatic: 
        true, Material: false, Materials: null, Duration: '1 minute', Damage: null, Concentration: false, Ritual: false, Classes: [4,3]},
    {Level: 5, SchoolId: 5, UserId: 1, Description: 'description 5', Name: null, CastingTime: 'not long', EffectRange: '100 miles', Verbal: true, Somatic: 
        false, Material: false, Materials: null, Duration: '1 month', Damage: '1d4', Concentration: false, Ritual: true, Classes: [1]},
    {Level: 6, SchoolId: 6, UserId: 1, Description: 'description 6', Name: 'Name six', CastingTime: null, EffectRange: 'self', Verbal: false, Somatic: 
        false, Material: false, Materials: null, Duration: 'a fortnite', Damage: '1d20', Concentration: false, Ritual: false, Classes: [1, 2]},
    {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: null, Verbal: true, Somatic: 
        true, Material: true, Materials: 'material components', Duration: 'long', Damage: null, Concentration: true, Ritual: false, Classes: [9]},
        {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: null, Somatic: 
        true, Material: true, Materials: 'material components', Duration: 'long', Damage: null, Concentration: true, Ritual: false, Classes: [9]},
        {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: true, Somatic: 
        null, Material: true, Materials: 'material components', Duration: 'long', Damage: null, Concentration: true, Ritual: false, Classes: [9]},
        {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: true, Somatic: 
        true, Material: false, Materials: 'material components', Duration: 'long', Damage: null, Concentration: true, Ritual: false, Classes: [9]},
        {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: true, Somatic: 
        true, Material: true, Materials: null, Duration: 'long', Damage: null, Concentration: true, Ritual: false, Classes: [9]},
        {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: true, Somatic: 
        true, Material: true, Materials: 'material components', Duration: null, Damage: null, Concentration: true, Ritual: false, Classes: [9]},
        {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: true, Somatic: 
        true, Material: true, Materials: 'material components', Duration: 'long', Damage: null, Concentration: null, Ritual: false, Classes: [9]},
        {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: true, Somatic: 
        true, Material: true, Materials: 'material components', Duration: 'long', Damage: null, Concentration: true, Ritual: null, Classes: [9]},
        {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: true, Somatic: 
        true, Material: true, Materials: 'material components', Duration: 'long', Damage: null, Concentration: true, Ritual: false, Classes: []},
        {Level: 7, SchoolId: 7, UserId: 1, Description: 'description 7', Name: 'Name seven', CastingTime: '1 hour', EffectRange: '5 feet', Verbal: true, Somatic: 
        true, Material: true, Materials: 'material components', Duration: 'long', Damage: null, Concentration: true, Ritual: false, Classes: [1000]},
]

/**
 * Gets a copy of a random valid spell.
 * @returns A copy of a random spell from an array of premade valid spells.
 */
function randomValidSpell (){ 
    const random = Math.floor(Math.random() * validSpells.length);
    return {...validSpells.slice(random, random+1)[0]}; 
}

/**
 * Gets a copy of a random invalid spell.
 * @returns A copy of a random spell from an array of premade invalid spells.
 */
 function randomInvalidSpell (){ 
    const random = Math.floor(Math.random() * invalidSpells.length);
    return {...invalidSpells.slice(random, random+1)[0]}; 
}

/**
 * Checks whether two spells are the same.
 * @param {Object} spell1 The first spell to compare.
 * @param {Object} spell2 The second spell to compare.
 * @returns True if the spells are equal, false otherwise.
 */
function spellsEqual(spell1, spell2){
    try{
        for (property in spell1){
            if (typeof spell1[property] == 'string'){
                if (spell1[property].toLowerCase() != spell2[property].toLowerCase())
                    return false;
            }
            else if (spell1[property] != spell2[property])
                return false; 
        }
    }
    catch(error){
        console.error(error);
        return false;
    }
    return true;
}

/**
 * Checks whether two arrays contain all the same spells.
 * @param {Array} array1 The first array to compare.
 * @param {Array} array2 The second array to compare.
 * @returns True if the arrays contain the same spells, false otherwise.
 */
function arraysEqual(array1, array2){
    if(array1.length != array2.length) return false;
    for(let i = 0; i < array1.length; i++){
        if(!spellsEqual(array1[i], array2[i])) return false;
    }

    return true;
}

// Initialize the database before each test.
beforeAll(async () => {
    await spellModel.initialize(dbName, true);
});

// Initialize the database before each test.
beforeEach(async () => {
    await userModel.initialize(dbName, true);
    await userModel.addUser('TestUser', 'TestPass1243')
    await classModel.initialize(dbName, true);
    await spellModel.initialize(dbName, false);
});


// Close the database connection after each test to prevent open handles error.
afterEach(async () => {

    // Remove the user's spells after the tests
    // Try catch in case the db is closed when it gets here
    try{
        const userSpells = await spellModel.getSpellsWithSpecifications(null, null, 1, null, null, null, null, null, null, null, null, null, null, true);
        for (spell of userSpells){
            await spellModel.removeSpellById(spell.Id, 1);
        }
    }catch(error){
        await spellModel.initialize(dbName, false);
        const userSpells = await spellModel.getSpellsWithSpecifications(null, null, 1, null, null, null, null, null, null, null, null, null, null, true);
        for (spell of userSpells){
            await spellModel.removeSpellById(spell.Id, 1);
        }
    }
    await spellModel.closeConnection();
    await classModel.closeConnection();
    await userModel.closeConnection();
    
});

/**
 * Gets all the spells that were created by user 1
 */
async function getHomebrewSpells(){
    return await spellModel.getSpellsWithSpecifications(null, null, 1, null, null, null, null, null, null, null, null, null, null, true);
}

// Add spells
// Add spell from values will not be tested since add spell only calls addSpellFromValues
// These tests serve as tests for both methods.
// Tests are duplicated to get more randomness in the spells being added
test('addSpell - Success - random spell 1', async () => {
    
    const addedSpell = await spellModel.addSpell(randomValidSpell());
    const spellInDb = await spellModel.getSpellById(addedSpell.Id, 1);
    
    expect(spellsEqual(addedSpell, spellInDb)).toBe(true);
})

test('addSpell - Success - random spell 2', async () => {
    
    const addedSpell = await spellModel.addSpell(randomValidSpell());
    const spellInDb = await spellModel.getSpellById(addedSpell.Id, 1);
    
    expect(spellsEqual(addedSpell, spellInDb)).toBe(true);
})

test('addSpell - Success - random spell 3', async () => {
    
    const addedSpell = await spellModel.addSpell(randomValidSpell());
    const spellInDb = await spellModel.getSpellById(addedSpell.Id, 1);
    
    expect(spellsEqual(addedSpell, spellInDb)).toBe(true);
})

test('addSpell - Success - Spell already exists', async () => {
    
    const randomSpell = randomValidSpell();
    const addedSpell = await spellModel.addSpell(randomSpell);
    const secondAddedSpell = await spellModel.addSpell(randomSpell);
    const spellInDb = await spellModel.getSpellById(secondAddedSpell.Id, 1);
    
    expect(spellsEqual(addedSpell, spellInDb)).toBe(true);
})

test('addSpell - Failure - Invalid input - random spell 1', async () => {
    
    await expect(spellModel.addSpell(randomInvalidSpell())).rejects.toThrow(InvalidInputError);
    const userSpells = await getHomebrewSpells();

    expect(userSpells.length).toBe(0);
    
})

test('addSpell - Failure - Invalid input - random spell 2', async () => {
    
    await expect(spellModel.addSpell(randomInvalidSpell())).rejects.toThrow(InvalidInputError);
    const userSpells = await getHomebrewSpells();

    expect(userSpells.length).toBe(0);
    
})

test('addSpell - Failure - Invalid input - random spell 3', async () => {
    
    await expect(spellModel.addSpell(randomInvalidSpell())).rejects.toThrow(InvalidInputError);
    const userSpells = await getHomebrewSpells();

    expect(userSpells.length).toBe(0);
    
})

test('addSpell - Failure - Closed database connection', async () => {
    
    await spellModel.closeConnection();
    await expect(spellModel.addSpell(randomValidSpell())).rejects.toThrow(DatabaseError)
    
})

// Remove by id
test('removeSpellById - Success', async () => {
    
    const addedSpell = await spellModel.addSpell(randomValidSpell());
    await spellModel.removeSpellById(addedSpell.Id, 1);

    await expect(spellModel.getSpellById(addedSpell.Id, 1)).rejects.toThrow(InvalidInputError);
})

test('removeSpellById - Failure - Spell does not exist', async () => {
    await expect(spellModel.removeSpellById(1000, 1)).rejects.toThrow(InvalidInputError);
})

test('removeSpellById - Failure - Invalid spell id', async () => {
    await expect(spellModel.removeSpellById(-1, 1)).rejects.toThrow(InvalidInputError);
})

test('removeSpellById - Failure - User does not exist', async () => {
    await expect(spellModel.removeSpellById(5, 5)).rejects.toThrow(InvalidInputError);
})

test('removeSpellById - Failure - User id is invalid', async () => {
    await expect(spellModel.removeSpellById(5, -10)).rejects.toThrow(InvalidInputError);
})

test('removeSpellById - Failure - Closed database connection', async () => {
    await spellModel.closeConnection();
    await expect(spellModel.removeSpellById(1, 1)).rejects.toThrow(DatabaseError);
})

// Get all spells
test('getAllSpells - Success - User id 0 returns all non-homebrewed spells', async () => {
    const startingAllSpells = await spellModel.getAllSpells(0);
    await spellModel.addSpell(randomValidSpell());
    const newAllSpells = await spellModel.getAllSpells(1);

    expect(arraysEqual(startingAllSpells, newAllSpells)).toBe(false);
})

test('getAllSpells - Success - User id 1 returns all spells including homebrew', async () => {
    const startingAllSpells = await spellModel.getAllSpells(1);
    await spellModel.addSpell(randomValidSpell());
    const newAllSpells = await spellModel.getAllSpells(1);

    expect(arraysEqual(startingAllSpells, newAllSpells)).toBe(false);
    expect(startingAllSpells.length).toBe(newAllSpells.length-1);
})

test.only('getAllSpells - Failure - User does not exist', async () => {
    await expect(spellModel.getAllSpells(10)).rejects.toThrow(InvalidInputError);
})

test('getAllSpells - Failure - Closed database connection', async () => {
    await spellModel.closeConnection();
    await expect(spellModel.getAllSpells(1)).rejects.toThrow(DatabaseError);
})

// Get spell by id
test('getSpellById - Success - user can get homebrew spell', async () => {
    const randomSpell = randomValidSpell();
    const addedSpell = await spellModel.addSpell(randomSpell);
    const gottenSpell = await spellModel.getSpellById(addedSpell.Id, 1);

    expect(gottenSpell.Name.toLowerCase()).toBe(addedSpell.Name.toLowerCase())
})

test('getSpellById - Success - user can get players handbook spells', async () => {
    const randomSpell = randomValidSpell();
    randomSpell.UserId = 0;
    const addedSpell = await spellModel.addSpell(randomSpell);
    const gottenSpell = await spellModel.getSpellById(addedSpell.Id, 1);

    expect(gottenSpell.Name.toLowerCase()).toBe(addedSpell.Name.toLowerCase())
})

test('getSpellById - Failure - user can not get other user spell', async () => {
    await userModel.addUser('username2', 'Password2');

    const randomSpell = randomValidSpell();
    randomSpell.UserId = 2;
    const addedSpell = await spellModel.addSpell(randomSpell);
    
    await expect(spellModel.getSpellById(addedSpell.Id, 1)).rejects.toThrow(InvalidInputError);
})

test('getSpellById - Failure - logged out user can not get homebrew spells', async () => {

    const randomSpell = randomValidSpell();
    randomSpell.UserId = 1;
    const addedSpell = await spellModel.addSpell(randomSpell);
    
    await expect(spellModel.getSpellById(addedSpell.Id, 0)).rejects.toThrow(InvalidInputError);
})

test('getSpellById - Failure - Closed database connection', async () => {

    await spellModel.closeConnection();
    await expect(spellModel.getSpellById(1, 0)).rejects.toThrow(DatabaseError);
})