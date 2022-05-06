const userModel = require('../../models/userModel')
const characterStatsModel = require('../../models/characterStatisticsModel');
const characterModel = require('../../models/characterModel');
const spellModel = require('../../models/spellModel');
const backgroundModel = require('../../models/backgroundModel');
const classModel = require('../../models/classModel');
const raceModel = require('../../models/raceModel');
const fs = require('fs/promises');
const dbName = 'dnd_db_testing';
const {DatabaseError, InvalidInputError} = require('../../models/errorModel');

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
    await userModel.initialize(dbName, true);
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
    await userModel.closeConnection();
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

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    const scores = [20, 19, 18, 17, 16, 15];
    await characterStatsModel.setAbilityScores(1, scores);

    const abilityScores = await characterStatsModel.getAbilityScores(1);

    for(let i = 0; i < abilityScores.length; i++){
        expect(abilityScores[i].Score).toBe(scores[i])
    }

})

test('setAbilityScores - Failure invalid character id', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    const scores = [20, 19, 18, 17, 16, 15];
    await expect(characterStatsModel.setAbilityScores(-10, scores)).rejects.toThrow(InvalidInputError);

})

test('setAbilityScores - Failure invalid ability scores length', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    const scores = [20, 19, 18, 17, 16, 15, 20];
    await expect(characterStatsModel.setAbilityScores(1, scores)).rejects.toThrow(InvalidInputError);

})

test('setAbilityScores - Failure - Closed database connection.', async () => {

    await characterStatsModel.closeConnection();
    await expect(characterStatsModel.getAllAbilities()).rejects.toThrow(DatabaseError);

})

// Add skill proficiency
test('addSkillProfiency - Success - Sets a skill proficiency for character', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await characterStatsModel.addSkillExpertise(1, 3);
    await characterStatsModel.addSkillExpertise(1,1);
    await characterStatsModel.addSkillProficiency(1, 7);
    await characterStatsModel.addSkillProficiency(1, 1);
    await characterStatsModel.addSkillProficiency(1, 5);

    const skillProficiencies = await characterStatsModel.getSkillProficiencies(1);
    const skillExpertise = await characterStatsModel.getSkillExpertise(1);

    expect(skillProficiencies[0]).toBe(1);
    expect(skillProficiencies[1]).toBe(5);
    expect(skillProficiencies[2]).toBe(7);

    // Deletes expertise
    expect(skillExpertise[0]).toBe(3);
    expect(skillExpertise.length).toBe(1);

})

test('addSkillProfiency - Failure - Invalid character id', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await expect(characterStatsModel.addSkillProficiency(-10, 7)).rejects.toThrow(InvalidInputError);
    await expect(characterStatsModel.addSkillProficiency(100, 4)).rejects.toThrow(InvalidInputError);

})

test('addSkillProfiency - Failure - Invalid skill id', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await expect(characterStatsModel.addSkillProficiency(1, 0)).rejects.toThrow(InvalidInputError);
    await expect(characterStatsModel.addSkillProficiency(1, 100)).rejects.toThrow(InvalidInputError);

})
    
test('addSkillProfiency - Failure - Closed database connection', async () => {

    characterStatsModel.closeConnection();
    await expect(characterStatsModel.addSkillProficiency(1, 1)).rejects.toThrow(DatabaseError);

})

// Add skill expertise
test('addSkillExpertise - Success - Sets a skill expertise for character', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await characterStatsModel.addSkillProficiency(1, 3);
    await characterStatsModel.addSkillProficiency(1, 1);
    await characterStatsModel.addSkillExpertise(1, 7);
    await characterStatsModel.addSkillExpertise(1, 1);
    await characterStatsModel.addSkillExpertise(1, 5);

    const skillProficiencies = await characterStatsModel.getSkillProficiencies(1);
    const skillExpertise = await characterStatsModel.getSkillExpertise(1);

    expect(skillExpertise[0]).toBe(1);
    expect(skillExpertise[1]).toBe(5);
    expect(skillExpertise[2]).toBe(7);

    // Deletes expertise
    expect(skillProficiencies[0]).toBe(3);
    expect(skillProficiencies.length).toBe(1);

})

