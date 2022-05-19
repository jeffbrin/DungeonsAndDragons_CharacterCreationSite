const spellModel = require('../../models/spellModel');
const userModel = require('../../models/userModel');
const classModel = require('../../models/classModel');
const { InvalidInputError, DatabaseError } = require('../../models/errorModel');
const fs = require('fs/promises')
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

async function getSchoolsFromJSON(){
    return JSON.parse(await fs.readFile('database-content-json/spellSchools.json'));
}

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
            else if (spell1[property] != spell2[property]){
                if(Array.isArray(spell1[property]) && spell1[property].length == spell2[property].length)
                {
                    for (element of spell1[property]){
                        if(!spell2[property].includes(element))
                            return false;
                    }
                }
                else
                    return false; 
            }
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
    await userModel.addUser('TestUser', 'TestPass1243');
    await userModel.addUser('username2', 'Password2');
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

/**
 * Checks if each spell in an array has the same property value.
 * @param {Array} array The array of spells to check.
 * @param {String} property A property to make sure is the same among all the spells
 * @param {Object} value The value that each spell's property should be.
 * @returns True if each spell in the array has a property value equal to the value passed, false otherwise.
 */
function allSpellsInArrayHavePropertyValue(array, property, value){
    for (spell of array){
        if (spell[property] != value)
            return false;
    }
    return true;
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

test('getAllSpells - Failure - User does not exist', async () => {
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

// Get filtered spells
test('getSpellsWithSpecifications - Success - level 3', async () => {
    const spells = await spellModel.getSpellsWithSpecifications(3, null, 1, null, null, null, null, null, null, null, null, null, null, null);
    expect(spells.length > 0).toBe(true);
    allSpellsInArrayHavePropertyValue(spells, 'Level', 3);
})

test('getSpellsWithSpecifications - Success - school 3', async () => {
    const spells = await spellModel.getSpellsWithSpecifications(null, 3, 1, null, null, null, null, null, null, null, null, null, null, null);
    expect(spells.length > 0).toBe(true);
    allSpellsInArrayHavePropertyValue(spells, 'School', 3);
})

test('getSpellsWithSpecifications - Success - name contains "fire"', async () => {
    const spells = await spellModel.getSpellsWithSpecifications(null, null, 1, 'fire', null, null, null, null, null, null, null, null, null, null);
    expect(spells.length > 0).toBe(true);
    
    for (spell of spells){
        expect(spell.Name.toLowerCase()).toContain('fire');
    }
})

test('getSpellsWithSpecifications - Success - homebrew spell included, name contains "fire"', async () => {
    await spellModel.addSpellFromValues(0, 1, 1, 'dwa', "Jeff's Fireball", 'act', 'eff', true, true, true, 'mats', 'dur', '4d6', true, true, [1, 2, 3])
    const spells = await spellModel.getSpellsWithSpecifications(null, null, 1, 'fire', null, null, null, null, null, null, null, null, null, null);
    expect(spells.length > 0).toBe(true);
    
    for (spell of spells){
        expect(spell.Name.toLowerCase()).toContain('fire');
    }
    const spellNames = spells.map(spell => spell.Name.toLowerCase());
    expect(spellNames).toContain("jeff's fireball");
})

test('getSpellsWithSpecifications - Success - 1 action casting time', async () => {
    const spells = await spellModel.getSpellsWithSpecifications(null, null, 1, null, '1 action', null, null, null, null, null, null, null, null, null);
    expect(spells.length > 0).toBe(true);
    allSpellsInArrayHavePropertyValue(spells, 'CastingTime', '1 action');
})

test('getSpellsWithSpecifications - Success - verbal true', async () => {
    const spells = await spellModel.getSpellsWithSpecifications(null, null, 1, null, null, true, null, null, null, null, null, null, null, null);
    expect(spells.length > 0).toBe(true);
    allSpellsInArrayHavePropertyValue(spells, 'Verbal', true);
})

test('getSpellsWithSpecifications - Success - somatic true', async () => {
    const spells = await spellModel.getSpellsWithSpecifications(null, null, 1, null, null, null, true, null, null, null, null, null, null, null);
    expect(spells.length > 0).toBe(true);
    allSpellsInArrayHavePropertyValue(spells, 'Somatic', true);
})

test('getSpellsWithSpecifications - Success - material false', async () => {
    const spells = await spellModel.getSpellsWithSpecifications(null, null, 1, null, null, null, null, false, null, null, null, null, null, null);
    expect(spells.length > 0).toBe(true);
    allSpellsInArrayHavePropertyValue(spells, 'Material', false);
})

test('getSpellsWithSpecifications - Success - duration Instantaneous', async () => {
    const spells = await spellModel.getSpellsWithSpecifications(null, null, 1, null, null, null, null, null, 'Instantaneous', null, null, null, null, null);
    expect(spells.length > 0).toBe(true);
    allSpellsInArrayHavePropertyValue(spells, 'Duration', 'Instantaneous');
})

test('getSpellsWithSpecifications - Success - 60 feet effect range', async () => {
    const spells = await spellModel.getSpellsWithSpecifications(null, null, 1, null, null, null, null, null, null, '60 feet', null, null, null, null);
    expect(spells.length > 0).toBe(true);
    allSpellsInArrayHavePropertyValue(spells, 'EffectRange', '60 feet');
})

test('getSpellsWithSpecifications - Success - concentration true', async () => {
    const spells = await spellModel.getSpellsWithSpecifications(null, null, 1, null, null, null, null, null, null, null, true, null, null, null);
    expect(spells.length > 0).toBe(true);
    allSpellsInArrayHavePropertyValue(spells, 'Concentration', true);
})

test('getSpellsWithSpecifications - Success - ritual true', async () => {
    const spells = await spellModel.getSpellsWithSpecifications(null, null, 1, null, null, null, null, null, null, null, null, true, null, null);
    expect(spells.length > 0).toBe(true);
    allSpellsInArrayHavePropertyValue(spells, 'Ritual', true);
})

test('getSpellsWithSpecifications - Success - class ranger', async () => {
    const spells = await spellModel.getSpellsWithSpecifications(null, null, 1, null, null, null, null, null, null, null, null, null, [8], null);
    expect(spells.length > 0).toBe(true);
    for (spell of spells){
        const classesArray = (await spellModel.getSpellById(spell.Id, 1)).Classes.map(Class => Class.Id);
        expect(classesArray).toContain(8);
    }
})

test('getSpellsWithSpecifications - Success - class warlock and druid', async () => {
    const spells = await spellModel.getSpellsWithSpecifications(null, null, 1, null, null, null, null, null, null, null, null, null, [11, 4],  null);
    expect(spells.length > 0).toBe(true);
    for (spell of spells){
        const classesArray = (await spellModel.getSpellById(spell.Id, 1)).Classes.map(Class => Class.Id);
        expect(classesArray).toContain(4);
        expect(classesArray).toContain(11);
    }
})

test('getSpellsWithSpecifications - Success - class warlock and druid and concentration true', async () => {
    const spells = await spellModel.getSpellsWithSpecifications(null, null, 1, null, null, null, null, null, null, null, true, null, [11, 4], null);
    expect(spells.length > 0).toBe(true);
    for (spell of spells){
        const classesArray = (await spellModel.getSpellById(spell.Id, 1)).Classes.map(Class => Class.Id);
        expect(classesArray).toContain(4);
        expect(classesArray).toContain(11);
    }
    allSpellsInArrayHavePropertyValue(spells, 'Concentration', true);
})

test('getSpellsWithSpecifications - Success - name contains fire and level 3', async () => {
    const spells = await spellModel.getSpellsWithSpecifications(3, null, 1, 'fire', null, null, null, null, null, null, null, null, null, null);
    expect(spells.length > 0).toBe(true);
    
    for (spell of spells){
        expect(spell.Name.toLowerCase()).toContain('fire');
    }

    allSpellsInArrayHavePropertyValue(spells, 'Level', 3);
})

test('getSpellsWithSpecifications - Success - homebrew only', async () => {
    await spellModel.addSpell(randomValidSpell());
    const spells = await spellModel.getSpellsWithSpecifications(null, null, 1, null, null, null, null, null, null, null, null, null, null, true);
    expect(spells.length).toBe(1);
    allSpellsInArrayHavePropertyValue(spells, 'UserId', 1);
})

test('getSpellsWithSpecifications - Success - all null filter returns all spells for user', async () => {
    
    const randomSpell = randomValidSpell();
    randomSpell.UserId = 2;
    await spellModel.addSpell(randomSpell);
    const allSpells = await spellModel.getAllSpells(1);
    const filteredSpells = await spellModel.getSpellsWithSpecifications(null, null, 1, null, null, null, null, null, null, null, null, null, null, null)

    expect(arraysEqual(allSpells, filteredSpells)).toBe(true);
    
})

test('getSpellsWithSpecifications - Failure - invalid user id', async () => {
    await expect(spellModel.getSpellsWithSpecifications(null, null, 100, null, null, null, null, null, null, null, null, null, null, null)).rejects.toThrow(InvalidInputError);
})

test('getSpellsWithSpecifications - Failure - closed database connection', async () => {
    await spellModel.closeConnection();
    await expect(spellModel.getSpellsWithSpecifications(null, null, 1, null, null, null, null, null, null, null, null, null, null, null)).rejects.toThrow(DatabaseError);
})

// Update spell by id
test('updateSpellById - Success - Update All', async () => {
    const randomSpell = randomValidSpell();
    const newRandomSpell = randomValidSpell();
    const addedSpell = await spellModel.addSpell(randomSpell);
    const editedSpell = await spellModel.updateSpellById(addedSpell.Id, 1, newRandomSpell.Level, newRandomSpell.SchoolId, newRandomSpell.Description, newRandomSpell.Name,
                                    newRandomSpell.CastingTime, newRandomSpell.Verbal, newRandomSpell.Somatic, newRandomSpell.Material, newRandomSpell.Materials,
                                    newRandomSpell.Duration, newRandomSpell.Damage, newRandomSpell.EffectRange, newRandomSpell.Concentration, newRandomSpell.Ritual, newRandomSpell.Classes);

    editedSpell.Classes = editedSpell.Classes.map(Class => Class.Id);
    expect(spellsEqual(newRandomSpell, editedSpell)).toBe(true);
})

test('updateSpellById - Failure - Materials not empty with false Material', async () => {
    const randomSpell = randomValidSpell();
    const addedSpell = await spellModel.addSpell(randomSpell);
    await expect(spellModel.updateSpellById(addedSpell.Id, 1, null, null, null, null, null, null, null, false, 'Materials', null, null, null, null, null, null)).rejects.toThrow(InvalidInputError);
})

test('updateSpellById - Failure - null fields', async () => {
    const randomSpell = randomValidSpell();
    const addedSpell = await spellModel.addSpell(randomSpell);
    await expect(spellModel.updateSpellById(addedSpell.Id, 1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null)).rejects.toThrow(InvalidInputError);
})

test('updateSpellById - Failure - Materials empty with true Material', async () => {
    const randomSpell = randomValidSpell();
    const addedSpell = await spellModel.addSpell(randomSpell);
    await expect(spellModel.updateSpellById(addedSpell.Id, 1, null, null, null, null, null, null, null, true, null, null, null, null, null, null, null)).rejects.toThrow(InvalidInputError);
})

test('updateSpellById - Failure - Database connection closed', async () => {
    await spellModel.closeConnection();
    await expect(spellModel.updateSpellById(1, 1, 4, null, null, null, null, null, null, null, null, null, null, null, null, null, null)).rejects.toThrow(DatabaseError);
})

// Get all schools
test('getAllSchools - Success', async () => {
    const jsonSchools = await getSchoolsFromJSON();
    const dbSchools = (await spellModel.getAllSchools()).map(school => school.Name);

    expect(jsonSchools.length).toBe(dbSchools.length);

    for(let i = 0; i < dbSchools.length; i++){
        expect(jsonSchools[i].toLowerCase()).toBe(dbSchools[i].toLowerCase());
    }
})

test('getAllSchools - Failure - Database connection closed', async () => {
    await spellModel.closeConnection();
    await expect(spellModel.getAllSchools()).rejects.toThrow(DatabaseError);
})