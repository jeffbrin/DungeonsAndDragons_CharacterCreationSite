
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