const spellModel = require('../../models/spellModel');
const dbName = 'dnd_db_testing'

const randomSpells = [
    {level: 0, name: 'Acid Splash', schoolId: 1, description: 'Splashes some acid on someone - Ranged spell attack (1d6 acid damage).'},
    {level: 1, name: 'Absorb Elements', schoolId: 2, description: 'The spell captures some of the incoming energy, lessening its effect on you and storing it for your next melee attack. You have resistance to the triggering damage type until the start of your next turn. Also, the first time you hit with a melee attack on your next turn, the target takes an extra 1d6 damage of the triggering type, and the spell ends.'},
    {level: 2, name: 'Acid Arrow', schoolId: 1, description: 'A shimmering green arrow streaks toward a target within range and bursts in a spray of acid. Make a ranged spell attack against the target. On a hit, the target takes 4d4 acid damage immediately and 2d4 acid damage at the end of its next turn.'},
    {level: 3, name: 'Animate Dead', schoolId: 3, description: 'This spell creates an undead servant. Choose a pile of bones or a corpse of a Medium or Small humanoid within range. Your spell imbues the target with a foul mimicry of life, raising it as an undead creature. '},
    {level: 4, name: 'Dimension Door', schoolId: 4, description: 'You teleport yourself from your current location to any other spot within range. You arrive at exactly the spot desired. It can be a place you can see, one you can visualize, or one you can describe by stating distance and direction, such as "200 feet straight downward" or "upward to the northwest at a 45- degree angle, 300 feet."'},
    {level: 5, name: 'Legend Lore', schoolId: 5, description: 'Name or describe a person, place, or object. The spell brings to your mind a brief summary of the significant lore about the thing you named. The lore might consist of current tales, forgotten stories, or even secret lore that has never been widely known.'},
    {level: 6, name: 'Programmed Illusion', schoolId: 6, description: 'You create an illusion of an object, a creature, or some other visible phenomenon within range that activates when a specific condition occurs. The illusion is imperceptible until then. It must be no larger than a 30-foot cube, and you decide when you cast the spell how the illusion behaves and what sounds it makes. This scripted performance can last up to 5 minutes.'},
    {level: 7, name: 'Etherealness', schoolId: 7, description: 'You step into the border regions of the Ethereal Plane, in the area where it overlaps with your current plane. You remain in the Border Ethereal for the duration or until you use your action to dismiss the spell. During this time, you can move in any direction. If you move up or down, every foot of movement costs an extra foot.'},
    {level: 8, name: 'Dominate Monster', schoolId: 8, description: 'You attempt to beguile a creature that you can see within range. It must succeed on a Wisdom saving throw or be charmed by you for the duration. If you or creatures that are friendly to you are fighting it, it has advantage on the saving throw.'},
    {level: 9, name: 'Power Word Kill', schoolId: 8, description: 'You utter a word of power that can compel one creature you can see within range to die instantly. If the creature you choose has 100 hit points or fewer, it dies. Otherwise, the spell has no effect.'}
]

/**
 * Gets a copy of a random spell.
 * @returns A copy of a random spell from an array of premade spells.
 */
function getRandomSpell (){ 
    const random = Math.floor(Math.random() * randomSpells.length);
    return {...randomSpells.slice(random, random+1)[0]}; 
}

// Initialize the database before each test.
beforeEach(async () => {
    await spellModel.initialize(dbName, true);
});

// Close the database connection after each test to prevent open handles error.
afterEach(async () => {
    await spellModel.closeConnection();
});

// Not many test cases are necessary for addSpell since it is uses addSpellFromValues for most of the logic
test('addSpell - Success', async() => {

    // Add random spell
    const randomSpell = getRandomSpell();
    const spellAddedSuccessfully = await spellModel.addSpell(randomSpell);

    // Get the spells in the db
    const storedSpells = await spellModel.getAllSpells();

    // stored spells should be an array
    expect(Array.isArray(storedSpells)).toBe(true);

    // Spell should have been added successfully
    expect(spellAddedSuccessfully).toBe(true)

    // Spell in db should be the same as the original
    expect(storedSpells.length).toBe(1);
    expect(storedSpells[0].level).toBe(randomSpell.level)
    expect(storedSpells[0].name).toBe(randomSpell.name.toLowerCase())
    expect(storedSpells[0].description).toBe(randomSpell.description)

})

test('addSpell - Fail (Invalid level)', async() => {

    // Add random spell
    const randomSpell = getRandomSpell();
    randomSpell.level = -1;
    await expect(spellModel.addSpellFromValues(randomSpell)).rejects.toThrow(spellModel.InvalidInputError)

    // Get the spells in the db
    const storedSpells = await spellModel.getAllSpells();

    // No spells should be in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(0);

})

