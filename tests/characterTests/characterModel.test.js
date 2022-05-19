const userModel = require('../../models/userModel');
const characterStatsModel = require('../../models/characterStatisticsModel');
const characterModel = require('../../models/characterModel');
const spellModel = require('../../models/spellModel');
const backgroundModel = require('../../models/backgroundModel');
const classModel = require('../../models/classModel');
const raceModel = require('../../models/raceModel');
const fs = require('fs/promises');
const dbName = 'dnd_db_testing';
const { DatabaseError, InvalidInputError } = require('../../models/errorModel');

// Initialize the database before each test.
beforeEach(async () =>
{
    await userModel.initialize(dbName, true);
    await classModel.initialize(dbName, true);
    await backgroundModel.initialize(dbName, true);
    await raceModel.initialize(dbName, true);
    await spellModel.initialize(dbName, false);
    await characterModel.initialize(dbName, true);
    await characterStatsModel.initialize(dbName);
    await characterStatsModel.dropTables();
    await characterStatsModel.createTables();
});

// Close the database connection after each test to prevent open handles error.
afterEach(async () =>
{
    await classModel.closeConnection();
    await raceModel.closeConnection();
    await backgroundModel.closeConnection();
    await spellModel.closeConnection();
    await characterStatsModel.closeConnection();
    await characterModel.closeConnection();
    await userModel.closeConnection();
});

//helper
function getEthicsStringFromId(ethicsId)
{
    switch (ethicsId)
    {
        case 1: return 'lawful';
        case 2: return 'chaotic';
        case 3: return 'neutral';
        default: return undefined;
    }
}

//helper
function getMoralityStringFromId(moralityId)
{
    switch (moralityId)
    {
        case 1: return 'good';
        case 2: return 'evil';
        case 3: return 'neutral';
        default: return undefined;
    }
}


//PlayerCharacter(Id INT, UserId INT, ClassId INT, RaceId INT, EthicsId INT, MoralityId INT, BackgroundId INT, Name TEXT, ProficiencyBonus INT, 
//MaxHP INT, CurrentHp INT, Level INT, ArmorClass INT, Speed INT, Initiative INT, Experience INT, 
//PRIMARY KEY(Id), FOREIGN KEY (UserId) REFERENCES User(Id), FOREIGN KEY (ClassId) REFERENCES Class(Id), 
//FOREIGN KEY (RaceId) REFERENCES Race(Id), FOREIGN KEY (EthicsId) REFERENCES Ethics(Id), FOREIGN KEY (MoralityId) 
//REFERENCES Morality(Id), FOREIGN KEY (BackgroundId) REFERENCES Background(Id))
const randomCharacters = [
    {
        UserId: 1, ClassId: 1, RaceId: 1, EthicsId: 1, MoralityId: 1, BackgroundId: 1, Name: "Samuel The Great",
        ProficiencyBonus: 2, MaxHP: 44, Level: 3, ArmorClass: 34, Speed: 25, Initiative: 23, Experience: 333,
        AbilityScoreValues: [0, 0, 0, 0, 0, 0], ProficiencyBonus: 3, SavingThrowProficienciesIds: [1, 3]
    },

    {
        UserId: 1, ClassId: 4, RaceId: 5, EthicsId: 2, MoralityId: 3, BackgroundId: 4, Name: "Chase The Menace",
        ProficiencyBonus: 2, MaxHP: 44, Level: 3, ArmorClass: 34, Speed: 25, Initiative: 23, Experience: 444,
        AbilityScoreValues: [0, 1, 4, 2, -1, 2], ProficiencyBonus: 3, SavingThrowProficienciesIds: [2, 3]
    },

    {
        UserId: 1, ClassId: 1, RaceId: 5, EthicsId: 1, MoralityId: 1, BackgroundId: 1, Name: "Jeff The Best",
        ProficiencyBonus: 2, MaxHP: 44, Level: 3, ArmorClass: 34, Speed: 25, Initiative: 23, Experience: 555,
        AbilityScoreValues: [4, 1, 1, 6, 5, 0], ProficiencyBonus: 6, SavingThrowProficienciesIds: [2, 4]
    },

    {
        UserId: 2, ClassId: 1, RaceId: 2, EthicsId: 1, MoralityId: 2, BackgroundId: 1, Name: "Talib The GOAT",
        ProficiencyBonus: 2, MaxHP: 44, Level: 3, ArmorClass: 34, Speed: 25, Initiative: 23, Experience: 333,
        AbilityScoreValues: [2, 2, 2, 3, 1, -1], ProficiencyBonus: 4, SavingThrowProficienciesIds: [3]
    },

    {
        UserId: 1, ClassId: 5, RaceId: 3, EthicsId: 2, MoralityId: 1, BackgroundId: 2, Name: "Eren",
        ProficiencyBonus: 2, MaxHP: 44, Level: 3, ArmorClass: 34, Speed: 25, Initiative: 23, Experience: 234,
        AbilityScoreValues: [0, 0, 2, 6, 0, 0], ProficiencyBonus: 2, SavingThrowProficienciesIds: [2, 5]
    },

    {
        UserId: 3, ClassId: 1, RaceId: 4, EthicsId: 3, MoralityId: 3, BackgroundId: 1, Name: "Nosferatu",
        ProficiencyBonus: 2, MaxHP: 44, Level: 3, ArmorClass: 34, Speed: 25, Initiative: 23, Experience: 765,
        AbilityScoreValues: [0, 1, 0, 1, 0, 5], ProficiencyBonus: 2, SavingThrowProficienciesIds: [5, 6]
    },

    {
        UserId: 1, ClassId: 1, RaceId: 1, EthicsId: 1, MoralityId: 1, BackgroundId: 2, Name: "DEEZ",
        ProficiencyBonus: 2, MaxHP: 44, Level: 3, ArmorClass: 34, Speed: 25, Initiative: 23, Experience: 69420,
        AbilityScoreValues: [0, 0, 0, 0, 0, 0], ProficiencyBonus: 5, SavingThrowProficienciesIds: [1, 6]
    },

    {
        UserId: 2, ClassId: 3, RaceId: 3, EthicsId: 1, MoralityId: 2, BackgroundId: 4, Name: "BALLZ",
        ProficiencyBonus: 2, MaxHP: 44, Level: 3, ArmorClass: 34, Speed: 25, Initiative: 23, Experience: 6969,
        AbilityScoreValues: [2, 1, 1, 1, 0, 1], ProficiencyBonus: 1, SavingThrowProficienciesIds: [2, 6]
    },

    {
        UserId: 3, ClassId: 5, RaceId: 1, EthicsId: 3, MoralityId: 1, BackgroundId: 6, Name: "Sir William Alexander The Fourth Jr",
        ProficiencyBonus: 2, MaxHP: 44, Level: 3, ArmorClass: 34, Speed: 25, Initiative: 23, Experience: 4444,
        AbilityScoreValues: [2, 2, 2, 5, 0, 1], ProficiencyBonus: 4, SavingThrowProficienciesIds: [3, 6]
    }
];

