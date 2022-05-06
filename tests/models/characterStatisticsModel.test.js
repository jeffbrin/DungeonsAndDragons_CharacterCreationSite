const characterStatsModel = require('../../models/characterStatisticsModel');
const fs = require('fs/promises');

async function getAbilityNamesFromJsonFile(){
    const abilities = JSON.parse(await fs.readFile('database-content-json/abilities.json'));
    return abilities;
}

async function getSkillsFromJsonFile(){
    const skills = JSON.parse(await fs.readFile('database-content-json/skills.json'));
    return skills;
}

const dbName = 'dnd_db_testing';
// Initialize the database before each test.
beforeEach(async () => {
    try{
    await characterStatsModel.initialize(dbName);   
    await characterStatsModel.dropTables();
    await characterStatsModel.createTables();
    }catch(error){
        console.error(error);
    }
});

// Close the database connection after each test to prevent open handles error.
afterEach(async () => {
    await characterStatsModel.closeConnection();
});

test('getAllSkills - Success - Returns all skills in the json file in order.', async () => {

    const skills = await getSkillsFromJsonFile();
    const databaseSkills = await characterStatsModel.getAllSkills();

    // Make sure each skill is the same in the right order
    for(let i = 0; i < skills.length; i++){
        expect(skills[i].Name).toBe(databaseSkills[i].Name);
        expect(skills[i].Ability).toBe(databaseSkills[i].Ability.Name);
    }

})

test('getAllAbilities - Success - Returns all abilities in the json file in order.', async () => {

    const abilities = await getAbilityNamesFromJsonFile();
    const databaseSkills = await characterStatsModel.getAllAbilities();

    // Make sure each ability is the same in the right order
    for(let i = 0; i < abilities.length; i++){
        expect(abilities[i]).toBe(databaseSkills[i].Name);
    }

})