test('addSpellFromValues - Success', async() => {

    // Add random spell
    const randomSpell = getRandomSpell();
    const spellAddedSuccessfully = await spellModel.addSpellFromValues(randomSpell.level, randomSpell.name, randomSpell.schoolId, randomSpell.description);

    // Get the spells in the db
    const storedSpells = await spellModel.getAllSpells();

    // stored spells should be an array
    expect(Array.isArray(storedSpells)).toBe(true);

    // Spell should have been added successfully
    expect(spellAddedSuccessfully).toBe(true)

    // Spell in db should be the same as the original
    expect(storedSpells.length).toBe(1);
    expect(storedSpells[0].level).toBe(randomSpell.level)
    expect(storedSpells[0].name).toBe(randomSpell.name.toLowerCase())
    expect(storedSpells[0].description).toBe(randomSpell.description)

})

test('addSpellFromValues - Success spell already exists', async() => {
    // Add random spell
    const randomSpell = getRandomSpell();
    await spellModel.addSpellFromValues(randomSpell.level, randomSpell.name, randomSpell.schoolId, randomSpell.description);
    const addedSpellBoolean = await spellModel.addSpellFromValues(randomSpell.level, randomSpell.name, randomSpell.schoolId, randomSpell.description + 'Change description to make sure the original is kept.');

    // Get the spells in the db
    const storedSpells = await spellModel.getAllSpells();

    // stored spells should be an array
    expect(Array.isArray(storedSpells)).toBe(true);

    // Failed to add spell since it already exists
    expect(addedSpellBoolean).toBe(false)

    // Spell in db should be the same as the original
    expect(storedSpells.length).toBe(1);
    expect(storedSpells[0].level).toBe(randomSpell.level)
    expect(storedSpells[0].name).toBe(randomSpell.name.toLowerCase())
    expect(storedSpells[0].description).toBe(randomSpell.description)
})

test('addSpellFromValues - Fail (Invalid level)', async() => {

    // Add random spell
    const randomSpell = getRandomSpell();
    await expect(spellModel.addSpellFromValues(-1, randomSpell.name, randomSpell.schoolId, randomSpell.description)).rejects.toThrow(spellModel.InvalidInputError);

    // Get the spells in the db
    const storedSpells = await spellModel.getAllSpells();

    // No spells should be in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(0);

})

test('addSpellFromValues - Fail (Invalid empty name)', async() => {

    // Add random spell
    const randomSpell = getRandomSpell();
    await expect(spellModel.addSpellFromValues(randomSpell.level, '', randomSpell.schoolId, randomSpell.description)).rejects.toThrow(spellModel.InvalidInputError);

    // Get the spells in the db
    const storedSpells = await spellModel.getAllSpells();

    // No spells should be in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(0);

})

test('addSpellFromValues - Fail (Invalid school one of options)', async() => {

    // Add random spell
    const randomSpell = getRandomSpell();
    await expect(spellModel.addSpellFromValues(randomSpell.level, randomSpell.name, 'Conjurmaten', randomSpell.description)).rejects.toThrow(spellModel.InvalidInputError);

    // Get the spells in the db
    const storedSpells = await spellModel.getAllSpells();

    // No spells should be in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(0);

})

test('addSpellFromValues - Fail (Invalid description wrong datatype)', async() => {

    // Add random spell
    const randomSpell = getRandomSpell();
    await expect(spellModel.addSpellFromValues(randomSpell.level, randomSpell.name, randomSpell.schoolId, 10)).rejects.toThrow(spellModel.InvalidInputError);

    // Get the spells in the db
    const storedSpells = await spellModel.getAllSpells();

    // No spells should be in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(0);

})

test('deleteSpellById - Success', async() => {
    const randomSpellToDelete = getRandomSpell();
    let randomSpellToKeep = getRandomSpell();

    while (randomSpellToDelete.name == randomSpellToKeep.name){
        randomSpellToKeep = getRandomSpell();
    }

    // Add two spells
    await spellModel.addSpellFromValues(randomSpellToDelete.level, randomSpellToDelete.name, randomSpellToDelete.schoolId, randomSpellToDelete.description);
    await spellModel.addSpellFromValues(randomSpellToKeep.level, randomSpellToKeep.name, randomSpellToKeep.schoolId, randomSpellToKeep.description);

    // Remove the first spell
    const deletedSuccessfuly = await spellModel.removeSpellById(1);
    const storedSpells = await spellModel.getAllSpells();

    // Database should have one element in the array
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);

    expect(storedSpells[0].level).toBe(randomSpellToKeep.level)
    expect(storedSpells[0].name).toBe(randomSpellToKeep.name.toLowerCase())
    expect(storedSpells[0].description).toBe(randomSpellToKeep.description)

    expect(deletedSuccessfuly).toBe(true);
    
})

