const characterModel = require('../models/characterModel');
const dbName = 'dnd_db_testing';

//PlayerCharacter(Id INT, UserId INT, ClassId INT, RaceId INT, EthicsId INT, MoralityId INT, BackgroundId INT, Name TEXT, ProficiencyBonus INT, 
//MaxHp INT, CurrentHp INT, Level INT, ArmorClass INT, Speed INT, Initiative INT, Experience INT, 
//PRIMARY KEY(Id), FOREIGN KEY (UserId) REFERENCES User(Id), FOREIGN KEY (ClassId) REFERENCES Class(Id), 
//FOREIGN KEY (RaceId) REFERENCES Race(Id), FOREIGN KEY (EthicsId) REFERENCES Ethics(Id), FOREIGN KEY (MoralityId) 
//REFERENCES Morality(Id), FOREIGN KEY (BackgroundId) REFERENCES Background(Id))
const randomCharacters = [
    {userId:1, classId: 1, raceId:1, ethicsId: 1, moralityId: 1, backgroundId: 1, name:"Samuel The Great", 
    proficiencyBonus: 2, maxHp: 44, level:3, ac:34, speed:25, initiative:23, experience: 333, 
    abilityScoreValues: [0,0,0,0,0,0], proficiencyBonus: 3, savingThrowProficienciesIds: [1,3]},

    {userId:1, classId: 4, raceId:5, ethicsId: 2, moralityId: 3, backgroundId: 4, name:"Chase The Menace", 
    proficiencyBonus: 2, maxHp: 44, level:3, ac:34, speed:25, initiative:23, experience: 444, 
    abilityScoreValues: [0,1,4,2,-1,2], proficiencyBonus: 3, savingThrowProficienciesIds: [2,3]},

    {userId:1, classId: 1, raceId:5, ethicsId: 1, moralityId: 1, backgroundId: 1, name:"Jeff The Best", 
    proficiencyBonus: 2, maxHp: 44, level:3, ac:34, speed:25, initiative:23, experience: 555, 
    abilityScoreValues: [4,1,1,6,5,0], proficiencyBonus: 6, savingThrowProficienciesIds: [2,4]},

    {userId:2, classId: 1, raceId:2, ethicsId: 1, moralityId: 2, backgroundId: 1, name:"Talib The GOAT", 
    proficiencyBonus: 2, maxHp: 44, level:3, ac:34, speed:25, initiative:23, experience: 333, 
    abilityScoreValues: [2,2,2,3,1,-1], proficiencyBonus: 4, savingThrowProficienciesIds: [3]},

    {userId:1, classId: 5, raceId:3, ethicsId: 5, moralityId: 1, backgroundId: 2, name:"Eren", 
    proficiencyBonus: 2, maxHp: 44, level:3, ac:34, speed:25, initiative:23, experience: 234, 
    abilityScoreValues: [0,0,2,6,0,0], proficiencyBonus: 2, savingThrowProficienciesIds: [2,5]},

    {userId:3, classId: 1, raceId:4, ethicsId: 3, moralityId: 3, backgroundId: 1, name:"Nosferatu", 
    proficiencyBonus: 2, maxHp: 44, level:3, ac:34, speed:25, initiative:23, experience: 765, 
    abilityScoreValues: [0,1,0,1,0,5], proficiencyBonus: 2, savingThrowProficienciesIds: [5,6]},

    {userId:1, classId: 1, raceId:1, ethicsId: 4, moralityId: 1, backgroundId: 2, name:"DEEZ", 
    proficiencyBonus: 2, maxHp: 44, level:3, ac:34, speed:25, initiative:23, experience: 69420, 
    abilityScoreValues: [0,0,0,0,0,0], proficiencyBonus: 5, savingThrowProficienciesIds: [1,6]},

    {userId:2, classId: 3, raceId:3, ethicsId: 1, moralityId: 5, backgroundId: 4, name:"BALLZ", 
    proficiencyBonus: 2, maxHp: 44, level:3, ac:34, speed:25, initiative:23, experience: 6969, 
    abilityScoreValues: [2,1,1,1,0,1], proficiencyBonus: 1, savingThrowProficienciesIds: [2,6]},

    {userId:3, classId: 5, raceId:1, ethicsId: 3, moralityId: 1, backgroundId: 6, name:"Sir William Alexander The Fourth Jr", 
    proficiencyBonus: 2, maxHp: 44, level:3, ac:34, speed:25, initiative:23, experience: 4444, 
    abilityScoreValues: [2,2,2,5,0,1], proficiencyBonus: 4, savingThrowProficienciesIds: [3,6]}
];

/**
 * Gets a copy of a random character.
 * @returns A copy of a random character from an array of premade characters.
 */
function getRandomCharacter (){ 
    const random = Math.floor(Math.random() * randomCharacters.length);
    return {...randomCharacters.slice(random, random+1)[0]}; 
}

// Initialize the database before each test.
beforeEach(async () => {
    await characterModel.initialize(dbName, true);    
});

// Close the database connection after each test to prevent open handles error.
afterEach(async () => {
    await characterModel.closeConnection();
});


test('addCharacter - Success', async() => {

    // Add random character
    const randomCharacter = getRandomCharacter();
    const wasCharacterAdded = await characterModel.addCharacter(randomCharacter);

    // Get the characters in the db
    const storedUserCharacters = await characterModel.getUserCharacters(randomCharacter.userId);



    // stored spells should be an array
    expect(Array.isArray(storedUserCharacters)).toBe(true);

    // Character should have been added successfully
    expect(wasCharacterAdded).toBe(true)

    // Character in db should be the same as the original
    expect(storedUserCharacters.length).toBe(1);
    expect(storedUserCharacters[0].userId).toBe(randomCharacter.userId);
    expect(storedUserCharacters[0].name).toBe(randomCharacter.name.toLowerCase());
    expect(storedUserCharacters[0].classId).toBe(randomCharacter.classId);
    expect(storedUserCharacters[0].raceId).toBe(randomCharacter.raceId);
    expect(storedUserCharacters[0].ethicsId).toBe(randomCharacter.ethicsId);
    expect(storedUserCharacters[0].backgroundId).toBe(randomCharacter.backgroundId);
    expect(storedUserCharacters[0].proficiencyBonus).toBe(randomCharacter.proficiencyBonus);
    expect(storedUserCharacters[0].maxHp).toBe(randomCharacter.maxHp);
    expect(storedUserCharacters[0].currentHp).toBe(randomCharacter.maxHp);
    expect(storedUserCharacters[0].level).toBe(randomCharacter.level);
    expect(storedUserCharacters[0].armorClass).toBe(randomCharacter.ac);
    expect(storedUserCharacters[0].speed).toBe(randomCharacter.speed);
    expect(storedUserCharacters[0].initiative).toBe(randomCharacter.initiative);
    expect(storedUserCharacters[0].experience).toBe(randomCharacter.experience);
    expect(storedUserCharacters[0].proficiencyBonus).toBe(randomCharacter.proficiencyBonus);
    expect(storedUserCharacters[0].savingThrowProficienciesIds[0]).toBe(randomCharacter.savingThrowProficienciesIds[0]);
    expect(storedUserCharacters[0].abilityScoreValues.length).toBe(6);
    expect(storedUserCharacters[0].name).toBe(randomCharacter.name.toLowerCase());
})