test('addSkillExpertise - Failure - Invalid character id', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await expect(characterStatsModel.addSkillExpertise(-10, 7)).rejects.toThrow(InvalidInputError);
    await expect(characterStatsModel.addSkillExpertise(100, 4)).rejects.toThrow(InvalidInputError);

})

test('addSkillExpertise - Failure - Invalid skill id', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await expect(characterStatsModel.addSkillExpertise(1, 0)).rejects.toThrow(InvalidInputError);
    await expect(characterStatsModel.addSkillExpertise(1, 100)).rejects.toThrow(InvalidInputError);

})
    
test('addSkillExpertise - Failure - Closed database connection', async () => {

    characterStatsModel.closeConnection();
    await expect(characterStatsModel.addSkillExpertise(1, 1)).rejects.toThrow(DatabaseError);

})
    
// Add saving throw proficiency
test('addSavingThrowProficiency - Success - Sets a saving throw proficiency for character', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await characterStatsModel.addSavingThrowProficiency(1, 3);
    await characterStatsModel.addSavingThrowProficiency(1, 1);
    await characterStatsModel.addSavingThrowProficiency(1, 5);

    const savingThrowProficiency = await characterStatsModel.getSavingThrowProficiencies(1);

    expect(savingThrowProficiency[0]).toBe(1);
    expect(savingThrowProficiency[1]).toBe(3);
    expect(savingThrowProficiency[2]).toBe(5);


})

test('addSavingThrowProficiency - Failure - Invalid character id', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await expect(characterStatsModel.addSavingThrowProficiency(-10, 7)).rejects.toThrow(InvalidInputError);
    await expect(characterStatsModel.addSavingThrowProficiency(100, 4)).rejects.toThrow(InvalidInputError);

})

test('addSavingThrowProficiency - Failure - Invalid skill id', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await expect(characterStatsModel.addSavingThrowProficiency(1, 0)).rejects.toThrow(InvalidInputError);
    await expect(characterStatsModel.addSavingThrowProficiency(1, 100)).rejects.toThrow(InvalidInputError);

})
    
test('addSavingThrowProficiency - Failure - Closed database connection', async () => {

    characterStatsModel.closeConnection();
    await expect(characterStatsModel.addSavingThrowProficiency(1, 1)).rejects.toThrow(DatabaseError);

})

// Set saving throw bonus
test('setSavingThrowBonus - Success - Sets a saving throw bonus for character', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await characterStatsModel.setSavingThrowBonus(1, 3, 10);
    await characterStatsModel.setSavingThrowBonus(1, 1, 3);
    await characterStatsModel.setSavingThrowBonus(1, 5, -2);

    const savingThrowBonuses = await characterStatsModel.getSavingThrowBonuses(1);

    expect(savingThrowBonuses[0].Bonus).toBe(3);
    expect(savingThrowBonuses[1].Bonus).toBe(10);
    expect(savingThrowBonuses[2].Bonus).toBe(-2);


})

test('setSavingThrowBonus - Failure - Invalid character id', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await expect(characterStatsModel.setSavingThrowBonus(-10, 7)).rejects.toThrow(InvalidInputError);
    await expect(characterStatsModel.setSavingThrowBonus(100, 4)).rejects.toThrow(InvalidInputError);

})

test('setSavingThrowBonus - Failure - Invalid skill id', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await expect(characterStatsModel.setSavingThrowBonus(1, 0)).rejects.toThrow(InvalidInputError);
    await expect(characterStatsModel.setSavingThrowBonus(1, 100)).rejects.toThrow(InvalidInputError);

})
    
test('setSavingThrowBonus - Failure - Closed database connection', async () => {

    characterStatsModel.closeConnection();
    await expect(characterStatsModel.setSavingThrowBonus(1, 1)).rejects.toThrow(DatabaseError);

})