test('deleteSpellByName - Success Multiple Rows', async() => {
    const randomSpell = getRandomSpell();
    let randomSpellToKeep = getRandomSpell();

    // Keep getting new spells incase the same spell is generated twice
    while(randomSpellToKeep.name == randomSpell.name){
        randomSpellToKeep = getRandomSpell();
    }

    // Add a spell with the same name multiple times
    randomSpell.level = 9;
    await spellModel.addSpellFromValues(randomSpell.level, randomSpell.name, randomSpell.schoolId, randomSpell.description);
    await spellModel.addSpellFromValues((randomSpell.level + 1) % randomSpells.length, randomSpell.name, randomSpell.schoolId, randomSpell.description);
    await spellModel.addSpellFromValues((randomSpell.level + 2) % randomSpells.length, randomSpell.name, randomSpell.schoolId, randomSpell.description);
    await spellModel.addSpellFromValues(randomSpellToKeep.level, randomSpellToKeep.name, randomSpellToKeep.schoolId, randomSpellToKeep.description)

    const deletedRows = await spellModel.removeSpellsWithMatchingName(randomSpell.name);
    const storedSpells = await spellModel.getAllSpells();

    // Database should have an empty array
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);

    // 3 rows should be deleted
    expect(deletedRows).toBe(3);
    
})

test('deleteSpellByName - Fail no match', async() => {

    const spell = getRandomSpell();
    await spellModel.addSpellFromValues(spell.level, spell.name, spell.schoolId, spell.description);

    const deletedRows = await spellModel.removeSpellsWithMatchingName('name');
    const storedSpells = await spellModel.getAllSpells();

    // Database should have one row
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);

    // no rows should have been deleted
    expect(deletedRows).toBe(0);

});

test('deleteSpellByName - Fail invalid name', async() => {

    const spell = getRandomSpell();
    await spellModel.addSpellFromValues(spell.level, spell.name, spell.schoolId, spell.description);

    await expect(spellModel.removeSpellsWithMatchingName('')).rejects.toThrow(spellModel.InvalidInputError);
    const storedSpells = await spellModel.getAllSpells();

    // Database should have one row
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);


});

test('updateSpellById - Success update all values', async() => {

    const originalSpell = getRandomSpell();
    let newSpell = getRandomSpell();

    // Don't let the two spells be the same
    while (newSpell.name == originalSpell.name){
        newSpell = getRandomSpell();
    }

    await spellModel.addSpellFromValues(originalSpell.level, originalSpell.name, originalSpell.schoolId, originalSpell.description)

    // Update the spell to be the newSpell
    const successfullyUpdated = await spellModel.updateSpellById(1, newSpell.level, newSpell.name, newSpell.schoolId, newSpell.description)

    // Get the spells from the db
    const storedSpells = await spellModel.getAllSpells();

    // There is one spell in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);

    // Function returns true
    expect(successfullyUpdated).toBe(true);

    // Updated fields
    expect(storedSpells[0].level).toBe(newSpell.level)
    expect(storedSpells[0].name).toBe(newSpell.name.toLowerCase())
    expect(storedSpells[0].description).toBe(newSpell.description)

})

test('updateSpellById - Success null level', async() => {

    const originalSpell = getRandomSpell();
    let newSpell = getRandomSpell();

    // Don't let the two spells be the same
    while (newSpell.name == originalSpell.name){
        newSpell = getRandomSpell();
    }

    await spellModel.addSpellFromValues(originalSpell.level, originalSpell.name, originalSpell.schoolId, originalSpell.description)

    // Update the spell to be the newSpell
    const successfullyUpdated = await spellModel.updateSpellById(1, null, newSpell.name, newSpell.schoolId, newSpell.description)

    // Get the spells from the db
    const storedSpells = await spellModel.getAllSpells();

    // There is one spell in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);

    // Function returns true
    expect(successfullyUpdated).toBe(true);

    // Updated fields
    expect(storedSpells[0].level).toBe(originalSpell.level)
    expect(storedSpells[0].name).toBe(newSpell.name.toLowerCase())
    expect(storedSpells[0].description).toBe(newSpell.description)

})

test('updateSpellById - Success null name', async() => {

    const originalSpell = getRandomSpell();
    let newSpell = getRandomSpell();

    // Don't let the two spells be the same
    while (newSpell.name == originalSpell.name){
        newSpell = getRandomSpell();
    }

    await spellModel.addSpellFromValues(originalSpell.level, originalSpell.name, originalSpell.schoolId, originalSpell.description)

    // Update the spell to be the newSpell
    const successfullyUpdated = await spellModel.updateSpellById(1, newSpell.level, null, newSpell.schoolId, newSpell.description)

    // Get the spells from the db
    const storedSpells = await spellModel.getAllSpells();

    // There is one spell in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);

    // Function returns true
    expect(successfullyUpdated).toBe(true);

    // Updated fields
    expect(storedSpells[0].level).toBe(newSpell.level)
    expect(storedSpells[0].name).toBe(originalSpell.name.toLowerCase())
    expect(storedSpells[0].description).toBe(newSpell.description)

})

