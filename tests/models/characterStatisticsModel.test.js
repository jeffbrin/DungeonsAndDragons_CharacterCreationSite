const characterStatsModel = require('../../models/characterStatisticsModel');
const characterModel = require('../../models/characterModel');
const spellModel = require('../../models/spellModel');
const backgroundModel = require('../../models/backgroundModel');
const classModel = require('../../models/classModel');
const raceModel = require('../../models/raceModel');
const fs = require('fs/promises');
const dbName = 'dnd_db_testing';
const {DatabaseError} = require('../../models/errorModel');

async function getAbilityNamesFromJsonFile(){
    const abilities = JSON.parse(await fs.readFile('database-content-json/abilities.json'));
    return abilities;
}

async function getSkillsFromJsonFile(){
    const skills = JSON.parse(await fs.readFile('database-content-json/skills.json'));
    return skills;
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

// Get all skills
test('getAllSkills - Success - Returns all skills in the json file in order.', async () => {

    const skills = await getSkillsFromJsonFile();
    const databaseSkills = await characterStatsModel.getAllSkills();

    // Make sure each skill is the same in the right order
    for(let i = 0; i < skills.length; i++){
        expect(skills[i].Name).toBe(databaseSkills[i].Name);
        expect(skills[i].Ability).toBe(databaseSkills[i].Ability.Name);
    }

})

test('getAllSkill - Failure - Closed database connection.', async () => {

    await characterStatsModel.closeConnection();
    await expect(characterStatsModel.getAllSkills()).rejects.toThrow(DatabaseError);

})

// Get all abilities
test('getAllAbilities - Success - Returns all abilities in the json file in order.', async () => {

    const abilities = await getAbilityNamesFromJsonFile();
    const databaseSkills = await characterStatsModel.getAllAbilities();

    // Make sure each ability is the same in the right order
    for(let i = 0; i < abilities.length; i++){
        expect(abilities[i]).toBe(databaseSkills[i].Name);
    }

})

test('getAllAbilities - Failure - Closed database connection.', async () => {

    await characterStatsModel.closeConnection();
    await expect(characterStatsModel.getAllAbilities()).rejects.toThrow(DatabaseError);

})


// Set ability scores
test('setAbilityScores - Success - Sets ability scores for character', async () => {

    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1);
    const character = await characterModel.getCharacter(1);



})

test('setAbilityScores - Failure - Closed database connection.', async () => {

    await characterStatsModel.closeConnection();
    await expect(characterStatsModel.getAllAbilities()).rejects.toThrow(DatabaseError);

})

// // Add skill proficiency
//     addSkillProficiency,
    
// // Add skill expertise
//     addSkillExpertise,
    
// // Add saving throw proficiency
//     addSavingThrowProficiency,

// // Set saving throw bonus
//     setSavingThrowBonus,

// // Get skill proficiencies
//     getSkillProficiencies,

// // Get saving throw bonuses
//     getSavingThrowBonuses,

// // Get saving throw proficiencies
//     getSavingThrowProficiencies,

// // Get skill expertise
//     getSkillExpertise