const randomItem = [
    { Name: "Boots", Quantity: 3 },
    { Name: "Magical Orb", Quantity: 1 },
    { Name: "Ninja Star", Quantity: 6 },
    { Name: "Health Potion", Quantity: 2 },
    { Name: "Trail Mix", Quantity: 5 },
    { Name: "Staff of Flowing Water", Quantity: 1 },
    { Name: "Rusty Knife", Quantity: 1 },
    { Name: "Eye of Sauron", Quantity: 1 },
    { Name: "Gold Amulet", Quantity: 4 },
    { Name: "Sack", Quantity: 1 },
    { Name: "Scimitar", Quantity: 3 },
    { Name: "Sling", Quantity: 1 },
    { Name: "Sling Bullets", Quantity: 99 },
    { Name: "Sun Blade", Quantity: 1 },
    { Name: "Vicious Halberd", Quantity: 1 },
    { Name: "Waterskin", Quantity: 8 },
    { Name: "Whip", Quantity: 69 },
    { Name: "Potters Tools", Quantity: 1 },
    { Name: "Potion of Speed", Quantity: 8 },
    { Name: "Potion of Invisibility", Quantity: 7 },
    { Name: "Paper", Quantity: 76 },
    { Name: "Lyre", Quantity: 1 }
];

const randomIntegers = [
    1, 34, 23, 29, 12, 11, 10, 7, 5, 25, 33, 45, 65, 34, 43, 22, 19, 14, 9, 13, 23, 22, 25
];
const randomSpells = [{ id: 1, name: "Abi-Dalzim's Horrid Wilting", desc: "You draw the moisture from every creature in a 30-foot cube centered on a point you choose within range. Each creature in that area must make a Constitution saving throw. Constructs and undead aren't affected, and plants and water elementals make this saving throw with disadvantage. A creature takes 10d8 necrotic damage on a failed save, or half as much damage on a successful one.You hurl a bubble of acid. Choose one creature within range, or choose two creatures within range that are within 5 feet of each other. A target must succeed on a Dexterity saving throw or take 1d6 acid damage.This spells damage increases by 1d6 when you reach 5th Level (2d6), 11th level (3d6) and 17th level (4d6).", page: "ee pc 15", range: "150 feet", components: "V, S, M", material: "A bit of sponge.", ritual: "no", duration: "Instantaneous", concentration: "no", casting_time: "1 action", level: "8", school: "Necromancy", class: "Sorcerer, Wizard" },
{ id: 2, name: "Absorb Elements", desc: "The spell captures some of the incoming energy, lessening its effect on you and storing it for your next melee attack. You have resistance to the triggering damage type until the start of your next turn. Also, the first time you hit with a melee attack on your next turn, the target takes an extra 1d6 damage of the triggering type, and the spell ends.", higher_level: "When you cast this spell using a spell slot of 2nd level or higher, the extra damage increases by 1d6 for each slot level above 1st.", page: "ee pc 15", range: "Self", components: "S", ritual: "no", duration: "1 round", concentration: "no", casting_time: "1 action", level: "1", school: "Abjuration", class: "Druid, Ranger, Wizard" },
{ id: 3, name: "Acid Splash", desc: "You hurl a bubble of acid. Choose one creature within range, or choose two creatures within range that are within 5 feet of each other. A target must succeed on a dexterity saving throw or take 1d6 acid damage. This spell's damage increases by 1d6 when you reach 5th level (2d6), 11th level (3d6), and 17th level (4d6).", page: "phb 211", range: "60 feet", components: "V, S", ritual: "no", duration: "Instantaneous", concentration: "no", casting_time: "1 action", level: "0", school: "Conjuration", class: "Sorcerer, Wizard" },
{ id: 4, name: "Aganazzar's Scorcher", desc: "A line of roaring flame 30 feet long and 5 feet wide emanates from you in a direction you choose. Each creature in the line must make a Dexterity saving throw. A creature takes 3d8 fire damage on a failed save, or half as much damage on a successful one.", higher_level: "When you cast this spell using a spell slot of 3nd level or higher, the damage increases by 1d8 for each slot level above 2st.", page: "ee pc 15", range: "30 feet", components: "V, S, M", material: "A red dragon's scale.", ritual: "no", duration: "Instantaneous", concentration: "no", casting_time: "1 action", level: "2", school: "Evocation", class: "Sorcerer, Wizard" },
{ id: 5, name: "Aid", desc: "Your spell bolsters your allies with toughness and resolve. Choose up to three creatures within range. Each target's hit point maximum and current hit points increase by 5 for the duration.", higher_level: "When you cast this spell using a spell slot of 3rd level or higher, a target's hit points increase by an additional 5 for each slot level above 2nd.", page: "phb 211", range: "30 feet", components: "V, S, M", material: "A tiny strip of white cloth.", ritual: "no", duration: "8 hours", concentration: "no", casting_time: "1 action", level: "2", school: "Abjuration", class: "Cleric, Paladin" },
{ id: 6, name: "Alarm", desc: "You set an alarm against unwanted intrusion. Choose a door, a window, or an area within range that is no larger than a 20-foot cube. Until the spell ends, an alarm alerts you whenever a Tiny or larger creature touches or enters the warded area. When you cast the spell, you can designate creatures that won't set off the alarm. You also choose whether the alarm is mental or audible.A mental alarm alerts you with a ping in your mind if you are within 1 mile of the warded area. This ping awakens you if you are sleeping.An audible alarm produces the sound of a hand bell for 10 seconds within 60 feet.", page: "phb 211", range: "30 feet", components: "V, S, M", material: "A tiny bell and a piece of fine silver wire.", ritual: "yes", duration: "8 hours", concentration: "no", casting_time: "1 minute", level: "1", school: "Abjuration", class: "Ranger, Ritual Caster, Wizard" },
{ id: 7, name: "Alter Self", desc: "You assume a different form. When you cast the spell, choose one of the following options, the effects of which last for the duration of the spell. While the spell lasts, you can end one option as an action to gain the benefits of a different one.Aquatic Adaptation. You adapt your body to an aquatic environment, sprouting gills and growing webbing between your fingers. You can breathe underwater and gain a swimming speed equal to your walking speed.Change Appearance. You transform your appearance. You decide what you look like, including your height, weight, facial features, sound of your voice, hair length, coloration, and distinguishing characteristics, if any. You can make yourself appear as a member of another race, though none of your statistics change. You also can't appear as a creature of a different size than you, and your basic shape stays the same; if you're bipedal, you can't use this spell to become quadrupedal, for instance. At any time for the duration of the spell, you can use your action to change your appearance in this way again.Natural Weapons. You grow claws, fangs, spines, horns, or a different natural weapon of your choice. Your unarmed strikes deal 1d6 bludgeoning, piercing, or slashing damage, as appropriate to the natural weapon you chose, and you are proficient with your unarmed strikes. Finally, the natural weapon is magic and you have a +1 bonus to the attack and damage rolls you make using it.", page: "phb 211", range: "Self", components: "V, S", ritual: "no", duration: "Up to 1 hour", concentration: "yes", casting_time: "1 action", level: "2", school: "Transmutation", class: "Sorcerer, Wizard" },
{ id: 8, name: "Animal Friendship", desc: "This spell lets you convince a beast that you mean it no harm. Choose a beast that you can see within range. It must see and hear you. If the beast's Intelligence is 4 or higher, the spell fails. Otherwise, the beast must succeed on a wisdom saving throw or be charmed by you for the spell's duration. If you or one of your companions harms the target, the spells ends.", higher_level: "When you cast this spell using a spell slot of 2nd level or higher, you can affect one additional beast for each slot level above 1st.", page: "phb 212", range: "30 feet", components: "V, S, M", material: "A morsel of food.", ritual: "no", duration: "24 hours", concentration: "no", casting_time: "1 action", level: "1", school: "Enchantment", class: "Bard, Cleric, Druid, Ranger", archetype: "Cleric: Nature", domains: "Nature" }
];
/**
 * Gets a copy of a random character.
 * @returns A copy of a random character from an array of premade characters.
 */