test('updateSpellById - Success null school', async() => {

    const originalSpell = getRandomSpell();
    let newSpell = getRandomSpell();

    // Don't let the two spells be the same
    while (newSpell.name == originalSpell.name){
        newSpell = getRandomSpell();
    }

    await spellModel.addSpellFromValues(originalSpell.level, originalSpell.name, originalSpell.schoolId, originalSpell.description)

    // Update the spell to be the newSpell
    const successfullyUpdated = await spellModel.updateSpellById(1, newSpell.level, newSpell.name, null, newSpell.description)

    // Get the spells from the db
    const storedSpells = await spellModel.getAllSpells();

    // There is one spell in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);

    // Function returns true
    expect(successfullyUpdated).toBe(true);

    // Updated fields
    expect(storedSpells[0].level).toBe(newSpell.level)
    expect(storedSpells[0].name).toBe(newSpell.name.toLowerCase())
    expect(storedSpells[0].description).toBe(newSpell.description)

})

test('updateSpellById - Success null description', async() => {

    const originalSpell = getRandomSpell();
    let newSpell = getRandomSpell();

    // Don't let the two spells be the same
    while (newSpell.name == originalSpell.name){
        newSpell = getRandomSpell();
    }

    await spellModel.addSpellFromValues(originalSpell.level, originalSpell.name, originalSpell.schoolId, originalSpell.description)

    // Update the spell to be the newSpell
    const successfullyUpdated = await spellModel.updateSpellById(1, newSpell.level, newSpell.name, newSpell.schoolId, null)

    // Get the spells from the db
    const storedSpells = await spellModel.getAllSpells();

    // There is one spell in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);

    // Function returns true
    expect(successfullyUpdated).toBe(true);

    // Updated fields
    expect(storedSpells[0].level).toBe(newSpell.level)
    expect(storedSpells[0].name).toBe(newSpell.name.toLowerCase())
    expect(storedSpells[0].description).toBe(originalSpell.description)

})

test('updateSpellById - Success multiple nulls', async() => {

    const originalSpell = getRandomSpell();
    let newSpell = getRandomSpell();

    // Don't let the two spells be the same
    while (newSpell.name == originalSpell.name){
        newSpell = getRandomSpell();
    }

    await spellModel.addSpellFromValues(originalSpell.level, originalSpell.name, originalSpell.schoolId, originalSpell.description)

    // Update the spell to be the newSpell
    const successfullyUpdated = await spellModel.updateSpellById(1, newSpell.level, null, null, null)

    // Get the spells from the db
    const storedSpells = await spellModel.getAllSpells();

    // There is one spell in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);

    // Function returns true
    expect(successfullyUpdated).toBe(true);

    // Updated fields
    expect(storedSpells[0].level).toBe(newSpell.level)
    expect(storedSpells[0].name).toBe(originalSpell.name.toLowerCase())
    expect(storedSpells[0].description).toBe(originalSpell.description)

})

test('updateSpellById - Fail all nulls', async() => {

    const originalSpell = getRandomSpell();
    let newSpell = getRandomSpell();

    // Don't let the two spells be the same
    while (newSpell.name == originalSpell.name){
        newSpell = getRandomSpell();
    }

    await spellModel.addSpellFromValues(originalSpell.level, originalSpell.name, originalSpell.schoolId, originalSpell.description)

    // Update the spell to be the newSpell
    await expect(spellModel.updateSpellById(1, null, null, null, null)).rejects.toThrow(spellModel.InvalidInputError);

    // Get the spells from the db
    const storedSpells = await spellModel.getAllSpells();

    // There is one spell in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);

    // Updated fields
    expect(storedSpells[0].level).toBe(originalSpell.level)
    expect(storedSpells[0].name).toBe(originalSpell.name.toLowerCase())
    expect(storedSpells[0].description).toBe(originalSpell.description)

})

test('updateSpellById - Fail id not found', async() => {

    const originalSpell = getRandomSpell();
    let newSpell = getRandomSpell();

    // Don't let the two spells be the same
    while (newSpell.name == originalSpell.name){
        newSpell = getRandomSpell();
    }

    await spellModel.addSpellFromValues(originalSpell.level, originalSpell.name, originalSpell.schoolId, originalSpell.description)

    // Update the spell to be the newSpell
    const successfulUpdate = await spellModel.updateSpellById(2, newSpell.level, null, null, null)

    // Get the spells from the db
    const storedSpells = await spellModel.getAllSpells();

    // Failed to update
    expect(successfulUpdate).toBe(false);

    // There is one spell in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);

    // Updated fields
    expect(storedSpells[0].level).toBe(originalSpell.level)
    expect(storedSpells[0].name).toBe(originalSpell.name.toLowerCase())
    expect(storedSpells[0].description).toBe(originalSpell.description)

})

