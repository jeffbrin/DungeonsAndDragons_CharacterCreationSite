const userModel = require('../../models/userModel');
const characterStatsModel = require('../../models/characterStatisticsModel');
const characterModel = require('../../models/characterModel');
const spellModel = require('../../models/spellModel');
const backgroundModel = require('../../models/backgroundModel');
const classModel = require('../../models/classModel');
const raceModel = require('../../models/raceModel');
const fs = require('fs/promises');
const dbName = 'dnd_db_testing';
const app = require('../../app');
const { DatabaseError, InvalidInputError } = require('../../models/errorModel');
const superTest = require('supertest');
let randomCharacters;
let randomSpells;
let testRequest;
const user = { username: 'sam', password: 'myPassword123' };

//#region Before Each After Each
// Initialize the database before each test.
beforeEach(async () =>
{
    testRequest = superTest.agent(app);
    await userModel.initialize(dbName, true);
    await classModel.initialize(dbName, true);
    await backgroundModel.initialize(dbName, true);
    await raceModel.initialize(dbName, true);
    await spellModel.initialize(dbName, false);
    await characterModel.initialize(dbName, true);
    await characterStatsModel.initialize(dbName);
    await characterStatsModel.dropTables();
    await characterStatsModel.createTables();
    randomCharacters = [
        {
            UserId: 1, ClassId: 1, RaceId: 1, EthicsId: 1, MoralityId: 1, BackgroundId: 1, Name: "Samuel The Great",
            ProficiencyBonus: 2, MaxHP: 44, Level: 3, ArmorClass: 34, Speed: 25, Initiative: 23, Experience: 333,
            AbilityScoreValues: [10, 11, 14, 12, 16, 11], ProficiencyBonus: 3, SavingThrowProficienciesIds: [1, 3]
        },

        {
            UserId: 1, ClassId: 4, RaceId: 5, EthicsId: 2, MoralityId: 3, BackgroundId: 4, Name: "Chase The Menace",
            ProficiencyBonus: 2, MaxHP: 44, Level: 3, ArmorClass: 34, Speed: 25, Initiative: 23, Experience: 444,
            AbilityScoreValues: [10, 11, 14, 21, 11, 21], ProficiencyBonus: 3, SavingThrowProficienciesIds: [2, 3]
        },

        {
            UserId: 1, ClassId: 1, RaceId: 5, EthicsId: 1, MoralityId: 1, BackgroundId: 1, Name: "Jeff The Best",
            ProficiencyBonus: 2, MaxHP: 44, Level: 3, ArmorClass: 34, Speed: 25, Initiative: 23, Experience: 555,
            AbilityScoreValues: [14, 11, 11, 16, 15, 10], ProficiencyBonus: 6, SavingThrowProficienciesIds: [2, 4]
        },

        {
            UserId: 1, ClassId: 1, RaceId: 2, EthicsId: 1, MoralityId: 2, BackgroundId: 1, Name: "Talib The GOAT",
            ProficiencyBonus: 2, MaxHP: 44, Level: 3, ArmorClass: 34, Speed: 25, Initiative: 23, Experience: 333,
            AbilityScoreValues: [21, 12, 21, 13, 13, 11], ProficiencyBonus: 4, SavingThrowProficienciesIds: [3]
        },

        {
            UserId: 1, ClassId: 5, RaceId: 3, EthicsId: 2, MoralityId: 1, BackgroundId: 2, Name: "Eren",
            ProficiencyBonus: 2, MaxHP: 44, Level: 3, ArmorClass: 34, Speed: 25, Initiative: 23, Experience: 234,
            AbilityScoreValues: [10, 10, 21, 16, 10, 10], ProficiencyBonus: 2, SavingThrowProficienciesIds: [2, 5]
        },

        {
            UserId: 1, ClassId: 1, RaceId: 4, EthicsId: 3, MoralityId: 3, BackgroundId: 1, Name: "Nosferatu",
            ProficiencyBonus: 2, MaxHP: 44, Level: 3, ArmorClass: 34, Speed: 25, Initiative: 23, Experience: 765,
            AbilityScoreValues: [10, 13, 10, 11, 11, 5], ProficiencyBonus: 2, SavingThrowProficienciesIds: [5, 6]
        },

        {
            UserId: 1, ClassId: 1, RaceId: 1, EthicsId: 1, MoralityId: 1, BackgroundId: 2, Name: "DEEZ",
            ProficiencyBonus: 2, MaxHP: 44, Level: 3, ArmorClass: 34, Speed: 25, Initiative: 23, Experience: 69420,
            AbilityScoreValues: [10, 12, 15, 15, 11, 9], ProficiencyBonus: 5, SavingThrowProficienciesIds: [1, 6]
        },

        {
            UserId: 1, ClassId: 3, RaceId: 3, EthicsId: 1, MoralityId: 2, BackgroundId: 4, Name: "BALLZ",
            ProficiencyBonus: 2, MaxHP: 44, Level: 3, ArmorClass: 34, Speed: 25, Initiative: 23, Experience: 6969,
            AbilityScoreValues: [22, 13, 13, 12, 10, 11], ProficiencyBonus: 1, SavingThrowProficienciesIds: [2, 6]
        },

        {
            UserId: 1, ClassId: 5, RaceId: 1, EthicsId: 3, MoralityId: 1, BackgroundId: 6, Name: "Sir William Alexander The Fourth Jr",
            ProficiencyBonus: 2, MaxHP: 44, Level: 3, ArmorClass: 34, Speed: 25, Initiative: 23, Experience: 4444,
            AbilityScoreValues: [10, 10, 10, 10, 10, 10], ProficiencyBonus: 4, SavingThrowProficienciesIds: [3, 6]
        }
    ];
    randomSpells = [{ id: 1, name: "Abi-Dalzim's Horrid Wilting", desc: "You draw the moisture from every creature in a 30-foot cube centered on a point you choose within range. Each creature in that area must make a Constitution saving throw. Constructs and undead aren't affected, and plants and water elementals make this saving throw with disadvantage. A creature takes 10d8 necrotic damage on a failed save, or half as much damage on a successful one.You hurl a bubble of acid. Choose one creature within range, or choose two creatures within range that are within 5 feet of each other. A target must succeed on a Dexterity saving throw or take 1d6 acid damage.This spells damage increases by 1d6 when you reach 5th Level (2d6), 11th level (3d6) and 17th level (4d6).", page: "ee pc 15", range: "150 feet", components: "V, S, M", material: "A bit of sponge.", ritual: "no", duration: "Instantaneous", concentration: "no", casting_time: "1 action", level: "8", school: "Necromancy", class: "Sorcerer, Wizard" },
    { id: 2, name: "Absorb Elements", desc: "The spell captures some of the incoming energy, lessening its effect on you and storing it for your next melee attack. You have resistance to the triggering damage type until the start of your next turn. Also, the first time you hit with a melee attack on your next turn, the target takes an extra 1d6 damage of the triggering type, and the spell ends.", higher_level: "When you cast this spell using a spell slot of 2nd level or higher, the extra damage increases by 1d6 for each slot level above 1st.", page: "ee pc 15", range: "Self", components: "S", ritual: "no", duration: "1 round", concentration: "no", casting_time: "1 action", level: "1", school: "Abjuration", class: "Druid, Ranger, Wizard" },
    { id: 3, name: "Acid Splash", desc: "You hurl a bubble of acid. Choose one creature within range, or choose two creatures within range that are within 5 feet of each other. A target must succeed on a dexterity saving throw or take 1d6 acid damage. This spell's damage increases by 1d6 when you reach 5th level (2d6), 11th level (3d6), and 17th level (4d6).", page: "phb 211", range: "60 feet", components: "V, S", ritual: "no", duration: "Instantaneous", concentration: "no", casting_time: "1 action", level: "0", school: "Conjuration", class: "Sorcerer, Wizard" },
    { id: 4, name: "Aganazzar's Scorcher", desc: "A line of roaring flame 30 feet long and 5 feet wide emanates from you in a direction you choose. Each creature in the line must make a Dexterity saving throw. A creature takes 3d8 fire damage on a failed save, or half as much damage on a successful one.", higher_level: "When you cast this spell using a spell slot of 3nd level or higher, the damage increases by 1d8 for each slot level above 2st.", page: "ee pc 15", range: "30 feet", components: "V, S, M", material: "A red dragon's scale.", ritual: "no", duration: "Instantaneous", concentration: "no", casting_time: "1 action", level: "2", school: "Evocation", class: "Sorcerer, Wizard" },
    { id: 5, name: "Aid", desc: "Your spell bolsters your allies with toughness and resolve. Choose up to three creatures within range. Each target's hit point maximum and current hit points increase by 5 for the duration.", higher_level: "When you cast this spell using a spell slot of 3rd level or higher, a target's hit points increase by an additional 5 for each slot level above 2nd.", page: "phb 211", range: "30 feet", components: "V, S, M", material: "A tiny strip of white cloth.", ritual: "no", duration: "8 hours", concentration: "no", casting_time: "1 action", level: "2", school: "Abjuration", class: "Cleric, Paladin" },
    { id: 6, name: "Alarm", desc: "You set an alarm against unwanted intrusion. Choose a door, a window, or an area within range that is no larger than a 20-foot cube. Until the spell ends, an alarm alerts you whenever a Tiny or larger creature touches or enters the warded area. When you cast the spell, you can designate creatures that won't set off the alarm. You also choose whether the alarm is mental or audible.A mental alarm alerts you with a ping in your mind if you are within 1 mile of the warded area. This ping awakens you if you are sleeping.An audible alarm produces the sound of a hand bell for 10 seconds within 60 feet.", page: "phb 211", range: "30 feet", components: "V, S, M", material: "A tiny bell and a piece of fine silver wire.", ritual: "yes", duration: "8 hours", concentration: "no", casting_time: "1 minute", level: "1", school: "Abjuration", class: "Ranger, Ritual Caster, Wizard" },
    { id: 7, name: "Alter Self", desc: "You assume a different form. When you cast the spell, choose one of the following options, the effects of which last for the duration of the spell. While the spell lasts, you can end one option as an action to gain the benefits of a different one.Aquatic Adaptation. You adapt your body to an aquatic environment, sprouting gills and growing webbing between your fingers. You can breathe underwater and gain a swimming speed equal to your walking speed.Change Appearance. You transform your appearance. You decide what you look like, including your height, weight, facial features, sound of your voice, hair length, coloration, and distinguishing characteristics, if any. You can make yourself appear as a member of another race, though none of your statistics change. You also can't appear as a creature of a different size than you, and your basic shape stays the same; if you're bipedal, you can't use this spell to become quadrupedal, for instance. At any time for the duration of the spell, you can use your action to change your appearance in this way again.Natural Weapons. You grow claws, fangs, spines, horns, or a different natural weapon of your choice. Your unarmed strikes deal 1d6 bludgeoning, piercing, or slashing damage, as appropriate to the natural weapon you chose, and you are proficient with your unarmed strikes. Finally, the natural weapon is magic and you have a +1 bonus to the attack and damage rolls you make using it.", page: "phb 211", range: "Self", components: "V, S", ritual: "no", duration: "Up to 1 hour", concentration: "yes", casting_time: "1 action", level: "2", school: "Transmutation", class: "Sorcerer, Wizard" },
    { id: 8, name: "Animal Friendship", desc: "This spell lets you convince a beast that you mean it no harm. Choose a beast that you can see within range. It must see and hear you. If the beast's Intelligence is 4 or higher, the spell fails. Otherwise, the beast must succeed on a wisdom saving throw or be charmed by you for the spell's duration. If you or one of your companions harms the target, the spells ends.", higher_level: "When you cast this spell using a spell slot of 2nd level or higher, you can affect one additional beast for each slot level above 1st.", page: "phb 212", range: "30 feet", components: "V, S, M", material: "A morsel of food.", ritual: "no", duration: "24 hours", concentration: "no", casting_time: "1 action", level: "1", school: "Enchantment", class: "Bard, Cleric, Druid, Ranger", archetype: "Cleric: Nature", domains: "Nature" }
    ];
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
//#endregion

//#region Helpers
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
//#endregion

test('GET - characterListPage - Success', async () =>
{
    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    await characterModel.addCharacterObject(char1);
    await characterModel.addCharacterObject(char2);

    const testResponse = await testRequest.get('/characters');
    expect(testResponse.status).toBe(201);
});
test('GET - characterListPage - Fail', async () =>
{
    const testResponse = await testRequest.get('/characters');
    expect(testResponse.status).toBe(302);
    expect(testResponse.headers.location).toMatch(/\/home/);
    expect(testResponse.headers.location).toMatch(/access/);
});
test('GET - characterSoloPage - Success', async () =>
{
    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    const testResponse = await testRequest.get(`/characters/${ id }`);
    expect(testResponse.status).toBe(201);
});

test('PUT updateHp - Success', async () =>
{
    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    const testResponse = await testRequest.get(`/characters/${ id }`);
    expect(testResponse.status).toBe(201);

    let db = await characterModel.getUserCharacters(1);
    expect(db.length).toBe(2);
    expect(db[0].CurrentHp).toBe(char1.MaxHP);

    let hpShouldBe = db[0].CurrentHp + 5;


    const testResponse2 = await testRequest.put(`/characters/${ id }/hp`).send({ hp: 5 });
    //302 is redirect
    expect(testResponse2.status).toBe(302);
    expect(testResponse2.body["Hitpoints have been Modified!"]);
    expect(testResponse2.headers.location).toContain(`/characters/${ id }`);

    let db2 = await characterModel.getUserCharacters(1);
    expect(db2.length).toBe(2);
    expect(db2[0].CurrentHp).toBe(hpShouldBe);
});
test('PUT updateHp - Fail', async () =>
{
    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    const testResponse = await testRequest.get(`/characters/${ id }`);
    expect(testResponse.status).toBe(201);

    let db = await characterModel.getUserCharacters(1);
    expect(db.length).toBe(2);
    expect(db[0].CurrentHp).toBe(char1.MaxHP);

    let hpShouldBe = db[0].CurrentHp;


    const testResponse2 = await testRequest.put(`/characters/${ id }/hp`).send({ hitpoints: 5 });
    //302 is redirect
    expect(testResponse2.status).toBe(302);
    expect(testResponse2.headers.location).toContain(`/characters/${ id }`);

    let db2 = await characterModel.getUserCharacters(1);
    expect(db2.length).toBe(2);
    expect(db2[0].CurrentHp).toBe(hpShouldBe);
});
test('PUT updateExp - Success', async () =>
{
    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    const testResponse = await testRequest.get(`/characters/${ id }`);
    expect(testResponse.status).toBe(201);

    let db = await characterModel.getUserCharacters(1);
    expect(db.length).toBe(2);
    expect(db[0].Experience).toBe(0);

    const testResponse2 = await testRequest.put(`/characters/${ id }/experiencepoints`).send({ experiencePoints: 300 });
    expect(testResponse2.status).toBe(302);

    expect(testResponse2.headers.location).toContain(`/characters/${ id }`);

    let db2 = await characterModel.getUserCharacters(1);
    expect(db2.length).toBe(2);
    expect(db2[0].Experience).toBe(300);
});
test('PUT updateExp - FAIL', async () =>
{
    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    const testResponse = await testRequest.get(`/characters/${ id }`);
    expect(testResponse.status).toBe(201);

    let db = await characterModel.getUserCharacters(1);
    expect(db.length).toBe(2);
    expect(db[0].Experience).toBe(0);

    const testResponse2 = await testRequest.put(`/characters/${ id }/experiencepoints`).send({ exp: 300 });
    expect(testResponse2.status).toBe(302);

    expect(testResponse2.headers.location).toContain(`/characters/${ id }`);

    let db2 = await characterModel.getUserCharacters(1);
    expect(db2.length).toBe(2);
    expect(db2[0].Experience).toBe(0);
});
test('PUT updateCharacter - Success', async () =>
{
    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    zhar = getRandomCharacterSplice();
    const testResponse = await testRequest.put(`/characters/${ id }`).send({
        charClass: zhar.ClassId, race: zhar.RaceId, ethics: zhar.EthicsId, morality: zhar.MoralityId, background: zhar.BackgroundId, charName: zhar.Name,
        maxHp: zhar.MaxHP, level: zhar.Level,
        strength: zhar.AbilityScoreValues[0], dexterity: zhar.AbilityScoreValues[1], constitution: zhar.AbilityScoreValues[2],
        intelligence: zhar.AbilityScoreValues[3], wisdom: zhar.AbilityScoreValues[4], charisma: zhar.AbilityScoreValues[5]
        , savingThrows: zhar.SavingThrowProficienciesIds, proficiencyBonus: zhar.ProficiencyBonus,
        userId: char1.UserId, armorClass: zhar.ArmorClass, initiative: zhar.Initiative, speed: zhar.Speed
    });

    expect(testResponse.status).toBe(302);
    expect(testResponse.headers.location).toContain(`/characters/${ id }`);
});
test('PUT updateCharacter - Fail', async () =>
{
    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    zhar = getRandomCharacterSplice();
    const testResponse = await testRequest.put(`/characters/${ id }`).send({
        charClass: zhar.ClassId, race: 333, ethics: zhar.EthicsId, morality: zhar.MoralityId, background: zhar.BackgroundId, charName: zhar.Name,
        maxHp: zhar.MaxHP, level: zhar.Level,
        strength: zhar.AbilityScoreValues[0], dexterity: zhar.AbilityScoreValues[1], constitution: zhar.AbilityScoreValues[2],
        intelligence: zhar.AbilityScoreValues[3], wisdom: zhar.AbilityScoreValues[4], charisma: zhar.AbilityScoreValues[5]
        , savingThrows: zhar.SavingThrowProficienciesIds, proficiencyBonus: zhar.ProficiencyBonus,
        userId: char1.UserId, armorClass: zhar.ArmorClass, initiative: zhar.Initiative, speed: zhar.Speed
    });

    expect(testResponse.status).toBe(302);
    expect(testResponse.headers.location).toContain(`/characters/${ id }`);

    let db = await characterModel.getUserCharacters(1);
    expect(db.length).toBe(2);
    expect(db[1].Name).not.toBe(zhar.Name);
});
test('DELETE deleteCharacter - Success', async () =>
{
    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    let db = await characterModel.getUserCharacters(1);
    expect(db.length).toBe(2);

    const testResponse = await testRequest.delete(`/characters/${ id }`);

    expect(testResponse.status).toBe(201);

    let db2 = await characterModel.getUserCharacters(1);
    expect(db2.length).toBe(1);
});
test('DELETE deleteCharacter - FAIL', async () =>
{
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    let db = await characterModel.getUserCharacters(1);
    expect(db.length).toBe(2);

    //no session so should fail input
    const testResponse = await testRequest.delete(`/characters/${ id }`);

    expect(testResponse.status).toBe(302);
    expect(testResponse.headers.location).toMatch(/\/home/);
    expect(testResponse.headers.location).toMatch(/access/);

    let db2 = await characterModel.getUserCharacters(1);
    expect(db2.length).toBe(2);
});
test('PUT updateLevel - Success', async () =>
{

    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    let db = await characterModel.getUserCharacters(1);
    expect(db.length).toBe(2);
    expect(db[0].Level).toBe(char1.Level);

    const testResponse = await testRequest.put(`/characters/${ id }/levels`);

    expect(testResponse.status).toBe(302);
    expect(testResponse.headers.location).toContain(`/characters/${ id }`);
    expect(testResponse.headers.location).not.toContain('/levels');

    let db2 = await characterModel.getUserCharacters(1);
    expect(db2[0].Level).toBe(char1.Level + 1);
});
test('PUT updateLevel - FAIL', async () =>
{
    await userModel.addUser('user1', 'Password1');
    await userModel.addUser('user2', 'Password2');
    await userModel.addUser('user3', 'Password3');

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    let db = await characterModel.getUserCharacters(1);
    expect(db.length).toBe(2);
    expect(db[0].Level).toBe(char1.Level);

    //no session so should fail input
    const testResponse = await testRequest.put(`/characters/${ id }/levels`);

    expect(testResponse.status).toBe(302);

    let db2 = await characterModel.getUserCharacters(1);
    expect(db2.length).toBe(2);
    expect(db2[0].Level).toBe(char1.Level);
});
test('PUT addItem - Success', async () =>
{
    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    let db = await characterModel.getUserCharacters(1);
    expect(db.length).toBe(2);
    expect(db[0].OwnedItems.length).toBe(0);

    let item = getRandomThingSplice(randomItem);
    let item2 = getRandomThingSplice(randomItem);

    const testResponse = await testRequest.put(`/characters/${ id }/items`).send({ itemName: item.Name, itemQuantity: item.Quantity });

    expect(testResponse.status).toBe(302);

    let db2 = await characterModel.getUserCharacters(1);
    expect(db2.length).toBe(2);
    expect(db2[0].OwnedItems.length).toBe(1);

    const testResponse2 = await testRequest.put(`/characters/${ id }/items`).send({ itemName: item2.Name, itemQuantity: item2.Quantity });

    expect(testResponse2.status).toBe(302);

    let db3 = await characterModel.getUserCharacters(1);
    expect(db3.length).toBe(2);
    expect(db3[0].OwnedItems.length).toBe(2);
});
test('PUT addItem - Fail', async () =>
{
    await userModel.addUser('user1', 'Password1');

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    let db = await characterModel.getUserCharacters(1);
    expect(db.length).toBe(2);
    expect(db[0].OwnedItems.length).toBe(0);

    let item = getRandomThingSplice(randomItem);
    let item2 = getRandomThingSplice(randomItem);

    const testResponse = await testRequest.put(`/characters/${ id }/items`).send({ itemName: item.Name, itemQuantity: item.Quantity });

    expect(testResponse.status).toBe(302);

    let db2 = await characterModel.getUserCharacters(1);
    expect(db2.length).toBe(2);
    expect(db2[0].OwnedItems.length).toBe(0);

    const testResponse2 = await testRequest.put(`/characters/${ id }/items`).send({ itemName: item2.Name, itemQuantity: item2.Quantity });

    expect(testResponse2.status).toBe(302);

    let db3 = await characterModel.getUserCharacters(1);
    expect(db3.length).toBe(2);
    expect(db3[0].OwnedItems.length).toBe(0);
});
test('GET sendToUpdateController - Success', async () =>
{
    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);


    const testResponse = await testRequest.get(`/characters/forms/${ id }`);

    expect(testResponse.status).toBe(200);
});
test('GET sendToUpdateController - Fail', async () =>
{
    await userModel.addUser('user1', 'Password1');

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);


    const testResponse = await testRequest.get(`/characters/forms/${ id }`);

    expect(testResponse.status).toBe(302);
    expect(testResponse.headers.location).toMatch(/\/home/);
    expect(testResponse.headers.location).toMatch(/access/);
});
test('GET sendToCreatePage - Success', async () =>
{
    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();


    const testResponse = await testRequest.get(`/characters/new`);

    expect(testResponse.status).toBe(200);
});
test('GET sendToCreatePage - Fail', async () =>
{
    await userModel.addUser('user1', 'Password1');


    const testResponse = await testRequest.get(`/characters/new/`);

    expect(testResponse.status).toBe(302);
    expect(testResponse.headers.location).toMatch(/\/home/);
    expect(testResponse.headers.location).toMatch(/access/);
});
test('Put addProficiencyController - Success', async () =>
{
    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    let proficiencies = await characterStatsModel.getSkillProficiencies(id);
    expect(proficiencies.length).toBe(0);

    const testResponse = await testRequest.put(`/characters/${ id }/proficiencies`).send({ skillId: 1, characterId: id });

    let proficiencies2 = await characterStatsModel.getSkillProficiencies(id);
    expect(proficiencies2.length).toBe(1);
    expect(proficiencies2[0]).toBe(1);

    expect(testResponse.status).toBe(302);
    expect(testResponse.headers.location).toMatch(/\/characters\/1/);
    expect(testResponse.headers.location).toMatch(/Added/);
});
test('Put addProficiencyController - Fail', async () =>
{
    await userModel.addUser('user1', 'Password1');

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    let proficiencies = await characterStatsModel.getSkillProficiencies(id);
    expect(proficiencies.length).toBe(0);

    const testResponse = await testRequest.put(`/characters/${ id }/proficiencies`).send({ skillId: 1, characterId: id });

    expect(testResponse.status).toBe(302);
    expect(testResponse.headers.location).toMatch(/\/home/);
    expect(testResponse.headers.location).toMatch(/access/);
    let proficiencies2 = await characterStatsModel.getSkillProficiencies(id);
    expect(proficiencies2.length).toBe(0);
    expect(proficiencies2[0]).toBe(undefined);
});
test('Put addExpertiseController - Success', async () =>
{
    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    let proficiencies = await characterStatsModel.getSkillExpertise(id);
    expect(proficiencies.length).toBe(0);

    const testResponse = await testRequest.put(`/characters/${ id }/expertise`).send({ skillId: 1, characterId: id });

    let proficiencies2 = await characterStatsModel.getSkillExpertise(id);
    expect(proficiencies2.length).toBe(1);
    expect(proficiencies2[0]).toBe(1);

    expect(testResponse.status).toBe(302);
    expect(testResponse.headers.location).toMatch(/\/characters\/1/);
    expect(testResponse.headers.location).toMatch(/Added/);
});
test('Put addExpertiseController - Fail', async () =>
{
    await userModel.addUser('user1', 'Password1');

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    let proficiencies = await characterStatsModel.getSkillExpertise(id);
    expect(proficiencies.length).toBe(0);

    const testResponse = await testRequest.put(`/characters/${ id }/expertise`).send({ skillId: 1, characterId: id });

    expect(testResponse.status).toBe(302);
    expect(testResponse.headers.location).toMatch(/\/home/);
    expect(testResponse.headers.location).toMatch(/access/);
    let proficiencies2 = await characterStatsModel.getSkillExpertise(id);
    expect(proficiencies2.length).toBe(0);
    expect(proficiencies2[0]).toBe(undefined);
});
test('Delete removeAllExpertiseAndProficiencies - Success', async () =>
{
    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    await characterStatsModel.addSkillProficiency(id, 1);

    let proficiencies2 = await characterStatsModel.getSkillProficiencies(id);
    expect(proficiencies2.length).toBe(1);
    expect(proficiencies2[0]).toBe(1);

    const testResponse = await testRequest.delete(`/characters/${ id }/proficiencies`).send({ skillId: 1, characterId: id });

    expect(testResponse.status).toBe(302);
    expect(testResponse.headers.location).toMatch(/\/characters\/1/);
    expect(testResponse.headers.location).toMatch(/Removed/);

    let proficiencies = await characterStatsModel.getSkillProficiencies(id);
    expect(proficiencies.length).toBe(0);
});
test('Delete removeAllExpertiseAndProficiencies - Fail', async () =>
{
    await userModel.addUser('user1', 'Password1');

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    await characterStatsModel.addSkillProficiency(id, 1);

    let proficienciess = await characterStatsModel.getSkillProficiencies(id);
    expect(proficienciess.length).toBe(1);
    expect(proficienciess[0]).toBe(1);


    const testResponse = await testRequest.delete(`/characters/${ id }/proficiencies`).send({ skillId: 1, characterId: id });

    expect(testResponse.status).toBe(302);
    expect(testResponse.headers.location).toMatch(/\/home/);
    expect(testResponse.headers.location).toMatch(/access/);
    let proficiencies2 = await characterStatsModel.getSkillProficiencies(id);
    expect(proficiencies2.length).toBe(1);
    expect(proficiencies2[0]).toBe(1);
});

