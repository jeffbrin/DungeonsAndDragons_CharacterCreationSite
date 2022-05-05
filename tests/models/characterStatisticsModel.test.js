// const characterStatsModel = require('../models/characterStatisticsModel');
// const fs = require('fs/promises');

// async function getAbilityNamesFromJsonFile(){
//     const abilities = JSON.parse(fs.readFile('database-content-json/abilities.json'));
//     return abilities;
// }

// async function getSkillsFromJsonFile(){
    
// }

// // Initialize the database before each test.
// beforeEach(async () => {
//     await characterStatsModel.initialize(dbName);   
//     await characterStatsModel.dropTables();
//     await characterStatsModel.createTables();
// });

// // Close the database connection after each test to prevent open handles error.
// afterEach(async () => {
//     await characterStatsModel.closeConnection();
// });

// test('getAllAbilities - Success - Returns all abilities in the json file.', async () => {

//     const abilities = await getAbilityNamesFromJsonFile();
//     console.log(abilities);

// })