test('updateSpellById - Fail invalid id', async() => {

    const originalSpell = getRandomSpell();
    let newSpell = getRandomSpell();

    // Don't let the two spells be the same
    while (newSpell.name == originalSpell.name){
        newSpell = getRandomSpell();
    }

    await spellModel.addSpellFromValues(originalSpell.level, originalSpell.name, originalSpell.schoolId, originalSpell.description)

    // Update the spell to be the newSpell
    await expect(spellModel.updateSpellById(-1, newSpell.level, null, null, null)).rejects.toThrow(spellModel.InvalidInputError);

    // Get the spells from the db
    const storedSpells = await spellModel.getAllSpells();

    // There is one spell in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);

    // Updated fields
    expect(storedSpells[0].level).toBe(originalSpell.level)
    expect(storedSpells[0].name).toBe(originalSpell.name.toLowerCase())
    expect(storedSpells[0].description).toBe(originalSpell.description)

})

test('updateSpellsByName - Success One Change', async() => {

    const originalSpell = getRandomSpell();
    let newSpell = getRandomSpell();

    // Don't let the two spells be the same
    while (newSpell.name == originalSpell.name){
        newSpell = getRandomSpell();
    }

    await spellModel.addSpellFromValues(originalSpell.level, originalSpell.name, originalSpell.schoolId, originalSpell.description)

    // Update the spell to be the newSpell
    const rowsChanged = await spellModel.updateSpellNames(originalSpell.name, newSpell.name)

    // Get the spells from the db
    const storedSpells = await spellModel.getAllSpells();

    // There is one spell in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);

    // Function changes one row
    expect(rowsChanged).toBe(1);

    // Updated fields
    expect(storedSpells[0].level).toBe(originalSpell.level)
    expect(storedSpells[0].name).toBe(newSpell.name.toLowerCase())
    expect(storedSpells[0].description).toBe(originalSpell.description)

})

test('updateSpellsByName - Success Multiple Changes', async() => {

    const originalSpell = getRandomSpell();
    let unchangedSpell = getRandomSpell();
    let newSpell = getRandomSpell();

    // Don't let the two spells be the same
    while (newSpell.name == originalSpell.name){
        newSpell = getRandomSpell();
    }

    while (unchangedSpell.name == originalSpell.name){
        unchangedSpell = getRandomSpell();
    }

    // Add spells
    await spellModel.addSpellFromValues(originalSpell.level, originalSpell.name, originalSpell.schoolId, originalSpell.description)
    await spellModel.addSpellFromValues((originalSpell.level + 1) % randomSpells.length, originalSpell.name, originalSpell.schoolId, originalSpell.description)
    await spellModel.addSpellFromValues((originalSpell.level + 2) % randomSpells.length, originalSpell.name, originalSpell.schoolId, originalSpell.description)
    await spellModel.addSpellFromValues(unchangedSpell.level, unchangedSpell.name, unchangedSpell.schoolId, unchangedSpell.description)

    // Update the spell to be the newSpell
    const rowsChanged = await spellModel.updateSpellNames(originalSpell.name, newSpell.name)

    // Get the spells from the db
    const storedSpells = await spellModel.getAllSpells();

    // There is one spell in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(4);

    // Function changes one row
    expect(rowsChanged).toBe(3);

    // Updated fields
    expect(storedSpells[0].level).toBe(originalSpell.level);
    expect(storedSpells[0].name).toBe(newSpell.name.toLowerCase());
    expect(storedSpells[0].description).toBe(originalSpell.description);

    expect(storedSpells[1].level).toBe((originalSpell.level + 1) % randomSpells.length);
    expect(storedSpells[1].name).toBe(newSpell.name.toLowerCase());
    expect(storedSpells[1].description).toBe(originalSpell.description);

    expect(storedSpells[2].level).toBe((originalSpell.level + 2) % randomSpells.length);
    expect(storedSpells[2].name).toBe(newSpell.name.toLowerCase());
    expect(storedSpells[2].description).toBe(originalSpell.description);

    expect(storedSpells[3].level).toBe(unchangedSpell.level);
    expect(storedSpells[3].name).toBe(unchangedSpell.name.toLowerCase());
    expect(storedSpells[3].description).toBe(unchangedSpell.description);

})

