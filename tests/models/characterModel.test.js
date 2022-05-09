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

//PlayerCharacter(Id INT, UserId INT, ClassId INT, RaceId INT, EthicsId INT, MoralityId INT, BackgroundId INT, Name TEXT, ProficiencyBonus INT, 
//MaxHP INT, CurrentHp INT, Level INT, ArmorClass INT, Speed INT, Initiative INT, Experience INT, 
//PRIMARY KEY(Id), FOREIGN KEY (UserId) REFERENCES User(Id), FOREIGN KEY (ClassId) REFERENCES Class(Id), 
//FOREIGN KEY (RaceId) REFERENCES Race(Id), FOREIGN KEY (EthicsId) REFERENCES Ethics(Id), FOREIGN KEY (MoralityId) 
//REFERENCES Morality(Id), FOREIGN KEY (BackgroundId) REFERENCES Background(Id))
const randomCharacters = [
    {UserId:1, ClassId: 1, RaceId:1, EthicsId: 1, MoralityId: 1, BackgroundId: 1, Name:"Samuel The Great", 
    ProficiencyBonus: 2, MaxHP: 44, Level:3, ArmorClass:34, Speed:25, Initiative:23, Experience: 333, 
    AbilityScoreValues: [0,0,0,0,0,0], ProficiencyBonus: 3, SavingThrowProficienciesIds: [1,3]},

    {UserId:1, ClassId: 4, RaceId:5, EthicsId: 2, MoralityId: 3, BackgroundId: 4, Name:"Chase The Menace", 
    ProficiencyBonus: 2, MaxHP: 44, Level:3, ArmorClass:34, Speed:25, Initiative:23, Experience: 444, 
    AbilityScoreValues: [0,1,4,2,-1,2], ProficiencyBonus: 3, SavingThrowProficienciesIds: [2,3]},

    {UserId:1, ClassId: 1, RaceId:5, EthicsId: 1, MoralityId: 1, BackgroundId: 1, Name:"Jeff The Best", 
    ProficiencyBonus: 2, MaxHP: 44, Level:3, ArmorClass:34, Speed:25, Initiative:23, Experience: 555, 
    AbilityScoreValues: [4,1,1,6,5,0], ProficiencyBonus: 6, SavingThrowProficienciesIds: [2,4]},

    {UserId:2, ClassId: 1, RaceId:2, EthicsId: 1, MoralityId: 2, BackgroundId: 1, Name:"Talib The GOAT", 
    ProficiencyBonus: 2, MaxHP: 44, Level:3, ArmorClass:34, Speed:25, Initiative:23, Experience: 333, 
    AbilityScoreValues: [2,2,2,3,1,-1], ProficiencyBonus: 4, SavingThrowProficienciesIds: [3]},

    {UserId:1, ClassId: 5, RaceId:3, EthicsId: 2, MoralityId: 1, BackgroundId: 2, Name:"Eren", 
    ProficiencyBonus: 2, MaxHP: 44, Level:3, ArmorClass:34, Speed:25, Initiative:23, Experience: 234, 
    AbilityScoreValues: [0,0,2,6,0,0], ProficiencyBonus: 2, SavingThrowProficienciesIds: [2,5]},

    {UserId:3, ClassId: 1, RaceId:4, EthicsId: 3, MoralityId: 3, BackgroundId: 1, Name:"Nosferatu", 
    ProficiencyBonus: 2, MaxHP: 44, Level:3, ArmorClass:34, Speed:25, Initiative:23, Experience: 765, 
    AbilityScoreValues: [0,1,0,1,0,5], ProficiencyBonus: 2, SavingThrowProficienciesIds: [5,6]},

    {UserId:1, ClassId: 1, RaceId:1, EthicsId: 1, MoralityId: 1, BackgroundId: 2, Name:"DEEZ", 
    ProficiencyBonus: 2, MaxHP: 44, Level:3, ArmorClass:34, Speed:25, Initiative:23, Experience: 69420, 
    AbilityScoreValues: [0,0,0,0,0,0], ProficiencyBonus: 5, SavingThrowProficienciesIds: [1,6]},

    {UserId:2, ClassId: 3, RaceId:3, EthicsId: 1, MoralityId: 2, BackgroundId: 4, Name:"BALLZ", 
    ProficiencyBonus: 2, MaxHP: 44, Level:3, ArmorClass:34, Speed:25, Initiative:23, Experience: 6969, 
    AbilityScoreValues: [2,1,1,1,0,1], ProficiencyBonus: 1, SavingThrowProficienciesIds: [2,6]},

    {UserId:3, ClassId: 5, RaceId:1, EthicsId: 3, MoralityId: 1, BackgroundId: 6, Name:"Sir William Alexander The Fourth Jr", 
    ProficiencyBonus: 2, MaxHP: 44, Level:3, ArmorClass:34, Speed:25, Initiative:23, Experience: 4444, 
    AbilityScoreValues: [2,2,2,5,0,1], ProficiencyBonus: 4, SavingThrowProficienciesIds: [3,6]}
];