test('GET sendToAddSpellPage - Success', async () =>
{
    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);


    const testResponse = await testRequest.get(`/characters/spells/${ id }`);

    expect(testResponse.status).toBe(200);
});
test('GET sendToAddSpellPage - Fail', async () =>
{
    await userModel.addUser('user1', 'Password1');


    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    const testResponse = await testRequest.get(`/characters/spells/${ id }`);

    expect(testResponse.status).toBe(302);
    expect(testResponse.headers.location).toMatch(/\/home/);
    expect(testResponse.headers.location).toMatch(/access/);
});
test('Put addSpellToCharacter - Success', async () =>
{
    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    let db = await characterModel.getUserCharacters(char1.UserId);
    expect(db[0].Spells.length).toBe(0);

    const testResponse = await testRequest.put(`/characters/spells/${ id }`).send({ spellId: 1 });

    expect(testResponse.status).toBe(302);
    expect(testResponse.headers.location).toMatch(/\/characters\/1/);
    expect(testResponse.headers.location).toMatch(/Added%20Spell/);

    let db2 = await characterModel.getUserCharacters(char1.UserId);
    expect(db2[0].Spells.length).toBe(1);
});
test('Put addSpellToCharacter - Fail', async () =>
{
    await userModel.addUser('user1', 'Password1');

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    let db = await characterModel.getUserCharacters(char1.UserId);
    expect(db[0].Spells.length).toBe(0);

    const testResponse = await testRequest.put(`/characters/spells/${ id }`).send({ spellId: 1 });


    expect(testResponse.status).toBe(302);
    expect(testResponse.headers.location).toMatch(/\/home/);
    expect(testResponse.headers.location).toMatch(/access/);
    let db2 = await characterModel.getUserCharacters(char1.UserId);
    expect(db2[0].Spells.length).toBe(0);
});
test('Put deleteSpellFromCharacter - Success', async () =>
{
    const registerResponse = await testRequest.post('/users').send(user);
    expect(registerResponse.status).toBe(201);
    const loginResponse = await testRequest.post('/sessions').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);


    let db = await characterModel.getUserCharacters(char1.UserId);
    expect(db[0].Spells.length).toBe(0);

    await characterModel.addKnownSpell(id, 1, char1.UserId);

    let db2 = await characterModel.getUserCharacters(char1.UserId);
    expect(db2[0].Spells.length).toBe(1);

    const testResponse = await testRequest.delete(`/characters/spells/${ id }`).send({ spellId: 1 });

    expect(testResponse.status).toBe(302);
    expect(testResponse.headers.location).toMatch(/\/characters\/1/);
    expect(testResponse.headers.location).toMatch(/Removed%20Spell/);

    let db3 = await characterModel.getUserCharacters(char1.UserId);
    expect(db3[0].Spells.length).toBe(0);
});
test('Put deleteSpellFromCharacter - Fail', async () =>
{
    await userModel.addUser('user1', 'Password1');

    let char1 = getRandomCharacterSplice();
    let char2 = getRandomCharacterSplice();
    char2.UserId = char1.UserId = 1;
    let id = await characterModel.addCharacterObject(char1);
    let id2 = await characterModel.addCharacterObject(char2);

    let db = await characterModel.getUserCharacters(char1.UserId);
    expect(db[0].Spells.length).toBe(0);

    await characterModel.addKnownSpell(id, 1, char1.UserId);

    let db2 = await characterModel.getUserCharacters(char1.UserId);
    expect(db2[0].Spells.length).toBe(1);

    const testResponse = await testRequest.delete(`/characters/spells/${ id }`).send({ spellId: 1 });


    expect(testResponse.status).toBe(302);
    expect(testResponse.headers.location).toMatch(/\/home/);
    expect(testResponse.headers.location).toMatch(/access/);


    let db3 = await characterModel.getUserCharacters(char1.UserId);
    expect(db3[0].Spells.length).toBe(1);
});