test('updateSpellsByName - Name not found', async() => {

    const originalSpell = getRandomSpell();
    let newSpell = getRandomSpell();

    // Don't let the two spells be the same
    while (newSpell.name == originalSpell.name){
        newSpell = getRandomSpell();
    }

    await spellModel.addSpellFromValues(originalSpell.level, originalSpell.name, originalSpell.schoolId, originalSpell.description)

    // Update the spell to be the newSpell
    const rowsChanged = await spellModel.updateSpellNames(originalSpell.name + 'Not Present', newSpell.name)

    // Get the spells from the db
    const storedSpells = await spellModel.getAllSpells();

    // There is one spell in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);

    // Function changes one row
    expect(rowsChanged).toBe(0);

    // Nothing should be updated
    expect(storedSpells[0].level).toBe(originalSpell.level)
    expect(storedSpells[0].name).toBe(originalSpell.name.toLowerCase())
    expect(storedSpells[0].description).toBe(originalSpell.description)

})

test('updateSpellsByName - Fail invalid search name', async() => {

    const originalSpell = getRandomSpell();
    let newSpell = getRandomSpell();

    // Don't let the two spells be the same
    while (newSpell.name == originalSpell.name){
        newSpell = getRandomSpell();
    }

    await spellModel.addSpellFromValues(originalSpell.level, originalSpell.name, originalSpell.schoolId, originalSpell.description)

    // Update the spell to be the newSpell
    await expect(spellModel.updateSpellNames('', newSpell.name)).rejects.toThrow(spellModel.InvalidInputError)

    // Get the spells from the db
    const storedSpells = await spellModel.getAllSpells();

    // There is one spell in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);

    // Nothing should be updated
    expect(storedSpells[0].level).toBe(originalSpell.level)
    expect(storedSpells[0].name).toBe(originalSpell.name.toLowerCase())
    expect(storedSpells[0].description).toBe(originalSpell.description)

})

test('updateSpellsByName - Fail invalid replacement name', async() => {

    const originalSpell = getRandomSpell();
    let newSpell = getRandomSpell();

    // Don't let the two spells be the same
    while (newSpell.name == originalSpell.name){
        newSpell = getRandomSpell();
    }

    await spellModel.addSpellFromValues(originalSpell.level, originalSpell.name, originalSpell.schoolId, originalSpell.description)

    // Update the spell to be the newSpell
    await expect(spellModel.updateSpellNames(originalSpell.name, '')).rejects.toThrow(spellModel.InvalidInputError)

    // Get the spells from the db
    const storedSpells = await spellModel.getAllSpells();

    // There is one spell in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);

    // Nothing should be updated
    expect(storedSpells[0].level).toBe(originalSpell.level)
    expect(storedSpells[0].name).toBe(originalSpell.name.toLowerCase())
    expect(storedSpells[0].description).toBe(originalSpell.description)

})

test('updateSpellsByName - Fail number in replacement name', async() => {

    const originalSpell = getRandomSpell();
    let newSpell = getRandomSpell();

    // Don't let the two spells be the same
    while (newSpell.name == originalSpell.name){
        newSpell = getRandomSpell();
    }

    await spellModel.addSpellFromValues(originalSpell.level, originalSpell.name, originalSpell.schoolId, originalSpell.description)

    // Update the spell to be the newSpell
    await expect(spellModel.updateSpellNames(originalSpell.name, 'aa3aa')).rejects.toThrow(spellModel.InvalidInputError)

    // Get the spells from the db
    const storedSpells = await spellModel.getAllSpells();

    // There is one spell in the db
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);

    // Nothing should be updated
    expect(storedSpells[0].level).toBe(originalSpell.level)
    expect(storedSpells[0].name).toBe(originalSpell.name.toLowerCase())
    expect(storedSpells[0].description).toBe(originalSpell.description)

})

test('getSpellById - Success', async () => {

    const spellInSlot1 = getRandomSpell();
    let spellInSlot2 = getRandomSpell();

    while(spellInSlot2.name == spellInSlot1.name){
        spellInSlot2 = getRandomSpell();
    }

    await spellModel.addSpell(spellInSlot1);
    await spellModel.addSpell(spellInSlot2);

    const returnedSpell = await spellModel.getSpellById(2);

    // Returned spell should be spellInSlot2
    expect(returnedSpell.id).toBe(2);
    expect(returnedSpell.level).toBe(spellInSlot2.level)
    expect(returnedSpell.name).toBe(spellInSlot2.name.toLowerCase())
    expect(returnedSpell.description).toBe(spellInSlot2.description)

})