// Get skill proficiencies
test('getSkillProficiencies - Success - Gets all skill proficiencies for character', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await characterStatsModel.addSkillProficiency(1, 3);
    await characterStatsModel.addSkillProficiency(1, 1);
    await characterStatsModel.addSkillProficiency(1, 5);

    const savingThrowProficiency = await characterStatsModel.getSkillProficiencies(1);

    expect(savingThrowProficiency[0]).toBe(1);
    expect(savingThrowProficiency[1]).toBe(3);
    expect(savingThrowProficiency[2]).toBe(5);


})

test('getSkillProficiencies - Failure - Invalid character id', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await expect(characterStatsModel.getSkillProficiencies(-10)).rejects.toThrow(InvalidInputError);
    await expect(characterStatsModel.getSkillProficiencies(100)).rejects.toThrow(InvalidInputError);

})
    
test('getSkillProficiencies - Failure - Closed database connection', async () => {

    characterStatsModel.closeConnection();
    await expect(characterStatsModel.getSkillProficiencies(1, 1)).rejects.toThrow(DatabaseError);

})

// Get skill expertise
test('getSkillExpertise - Success - Gets all skill proficiencies for character', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await characterStatsModel.addSkillExpertise(1, 3);
    await characterStatsModel.addSkillExpertise(1, 1);
    await characterStatsModel.addSkillExpertise(1, 5);

    const skillExpertise = await characterStatsModel.getSkillExpertise(1);

    expect(skillExpertise[0]).toBe(1);
    expect(skillExpertise[1]).toBe(3);
    expect(skillExpertise[2]).toBe(5);


})

test('getSkillExpertise - Failure - Invalid character id', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await expect(characterStatsModel.getSkillExpertise(-10)).rejects.toThrow(InvalidInputError);
    await expect(characterStatsModel.getSkillExpertise(100)).rejects.toThrow(InvalidInputError);

})
    
test('getSkillExpertise - Failure - Closed database connection', async () => {

    characterStatsModel.closeConnection();
    await expect(characterStatsModel.getSkillExpertise(1, 1)).rejects.toThrow(DatabaseError);

})

// Get saving throw bonuses
test('getSavingThrowBonuses - Success - Gets all saving throw bonuses for character', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await characterStatsModel.setSavingThrowBonus(1, 3, 10);
    await characterStatsModel.setSavingThrowBonus(1, 1, 4);
    await characterStatsModel.setSavingThrowBonus(1, 5, 12);

    const savingThrowBonuses = await characterStatsModel.getSavingThrowBonuses(1);

    expect(savingThrowBonuses[0].Bonus).toBe(4);
    expect(savingThrowBonuses[1].Bonus).toBe(10);
    expect(savingThrowBonuses[2].Bonus).toBe(12);


})

test('getSavingThrowBonuses - Failure - Invalid character id', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await expect(characterStatsModel.getSavingThrowBonuses(-10)).rejects.toThrow(InvalidInputError);
    await expect(characterStatsModel.getSavingThrowBonuses(100)).rejects.toThrow(InvalidInputError);

})
    
test('getSavingThrowBonuses - Failure - Closed database connection', async () => {

    characterStatsModel.closeConnection();
    await expect(characterStatsModel.getSavingThrowBonuses(1, 1)).rejects.toThrow(DatabaseError);

})

// Get saving throw proficiencies
test('getSavingThrowProficiencies - Success - Gets all saving throw proficiencies for character', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await characterStatsModel.addSavingThrowProficiency(1, 3);
    await characterStatsModel.addSavingThrowProficiency(1, 1);
    await characterStatsModel.addSavingThrowProficiency(1, 5);

    const savingThrowBonuses = await characterStatsModel.getSavingThrowProficiencies(1);

    expect(savingThrowBonuses[0]).toBe(1);
    expect(savingThrowBonuses[1]).toBe(3);
    expect(savingThrowBonuses[2]).toBe(5);


})