/**
 * Gets a copy of a random character.
 * @returns A copy of a random character from an array of premade characters.
 */
function getRandomCharacter (){ 
    const random = Math.floor(Math.random() * randomCharacters.length);
    return {...randomCharacters.slice(random, random+1)[0]}; 
}

test('addCharacter - Success', async() => {

    // // Add 3 users since the highest user id in a random character is 3
    // await userModel.addUser('user1', 'Password1');
    // await userModel.addUser('user2', 'Password2');
    // await userModel.addUser('user3', 'Password3');

    // // Add random character
    // const randomCharacter = getRandomCharacter();
    // const newCharacterId = await characterModel.addCharacterObject(randomCharacter);

    // // Get the characters in the db
    // const storedUserCharacters = await characterModel.getUserCharacters(randomCharacter.UserId);

    // // stored characters should be an array
    // expect(Array.isArray(storedUserCharacters)).toBe(true);

    // // Character should have been added successfully
    // expect(newCharacterId).toBe(1)

    // // Character in db should be the same as the original
    // expect(storedUserCharacters.length).toBe(1);
    // expect(storedUserCharacters[0].UserId).toBe(randomCharacter.UserId);
    // expect(storedUserCharacters[0].Name).toBe(randomCharacter.Name.toLowerCase());
    // expect(storedUserCharacters[0].ClassId).toBe(randomCharacter.ClassId);
    // expect(storedUserCharacters[0].RaceId).toBe(randomCharacter.RaceId);
    // expect(storedUserCharacters[0].EthicsId).toBe(randomCharacter.EthicsId);
    // expect(storedUserCharacters[0].BackgroundId).toBe(randomCharacter.BackgroundId);
    // expect(storedUserCharacters[0].ProficiencyBonus).toBe(randomCharacter.ProficiencyBonus);
    // expect(storedUserCharacters[0].MaxHP).toBe(randomCharacter.MaxHP);
    // expect(storedUserCharacters[0].currentHp).toBe(randomCharacter.MaxHP);
    // expect(storedUserCharacters[0].Level).toBe(randomCharacter.Level);
    // expect(storedUserCharacters[0].ArmorClass).toBe(randomCharacter.ArmorClass);
    // expect(storedUserCharacters[0].Speed).toBe(randomCharacter.Speed);
    // expect(storedUserCharacters[0].Initiative).toBe(randomCharacter.Initiative);
    // expect(storedUserCharacters[0].Experience).toBe(randomCharacter.Experience);
    // expect(storedUserCharacters[0].ProficiencyBonus).toBe(randomCharacter.ProficiencyBonus);
    // expect(storedUserCharacters[0].SavingThrowProficienciesIds[0]).toBe(randomCharacter.SavingThrowProficienciesIds[0]);
    // expect(storedUserCharacters[0].AbilityScoreValues.length).toBe(6);
    // expect(storedUserCharacters[0].Name).toBe(randomCharacter.Name.toLowerCase());
})