test('getSpellById - Fail id not found', async () => {
    const spellInSlot1 = getRandomSpell();
    let spellInSlot2 = getRandomSpell();

    while(spellInSlot1.name == spellInSlot2.name){
        spellInSlot2 = getRandomSpell();
    }

    await spellModel.addSpell(spellInSlot1);
    await spellModel.addSpell(spellInSlot2);

    const returnedSpell = await spellModel.getSpellById(3);

    // Returned spell should be spellInSlot2
    expect(returnedSpell).toBe(null);

    // DB should stay the same
    const storedSpells = await spellModel.getAllSpells()
    expect(storedSpells.length).toBe(2)
})

test('getSpellById - Fail invalid id', async () => {
    const spellInSlot1 = getRandomSpell();
    let spellInSlot2 = getRandomSpell();

    while(spellInSlot2.name == spellInSlot1.name){
        spellInSlot2 = getRandomSpell();
    }

    await spellModel.addSpell(spellInSlot1);
    await spellModel.addSpell(spellInSlot2);

    // Should throw
    await expect(spellModel.getSpellById(-1)).rejects.toThrow(spellModel.InvalidInputError);

    // DB should stay the same
    const storedSpells = await spellModel.getAllSpells()
    expect(storedSpells.length).toBe(2)

})

test('getSpellsWithSpecifications - Success', async () => {
    const randomSpell = getRandomSpell()
    let randomSpellToNotGet = getRandomSpell();

    while(randomSpellToNotGet.schoolId == randomSpell.schoolId){
        randomSpellToNotGet = getRandomSpell();
    }

    // Add the same spell 4 times with different levels
    await spellModel.addSpell(randomSpell);
    randomSpell.level = (randomSpell.level + 1) % randomSpells.length;
    await spellModel.addSpell(randomSpell);
    randomSpell.level = (randomSpell.level + 1) % randomSpells.length;
    await spellModel.addSpell(randomSpell);
    randomSpell.level = (randomSpell.level + 1) % randomSpells.length;
    await spellModel.addSpell(randomSpell);

    // Add one spell to not get
    await spellModel.addSpell(randomSpellToNotGet);

    const queriedSpells = await spellModel.getSpellsWithSpecifications(randomSpell.level, randomSpell.name, randomSpell.schoolId);

    // Is array with length 1
    expect(Array.isArray(queriedSpells)).toBe(true);
    expect(queriedSpells.length).toBe(1);

    // Contains the last version of the spell
    expect(queriedSpells[0].id).toBe(4);
    expect(queriedSpells[0].level).toBe(randomSpell.level);
    expect(queriedSpells[0].name).toBe(randomSpell.name.toLowerCase());
    expect(queriedSpells[0].description).toBe(randomSpell.description);

})

test('getSpellsWithSpecifications - Success one null', async () => {
    const randomSpell = getRandomSpell()
    let randomSpellToNotGet = getRandomSpell();

    while(randomSpellToNotGet.schoolId == randomSpell.schoolId){
        randomSpellToNotGet = getRandomSpell();
    }

    // Add the same spell 4 times with different levels
    await spellModel.addSpell(randomSpell);
    const startingLevel = randomSpell.level;
    randomSpell.level = (randomSpell.level + 1) % randomSpells.length;
    await spellModel.addSpell(randomSpell);
    randomSpell.level = (randomSpell.level + 1) % randomSpells.length;
    await spellModel.addSpell(randomSpell);
    randomSpell.level = (randomSpell.level + 1) % randomSpells.length;
    await spellModel.addSpell(randomSpell);

    // Add one spell to not get
    await spellModel.addSpell(randomSpellToNotGet);

    const queriedSpells = await spellModel.getSpellsWithSpecifications(null, randomSpell.name, randomSpell.schoolId);

    // Is array with length 1
    expect(Array.isArray(queriedSpells)).toBe(true);
    expect(queriedSpells.length).toBe(4);

    // Contains every spell generated from randomSpell
    for (let i = 0; i < 4; i++){
        expect(queriedSpells[i].id).toBe(i+1);
        expect(queriedSpells[i].level).toBe((startingLevel + i) % randomSpells.length);
        expect(queriedSpells[i].name).toBe(randomSpell.name.toLowerCase());
        expect(queriedSpells[i].description).toBe(randomSpell.description);
    }
})

