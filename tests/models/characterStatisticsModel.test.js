const characterStatsModel = require('../../models/characterStatisticsModel');
const characterModel = require('../../models/characterModel');
const spellModel = require('../../models/spellModel');
const backgroundModel = require('../../models/backgroundModel');
const classModel = require('../../models/classModel');
const raceModel = require('../../models/raceModel');
const fs = require('fs/promises');
const dbName = 'dnd_db_testing';

async function getAbilityNamesFromJsonFile(){
    const abilities = JSON.parse(await fs.readFile('database-content-json/abilities.json'));
    return abilities;
}

async function getSkillsFromJsonFile(){
    
}

// Initialize the database before each test.
beforeEach(async () => {
    await classModel.initialize(dbName, true);
    await backgroundModel.initialize(dbName, true);
    await raceModel.initialize(dbName, true);
    await spellModel.initialize(dbName, true);
    await characterModel.initialize(dbName, true);
    await characterStatsModel.initialize(dbName);   
    await characterStatsModel.dropTables();
    await characterStatsModel.createTables();
});

// Close the database connection after each test to prevent open handles error.
afterEach(async () => {
    await classModel.closeConnection();
    await raceModel.closeConnection();
    await backgroundModel.closeConnection();
    await spellModel.closeConnection();
    await characterStatsModel.closeConnection();
    await characterModel.closeConnection();
});

test('getAllAbilities - Success - Returns all abilities in the json file.', async () => {

    const abilities = await getAbilityNamesFromJsonFile();
    console.log(abilities);

})