function getRandomCharacter()
{
    const random = Math.floor(Math.random() * randomCharacters.length);
    return { ...randomCharacters.slice(random, random + 1)[0] };
}
function getRandomCharacterSplice()
{
    return randomCharacters.splice(Math.floor(Math.random() * randomCharacters.length), 1)[0];
}
function getRandomThing(randomThingArray)
{
    const random = Math.floor(Math.random() * randomThingArray.length);
    return { ...randomThingArray.slice(random, random + 1)[0] };
}
function getRandomThingSplice(randomThingArray)
{
    return randomThingArray.splice(Math.floor(Math.random() * randomThingArray.length), 1)[0];
}
test('addCharacter - Success', async () =>
{

    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacter();
    const newCharacterId = await characterModel.addCharacterObject(randomCharacter);

    // Get the characters in the db
    const storedUserCharacters = await characterModel.getUserCharacters(randomCharacter.UserId);

    // stored characters should be an array
    expect(Array.isArray(storedUserCharacters)).toBe(true);

    // Character should have been added successfully
    expect(newCharacterId).toBe(1);

    // Character in db should be the same as the original
    expect(storedUserCharacters.length).toBe(1);
    expect(storedUserCharacters[0].Name).toBe(randomCharacter.Name);
    expect(storedUserCharacters[0].Class.Id).toBe(randomCharacter.ClassId);
    expect(storedUserCharacters[0].Race.Id).toBe(randomCharacter.RaceId);
    expect(storedUserCharacters[0].Ethics).toBe(getEthicsStringFromId(randomCharacter.EthicsId));
    expect(storedUserCharacters[0].Morality).toBe(getMoralityStringFromId(randomCharacter.MoralityId));
    expect(storedUserCharacters[0].Background.Id).toBe(randomCharacter.BackgroundId);
    expect(storedUserCharacters[0].ProficiencyBonus).toBe(randomCharacter.ProficiencyBonus);
    expect(storedUserCharacters[0].MaxHp).toBe(randomCharacter.MaxHP);
    expect(storedUserCharacters[0].CurrentHp).toBe(randomCharacter.MaxHP);
    expect(storedUserCharacters[0].Level).toBe(randomCharacter.Level);
    expect(storedUserCharacters[0].ArmorClass).toBe(randomCharacter.ArmorClass);
    for (let i = 0; i < storedUserCharacters[0].SavingThrowProficiencies.length; i++)
    {
        expect(storedUserCharacters[0].SavingThrowProficiencies[i]).toBe(randomCharacter.SavingThrowProficienciesIds[i]);
    }
    expect(storedUserCharacters[0].AbilityScores.length).toBe(6);

    expect(storedUserCharacters[0].Speed).toBe(null);
    expect(storedUserCharacters[0].Initiative).toBe(null);
    expect(storedUserCharacters[0].Experience).toBe(0);



    await characterModel.updateSpeed(storedUserCharacters[0].Id, randomCharacter.Speed);
    const storedUserCharacters2 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(storedUserCharacters2[0].Speed).toBe(randomCharacter.Speed);

    await characterModel.updateExp(storedUserCharacters[0].Id, randomCharacter.Experience);
    const storedUserCharacters3 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(storedUserCharacters3[0].Experience).toBe(randomCharacter.Experience);

    await characterModel.updateInitiative(storedUserCharacters[0].Id, randomCharacter.Initiative);
    const storedUserCharacters4 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(storedUserCharacters4[0].Initiative).toBe(randomCharacter.Initiative);


});
test('addCharacter - Fail on Class', async () =>
{

    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character

    const randomCharacter = getRandomCharacter();
    await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);

    //worked now we change to something that won't work

    randomCharacter.ClassId = 26;
    await expect(characterModel.addCharacterObject(randomCharacter)).rejects.toThrow(InvalidInputError);

});
test('addCharacter - Fail on Race', async () =>
{

    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character

    const randomCharacter = getRandomCharacter();
    await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);

    //worked now we change to something that won't work

    randomCharacter.RaceId = 26;
    await expect(characterModel.addCharacterObject(randomCharacter)).rejects.toThrow(InvalidInputError);

});
test('addCharacter - Fail on Background', async () =>
{

    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character

    const randomCharacter = getRandomCharacter();
    await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);

    //worked now we change to something that won't work

    randomCharacter.BackgroundId = 26;
    await expect(characterModel.addCharacterObject(randomCharacter)).rejects.toThrow(InvalidInputError);

});
test('addCharacter - Fail on Ethics', async () =>
{

    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character

    const randomCharacter = getRandomCharacter();
    await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);

    //worked now we change to something that won't work

    randomCharacter.EthicsId = 26;
    await expect(characterModel.addCharacterObject(randomCharacter)).rejects.toThrow(InvalidInputError);

});
test('addCharacter - Fail on Morality', async () =>
{

    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character

    const randomCharacter = getRandomCharacter();
    await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);

    //worked now we change to something that won't work

    randomCharacter.MoralityId = 26;
    await expect(characterModel.addCharacterObject(randomCharacter)).rejects.toThrow(InvalidInputError);

});
test('addCharacter - Fail on Level', async () =>
{

    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character

    const randomCharacter = getRandomCharacter();
    await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);

    //worked now we change to something that won't work

    randomCharacter.Level = -2;
    await expect(characterModel.addCharacterObject(randomCharacter)).rejects.toThrow(InvalidInputError);

});
test('addCharacter - Fail on AbilityScores', async () =>
{

    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character

    const randomCharacter = getRandomCharacter();
    await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);

    //worked now we change to something that won't work

    randomCharacter.AbilityScoreValues = [26, 4, 6, 6, 6, 6, 6, 6, 6];
    await expect(characterModel.addCharacterObject(randomCharacter)).rejects.toThrow(InvalidInputError);

});
test('updateCharacter - Success', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character

    const randomCharacter = getRandomCharacterSplice();
    let addedId = await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);
    expect(db.length).toBe(1);

    let randomCharacterUpdate = getRandomCharacterSplice();
    await characterModel.updateCharacter(addedId, randomCharacterUpdate.ClassId, randomCharacterUpdate.RaceId, randomCharacterUpdate.EthicsId,
        randomCharacterUpdate.MoralityId, randomCharacterUpdate.BackgroundId, randomCharacterUpdate.Name, randomCharacterUpdate.MaxHP,
        randomCharacterUpdate.Level, randomCharacterUpdate.AbilityScoreValues, randomCharacterUpdate.SavingThrowProficienciesIds,
        randomCharacterUpdate.ProficiencyBonus, randomCharacter.UserId, randomCharacterUpdate.ArmorClass);

    //used same UserId from original randomCharacter or else it won't work if it is a different user who owns
    let dbUpdated = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(dbUpdated)).toBe(true);
    expect(dbUpdated.length).toBe(1);


    //Make sure everything is the new stuff not old

    expect(dbUpdated[0].Name).toBe(randomCharacterUpdate.Name);
    expect(dbUpdated[0].Class.Id).toBe(randomCharacterUpdate.ClassId);
    expect(dbUpdated[0].Race.Id).toBe(randomCharacterUpdate.RaceId);
    expect(dbUpdated[0].Ethics).toBe(getEthicsStringFromId(randomCharacterUpdate.EthicsId));
    expect(dbUpdated[0].Morality).toBe(getMoralityStringFromId(randomCharacterUpdate.MoralityId));
    expect(dbUpdated[0].Background.Id).toBe(randomCharacterUpdate.BackgroundId);
    expect(dbUpdated[0].ProficiencyBonus).toBe(randomCharacterUpdate.ProficiencyBonus);
    expect(dbUpdated[0].MaxHp).toBe(randomCharacterUpdate.MaxHP);
    expect(dbUpdated[0].CurrentHp).toBe(randomCharacterUpdate.MaxHP);
    expect(dbUpdated[0].Level).toBe(randomCharacterUpdate.Level);
    expect(dbUpdated[0].ArmorClass).toBe(randomCharacterUpdate.ArmorClass);
    // for (let i = 0; i < dbUpdated[0].SavingThrowProficiencies.length; i++)
    // {
    //     expect(dbUpdated[0].SavingThrowProficiencies[i]).toBe(randomCharacterUpdate.SavingThrowProficienciesIds[i]);
    // }
    expect(dbUpdated[0].AbilityScores.length).toBe(6);

    expect(dbUpdated[0].Speed).toBe(null);
    expect(dbUpdated[0].Initiative).toBe(null);
    expect(dbUpdated[0].Experience).toBe(0);



    await characterModel.updateSpeed(dbUpdated[0].Id, randomCharacterUpdate.Speed);
    const storedUserCharacters2 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(storedUserCharacters2[0].Speed).toBe(randomCharacterUpdate.Speed);

    await characterModel.updateExp(dbUpdated[0].Id, randomCharacterUpdate.Experience);
    const storedUserCharacters3 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(storedUserCharacters3[0].Experience).toBe(randomCharacterUpdate.Experience);

    await characterModel.updateInitiative(dbUpdated[0].Id, randomCharacterUpdate.Initiative);
    const storedUserCharacters4 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(storedUserCharacters4[0].Initiative).toBe(randomCharacterUpdate.Initiative);


});
test('updateCharacter - Fail on Class', async () =>
{

    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character

    const randomCharacter = getRandomCharacter();
    await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);

    //worked now we change to something that won't work

    randomCharacter.ClassId = 26;
    await expect(characterModel.updateCharacterObject(randomCharacter)).rejects.toThrow(InvalidInputError);

    //test make sure error message contains 'Class'
    await expect(characterModel.updateCharacterObject(randomCharacter)).rejects.toThrow('Class');

});
test('updateCharacter - Fail on Race', async () =>
{

    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character

    const randomCharacter = getRandomCharacter();
    await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);

    //worked now we change to something that won't work

    randomCharacter.RaceId = 26;
    await expect(characterModel.updateCharacterObject(randomCharacter)).rejects.toThrow(InvalidInputError);

    //test make sure error message contains 'Race'
    await expect(characterModel.updateCharacterObject(randomCharacter)).rejects.toThrow('Race');

});
test('updateCharacter - Fail on Background', async () =>
{

    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character

    const randomCharacter = getRandomCharacter();
    await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);

    //worked now we change to something that won't work

    randomCharacter.BackgroundId = 26;
    await expect(characterModel.updateCharacterObject(randomCharacter)).rejects.toThrow(InvalidInputError);

    //test make sure error message contains 'Background'
    await expect(characterModel.updateCharacterObject(randomCharacter)).rejects.toThrow('Background');

});
test('updateCharacter - Fail on Ethics', async () =>
{

    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character

    const randomCharacter = getRandomCharacter();
    await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);

    //worked now we change to something that won't work

    randomCharacter.EthicsId = 26;
    await expect(characterModel.updateCharacterObject(randomCharacter)).rejects.toThrow(InvalidInputError);

    //test make sure error message contains 'Ethics'
    await expect(characterModel.updateCharacterObject(randomCharacter)).rejects.toThrow('ethics');

});
test('updateCharacter - Fail on Morality', async () =>
{

    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character

    const randomCharacter = getRandomCharacter();
    await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);

    //worked now we change to something that won't work

    randomCharacter.MoralityId = 26;
    await expect(characterModel.updateCharacterObject(randomCharacter)).rejects.toThrow(InvalidInputError);

    //test make sure error message contains 'Morality'
    await expect(characterModel.updateCharacterObject(randomCharacter)).rejects.toThrow('Morality');

});
test('updateCharacter - Fail on Level', async () =>
{

    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character

    const randomCharacter = getRandomCharacter();
    await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);

    //worked now we change to something that won't work

    randomCharacter.Level = -2;
    await expect(characterModel.updateCharacterObject(randomCharacter)).rejects.toThrow(InvalidInputError);

    //test make sure error message contains 'Level'
    await expect(characterModel.updateCharacterObject(randomCharacter)).rejects.toThrow('Level');

});
test('updateCharacter - Fail on AbilityScores', async () =>
{

    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character

    const randomCharacter = getRandomCharacter();
    await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);

    //worked now we change to something that won't work

    randomCharacter.AbilityScoreValues = [26, 4, 6, 6, 6, 6, 6, 6, 6];
    await expect(characterModel.updateCharacterObject(randomCharacter)).rejects.toThrow(InvalidInputError);

    //test make sure error message contains 'Ability'
    await expect(characterModel.updateCharacterObject(randomCharacter)).rejects.toThrow('Ability');

});