test('getSpellsWithSpecifications - Success multiple nulls', async () => {
    const evocationSpell1 = {level: 0, name: 'Acid Splash', schoolId: 1, description: 'Splashes some acid on someone - Ranged spell attack (1d6 acid damage).'}
    const evocationSpell2 = {level: 2, name: 'Acid Arrow', schoolId: 1, description: 'A shimmering green arrow streaks toward a target within range and bursts in a spray of acid. Make a ranged spell attack against the target. On a hit, the target takes 4d4 acid damage immediately and 2d4 acid damage at the end of its next turn.'}

    const abjurationSpell = {level: 1, name: 'Absorb Elements', schoolId: 2, description: 'The spell captures some of the incoming energy, lessening its effect on you and storing it for your next melee attack. You have resistance to the triggering damage type until the start of your next turn. Also, the first time you hit with a melee attack on your next turn, the target takes an extra 1d6 damage of the triggering type, and the spell ends.'}
    
    // Add one spell to not get
    await spellModel.addSpell(evocationSpell1);
    await spellModel.addSpell(evocationSpell2);
    await spellModel.addSpell(abjurationSpell);

    const queriedSpells = await spellModel.getSpellsWithSpecifications(null, null, 1);

    // Is array with length 1
    expect(Array.isArray(queriedSpells)).toBe(true);
    expect(queriedSpells.length).toBe(2);

    // Contains both evocation spells
    expect(queriedSpells[0].id).toBe(1);
    expect(queriedSpells[0].level).toBe(evocationSpell1.level);
    expect(queriedSpells[0].name).toBe(evocationSpell1.name.toLowerCase());
    expect(queriedSpells[0].description).toBe(evocationSpell1.description);

    expect(queriedSpells[1].id).toBe(2);
    expect(queriedSpells[1].level).toBe(evocationSpell2.level);
    expect(queriedSpells[1].name).toBe(evocationSpell2.name.toLowerCase());
    expect(queriedSpells[1].description).toBe(evocationSpell2.description);

})

test('getSpellsWithSpecifications - Success all arguments null', async () => {
    
    const randomSpell = getRandomSpell();
    await spellModel.addSpell(randomSpell);

    // Throws error
    const filteredSpells = await spellModel.getSpellsWithSpecifications(null, null, null);

    // Database is unchanged
    expect(Array.isArray(filteredSpells)).toBe(true);
    expect(filteredSpells.length).toBe(1);
    expect(filteredSpells[0].level).toBe(randomSpell.level);
    expect(filteredSpells[0].name).toBe(randomSpell.name.toLowerCase());
    expect(filteredSpells[0].description).toBe(randomSpell.description);

})

test('getSpellsWithSpecifications - Fail nothing matches criteria', async () => {
    const randomSpell = getRandomSpell();
    await spellModel.addSpell(randomSpell);

    // Throws error
    const matches = await spellModel.getSpellsWithSpecifications(null, randomSpell.name + 'Not the same', null);

    const storedSpells = await spellModel.getAllSpells();

    // No Matches
    expect(Array.isArray(matches)).toBe(true);
    expect(matches.length).toBe(0);

    // Database is unchanged
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);
    expect(storedSpells[0].level).toBe(randomSpell.level);
    expect(storedSpells[0].name).toBe(randomSpell.name.toLowerCase());
    expect(storedSpells[0].description).toBe(randomSpell.description);
})

test('getSpellsWithSpecifications - Fail invalid input', async () => {
    const randomSpell = getRandomSpell();
    await spellModel.addSpell(randomSpell);

    // Throws error
    await expect(spellModel.getSpellsWithSpecifications(-1, null, null)).rejects.toThrow(spellModel.InvalidInputError);

    const storedSpells = await spellModel.getAllSpells();

    // Database is unchanged
    expect(Array.isArray(storedSpells)).toBe(true);
    expect(storedSpells.length).toBe(1);
    expect(storedSpells[0].level).toBe(randomSpell.level);
    expect(storedSpells[0].name).toBe(randomSpell.name.toLowerCase());
    expect(storedSpells[0].description).toBe(randomSpell.description);
})

test('getAllSpells - Success', async () => {

    const spell1 = getRandomSpell();
    let spell2 = getRandomSpell();

    while(spell1.name == spell2.name){
        spell2 = getRandomSpell();
    }

    await spellModel.addSpell(spell1);
    await spellModel.addSpell(spell2);

    const allSpells = await spellModel.getAllSpells();

    // allSpells is an array of length 2
    expect(Array.isArray(allSpells)).toBe(true);
    expect(allSpells.length).toBe(2);

    // Spells are the same as the ones generated
    expect(allSpells[0].id).toBe(1);
    expect(allSpells[0].level).toBe(spell1.level);
    expect(allSpells[0].name).toBe(spell1.name.toLowerCase());
    expect(allSpells[0].description).toBe(spell1.description);

    expect(allSpells[1].id).toBe(2);
    expect(allSpells[1].level).toBe(spell2.level);
    expect(allSpells[1].name).toBe(spell2.name.toLowerCase());
    expect(allSpells[1].description).toBe(spell2.description);

})

test('getAllSpells - Empty database', async () => {
    
    const allSpells = await spellModel.getAllSpells();

    // allSpells is an array of length 2
    expect(Array.isArray(allSpells)).toBe(true);
    expect(allSpells.length).toBe(0);

})