test('getSavingThrowProficiencies - Failure - Invalid character id', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await expect(characterStatsModel.getSavingThrowProficiencies(-10)).rejects.toThrow(InvalidInputError);
    await expect(characterStatsModel.getSavingThrowProficiencies(100)).rejects.toThrow(InvalidInputError);

})
    
test('getSavingThrowProficiencies - Failure - Closed database connection', async () => {

    characterStatsModel.closeConnection();
    await expect(characterStatsModel.getSavingThrowProficiencies(1, 1)).rejects.toThrow(DatabaseError);

})


// remove skill proficiencies
test('removeSkillProficiency - Success - removes all skill proficiencies for character', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await characterStatsModel.addSkillProficiency(1, 3);
    await characterStatsModel.addSkillProficiency(1, 1);
    await characterStatsModel.addSkillProficiency(1, 5);

    await characterStatsModel.removeSkillProficiency(1, 3);
    const savingThrowProficiency = await characterStatsModel.getSkillProficiencies(1);

    expect(savingThrowProficiency[0]).toBe(1);
    expect(savingThrowProficiency[1]).toBe(5);


})

test('removeSkillProficiency - Failure - Invalid character id', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await expect(characterStatsModel.removeSkillProficiency(-10)).rejects.toThrow(InvalidInputError);
    await expect(characterStatsModel.removeSkillProficiency(100)).rejects.toThrow(InvalidInputError);

})
    
test('removeSkillProficiency - Failure - Closed database connection', async () => {

    characterStatsModel.closeConnection();
    await expect(characterStatsModel.removeSkillProficiency(1, 1)).rejects.toThrow(DatabaseError);

})

// remove skill expertise
test('removeSkillExpertise - Success - removes all skill proficiencies for character', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await characterStatsModel.addSkillExpertise(1, 3);
    await characterStatsModel.addSkillExpertise(1, 1);
    await characterStatsModel.addSkillExpertise(1, 5);

    await characterStatsModel.removeSkillExpertise(1, 3);
    const skillExpertise = await characterStatsModel.getSkillExpertise(1);

    expect(skillExpertise[0]).toBe(1);
    expect(skillExpertise[1]).toBe(5);


})

test('removeSkillExpertise - Failure - Invalid character id', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await expect(characterStatsModel.removeSkillExpertise(-10)).rejects.toThrow(InvalidInputError);
    await expect(characterStatsModel.removeSkillExpertise(100)).rejects.toThrow(InvalidInputError);

})
    
test('removeSkillExpertise - Failure - Closed database connection', async () => {

    characterStatsModel.closeConnection();
    await expect(characterStatsModel.removeSkillExpertise(1, 1)).rejects.toThrow(DatabaseError);

})

// remove saving throw proficiencies
test('removeSavingThrowProficiency - Success - removes all saving throw proficiencies for character', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await characterStatsModel.addSavingThrowProficiency(1, 3);
    await characterStatsModel.addSavingThrowProficiency(1, 1);
    await characterStatsModel.addSavingThrowProficiency(1, 5);

    await characterStatsModel.removeSavingThrowProficiency(1, 3);
    const savingThrowBonuses = await characterStatsModel.getSavingThrowProficiencies(1);

    expect(savingThrowBonuses[0]).toBe(1);
    expect(savingThrowBonuses[1]).toBe(5);


})

test('removeSavingThrowProficiency - Failure - Invalid character id', async () => {

    await userModel.addUser('username', 'Password1');
    await characterModel.addCharacter(1, 1, 'Angongle', 10, 1, 1, 1, 1, [11, 12, 13, 14, 15, 16], [1, 3], 2, 1, 13);
    await expect(characterStatsModel.removeSavingThrowProficiency(-10)).rejects.toThrow(InvalidInputError);
    await expect(characterStatsModel.removeSavingThrowProficiency(100)).rejects.toThrow(InvalidInputError);

})
    
test('removeSavingThrowProficiency - Failure - Closed database connection', async () => {

    characterStatsModel.closeConnection();
    await expect(characterStatsModel.removeSavingThrowProficiency(1, 1)).rejects.toThrow(DatabaseError);

})