test('addRemoveHp - Success', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacter();
    let id = await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);


    let originalHp = db[0].MaxHp;

    await characterModel.addRemoveHp(id, 2);

    let db2 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db2)).toBe(true);
    expect(db2.length).toBe(1);

    expect(db2[0].CurrentHp).toBe(originalHp + 2);
});
test('addRemoveHp - Fail Wrong Id updated', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacter();
    let id = await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);


    let originalHp = db[0].MaxHp;

    await expect(characterModel.addRemoveHp(id + 1, 2)).rejects.toThrow(InvalidInputError);

    await expect(characterModel.addRemoveHp(id + 1, 2)).rejects.toThrow('not found');

    let db2 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db2)).toBe(true);
    expect(db2.length).toBe(1);
    expect(db2[0].CurrentHp).toBe(originalHp);

});
test('getAllMoralities - Success', async () =>
{
    let moralities = await characterModel.getAllMoralities();

    expect(moralities.length).toBe(3);
    for (let i = 0; i < moralities.length; i++)
    {
        expect(getMoralityStringFromId(i + 1)).toBe(moralities[i].Name);
    }

});
test('getAllEthics - Success', async () =>
{
    let ethics = await characterModel.getAllEthics();

    expect(ethics.length).toBe(3);
    for (let i = 0; i < ethics.length; i++)
    {
        expect(getEthicsStringFromId(i + 1)).toBe(ethics[i].Name);
    }
});
test('addItem - Success', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacter();
    let id = await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);
    expect(db[0].OwnedItems.length).toBe(0);

    //get random Item
    let item = getRandomThing(randomItem);
    //Add Item to random character
    await characterModel.addItem(id, item.Name, item.Quantity);

    let db2 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db2)).toBe(true);
    expect(db2[0].OwnedItems.length).toBe(1);
    expect(db2[0].OwnedItems[0].Name).toBe(item.Name.toLowerCase());
    expect(db2[0].OwnedItems[0].Count).toBe(item.Quantity);
});
test('addItem - Fail on Quantity', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacter();
    let id = await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);
    expect(db[0].OwnedItems.length).toBe(0);

    //get random Item
    let item = getRandomThing(randomItem);
    //Add Item to random character
    await expect(characterModel.addItem(id, item.Name, 'hello')).rejects.toThrow(InvalidInputError);

    await expect(characterModel.addItem(id, item.Name, 'hello')).rejects.toThrow('Must be a number');
});
test('addItem - Fail on CharacterId', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacter();
    let id = await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);
    expect(db[0].OwnedItems.length).toBe(0);

    //get random Item
    let item = getRandomThing(randomItem);
    //Add Item to random character
    await expect(characterModel.addItem(id + 1, item.Name, item.Quantity)).rejects.toThrow(InvalidInputError);

    await expect(characterModel.addItem(id + 1, item.Name, item.Quantity)).rejects.toThrow('Invalid character Id');
});
test('removeItem should delete - Success', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacter();
    let id = await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);
    expect(db[0].OwnedItems.length).toBe(0);

    //get random Item
    let item = getRandomThing(randomItem);
    //Add Item to random character
    await characterModel.addItem(id, item.Name, item.Quantity);

    let db2 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db2)).toBe(true);
    expect(db2[0].OwnedItems.length).toBe(1);
    expect(db2[0].OwnedItems[0].Name).toBe(item.Name.toLowerCase());
    expect(db2[0].OwnedItems[0].Count).toBe(item.Quantity);

    //item added now time to remove

    await characterModel.removeItem(id, item.Name, -item.Quantity);

    //check make sure completely deleted (cause value set to 0)
    let db3 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db3)).toBe(true);
    expect(db3[0].OwnedItems.length).toBe(0);
});
test('removeItem should still have quantity - Success', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacter();
    let id = await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);
    expect(db[0].OwnedItems.length).toBe(0);

    //get random Item
    let item = getRandomThing(randomItem);
    //Add Item to random character
    await characterModel.addItem(id, item.Name, item.Quantity + 1);

    let db2 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db2)).toBe(true);
    expect(db2[0].OwnedItems.length).toBe(1);
    expect(db2[0].OwnedItems[0].Name).toBe(item.Name.toLowerCase());
    expect(db2[0].OwnedItems[0].Count).toBe(item.Quantity + 1);

    //item added now time to remove all but 1 of the item

    await characterModel.removeItem(id, item.Name, -item.Quantity);

    //check make sure completely deleted (cause value set to 0)
    let db3 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db3)).toBe(true);
    expect(db3[0].OwnedItems.length).toBe(1);
    expect(db3[0].OwnedItems[0].Name).toBe(item.Name.toLowerCase());
    expect(db3[0].OwnedItems[0].Count).toBe(1);
});
test('removeItem - Fail on Positive remove quantity', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacter();
    let id = await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);
    expect(db[0].OwnedItems.length).toBe(0);

    //get random Item
    let item = getRandomThing(randomItem);
    //Add Item to random character
    await characterModel.addItem(id, item.Name, item.Quantity);

    let db2 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db2)).toBe(true);
    expect(db2[0].OwnedItems.length).toBe(1);
    expect(db2[0].OwnedItems[0].Name).toBe(item.Name.toLowerCase());
    expect(db2[0].OwnedItems[0].Count).toBe(item.Quantity);

    //item added now time to remove and check make sure error thrown

    await expect(characterModel.removeItem(id, item.Name, item.Quantity)).rejects.toThrow(InvalidInputError);
    await expect(characterModel.removeItem(id, item.Name, item.Quantity)).rejects.toThrow('must be negative');
});
test('removeItem - Fail CharacterId', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacter();
    let id = await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);
    expect(db[0].OwnedItems.length).toBe(0);

    //get random Item
    let item = getRandomThing(randomItem);
    //Add Item to random character
    await characterModel.addItem(id, item.Name, item.Quantity);

    let db2 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db2)).toBe(true);
    expect(db2[0].OwnedItems.length).toBe(1);
    expect(db2[0].OwnedItems[0].Name).toBe(item.Name.toLowerCase());
    expect(db2[0].OwnedItems[0].Count).toBe(item.Quantity);

    //item added now time to remove and check make sure error thrown

    await expect(characterModel.removeItem(id + 1, item.Name, -item.Quantity)).rejects.toThrow(InvalidInputError);
    await expect(characterModel.removeItem(id + 1, item.Name, -item.Quantity)).rejects.toThrow('Invalid character Id');
});
test('removeItem - Fail Wrong Name', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacter();
    let id = await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);
    expect(db[0].OwnedItems.length).toBe(0);

    //get random Item
    let item = getRandomThing(randomItem);
    //Add Item to random character
    await characterModel.addItem(id, item.Name, item.Quantity);

    let db2 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db2)).toBe(true);
    expect(db2[0].OwnedItems.length).toBe(1);
    expect(db2[0].OwnedItems[0].Name).toBe(item.Name.toLowerCase());
    expect(db2[0].OwnedItems[0].Count).toBe(item.Quantity);

    //item added now time to remove and check make sure error thrown

    await expect(characterModel.removeItem(id, `${ item.Name }lmao`, -item.Quantity)).rejects.toThrow(InvalidInputError);
    await expect(characterModel.removeItem(id, `${ item.Name }lmao`, -item.Quantity)).rejects.toThrow('no item that exists with that name');
});;
test('addKnownSpell - Success', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacter();
    let id = await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);
    expect(db[0].Spells.length).toBe(0);

    //get random Spell
    let spell = getRandomThing(randomSpells);

    //Add it to character
    await characterModel.addKnownSpell(id, spell.id, randomCharacter.UserId);

    let db2 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db2)).toBe(true);
    expect(db2.length).toBe(1);
    expect(db2[0].Spells.length).toBe(1);
    expect(db2[0].Spells[0].Id).toBe(spell.id);
});
test('addKnownSpell - Fail on spellId', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacter();
    let id = await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);
    expect(db[0].Spells.length).toBe(0);


    //Add it to character
    await expect(characterModel.addKnownSpell(id, 10000000, randomCharacter.UserId)).rejects.toThrow(InvalidInputError);
    await expect(characterModel.addKnownSpell(id, 10000000, randomCharacter.UserId)).rejects.toThrow(`Spell You're trying to add doesn't exists`);

    let db2 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db2)).toBe(true);
    expect(db2.length).toBe(1);
    expect(db2[0].Spells.length).toBe(0);
});
test('addKnownSpell - Fail on UserId', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacter();
    let id = await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);
    expect(db[0].Spells.length).toBe(0);

    let spell = getRandomThing(randomSpells);
    //Add it to character
    await expect(characterModel.addKnownSpell(id, spell.id, randomCharacter.UserId + 1)).rejects.toThrow(InvalidInputError);
    await expect(characterModel.addKnownSpell(id, spell.id, randomCharacter.UserId + 1)).rejects.toThrow(`User has no characters to add a spell to`);

    let db2 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db2)).toBe(true);
    expect(db2.length).toBe(1);
    expect(db2[0].Spells.length).toBe(0);
});
test('removeKnownSpell - Success', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacter();
    let id = await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);
    expect(db[0].Spells.length).toBe(0);

    let spell = getRandomThing(randomSpells);
    //Add it to character
    await characterModel.addKnownSpell(id, spell.id, randomCharacter.UserId);

    let db2 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db2)).toBe(true);
    expect(db2.length).toBe(1);
    expect(db2[0].Spells.length).toBe(1);


    await characterModel.removeKnownSpell(id, spell.id, randomCharacter.UserId);

    let db3 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db3)).toBe(true);
    expect(db3.length).toBe(1);
    expect(db3[0].Spells.length).toBe(0);

});
test('removeKnownSpell - Fail Wrong Spell', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacter();
    let id = await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);
    expect(db[0].Spells.length).toBe(0);

    let spell = getRandomThingSplice(randomSpells);
    //Add it to character
    await characterModel.addKnownSpell(id, spell.id, randomCharacter.UserId);

    let db2 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db2)).toBe(true);
    expect(db2.length).toBe(1);
    expect(db2[0].Spells.length).toBe(1);



    await expect(characterModel.removeKnownSpell(id, 10000, randomCharacter.UserId)).rejects.toThrow(InvalidInputError);
    await expect(characterModel.removeKnownSpell(id, 10000, randomCharacter.UserId)).rejects.toThrow(`Spell You're trying to remove doesn't exists`);

    let db3 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db3)).toBe(true);
    expect(db3.length).toBe(1);
    expect(db3[0].Spells.length).toBe(1);

});
test('getUserCharacters - Fail', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacter();
    let id = await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);
    expect(db.length).toBe(1);


    await expect(characterModel.getUserCharacters(randomCharacter.UserId + 1)).rejects.toThrow(InvalidInputError);

    await expect(characterModel.getUserCharacters(randomCharacter.UserId + 1)).rejects.toThrow(`User does not exists or has no characters`);
});
test('removeCharacter - Success', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacterSplice();
    let randomCharacter2 = getRandomCharacterSplice();

    // change the UserId so its the same
    randomCharacter2.UserId = randomCharacter.UserId;
    let id = await characterModel.addCharacterObject(randomCharacter);
    let id2 = await characterModel.addCharacterObject(randomCharacter2);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);
    expect(db.length).toBe(2);


    await characterModel.removeCharacter(id);

    let db2 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db2)).toBe(true);
    expect(db2.length).toBe(1);
    expect(db2[0].Id).toBe(id2);

});
test('removeCharacter - Fail', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacterSplice();
    let randomCharacter2 = getRandomCharacterSplice();

    // change the UserId so its the same
    randomCharacter2.UserId = randomCharacter.UserId;
    let id = await characterModel.addCharacterObject(randomCharacter);
    let id2 = await characterModel.addCharacterObject(randomCharacter2);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);
    expect(db.length).toBe(2);


    await characterModel.removeCharacter(id);

    await expect(characterModel.removeCharacter(id)).rejects.toThrow(InvalidInputError);
    await expect(characterModel.removeCharacter(id)).rejects.toThrow(`does not exist in the Database`);
});
test.only('levelUp - Success', async () =>
{
    // Add 3 users since the highest user id in a random character is 3
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    // Add random character
    const randomCharacter = getRandomCharacter();

    let id = await characterModel.addCharacterObject(randomCharacter);
    let db = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db)).toBe(true);
    expect(db.length).toBe(1);
    expect(db[0].Level).toBe(randomCharacter.Level);

    await characterModel.levelUp(id);

    let db2 = await characterModel.getUserCharacters(randomCharacter.UserId);
    expect(Array.isArray(db2)).toBe(true);
    expect(db2.length).toBe(1);
    expect(db2[0].Level).toBe(randomCharacter.Level);

});