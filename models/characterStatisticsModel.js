const mysql = require('mysql2/promise')
const validationModel = require('./validateRaceUtils')
const logger = require('../logger');
const fs = require('fs/promises');
const { InvalidInputError, DatabaseError } = require('./errorModel');

* Ability - 
  * CREATE TABLE IF NOT EXISTS Ability(Id INT, Name TEXT, PRIMARY KEY(Id));
* Skill (ability) - 
  * CREATE TABLE IF NOT EXISTS Skill(Id INT, AbilityId INT, Name TEXT, PRIMARY KEY(Id), FOREIGN KEY (AbilityId) REFERENCES Ability(Id));
* Saving Throw Proficiency (playercharacter, ability) - 
  * CREATE TABLE IF NOT EXISTS SavingThrowProficiency(CharacterId INT, AbilityId INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (AbilityId) REFERENCES Ability(Id), PRIMARY KEY (CharacterId, AbilityId));
* Skill Proficiency (playercharacter, skill) -
  * CREATE TABLE IF NOT EXISTS SkillProficiency(CharacterId INT, SkillId INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (SkillId) REFERENCES Skill(Id), PRIMARY KEY (CharacterId, SkillId));
* Skill Expertise (playercharacter, skill) - 
  * CREATE TABLE IF NOT EXISTS SkillExpertise(CharacterId INT, SkillId INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (SkillId) REFERENCES Skill(Id), PRIMARY KEY (CharacterId, SkillId));
* Saving Throw Bonus (playercharacter, ability) -
  * CREATE TABLE IF NOT EXISTS SavingThrowBonus(CharacterId INT, AbilityId INT, Bonus INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (AbilityId) REFERENCES Ability(Id), PRIMARY KEY(AbilityId, CharacterId));
* Ability Score (playercharacter, ability) -
  * CREATE TABLE IF NOT EXISTS AbilityScore(CharacterId INT, AbilityId INT, Score INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (AbilityId) REFERENCES Ability(Id), PRIMARY KEY(AbilityId, CharacterId));

let connection;
/**
 * Initializes the passed database by creating a connection.
 * @param {String} databaseName the name of the database to write to.
 * @throws {DatabaseError} Thrown when the connection fails to be made.
 */
async function initialize(databaseName) {

    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            port: '10000',
            password: 'pass',
            database: databaseName
        });
    }
    catch (error) {
        throw new DatabaseError('raceModel', 'initialize', `Failed to connect to the dnd database in the docker container. Make sure the docker container is running: ${error.message}`);
    }

}

async function createAbilityTable(){



}


async function createSkillTable(){

}

async function createSavingThrowProficiencyTable(){

}

async function createSkillProficiencyTable(){

}

async function createSkillExpertiseTable(){

}

async function createSavingThrowBonusTable(){

}

async function createAbilityScoreTable(){
    const commands = [
        "CREATE TABLE IF NOT EXISTS Ability(Id INT, Name TEXT, PRIMARY KEY(Id));",
        "CREATE TABLE IF NOT EXISTS Skill(Id INT, AbilityId INT, Name TEXT, PRIMARY KEY(Id), FOREIGN KEY (AbilityId) REFERENCES Ability(Id));" ,
        "CREATE TABLE IF NOT EXISTS SavingThrowProficiency(CharacterId INT, AbilityId INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (AbilityId) REFERENCES Ability(Id), PRIMARY KEY (CharacterId, AbilityId));",
        
    ]
}

/**
 * Drops the tables that need to be dropped before the character model's tables are dropped.
 * @param {Object} connection A connection to the dnd database.
 * @throws {DatabaseError} Thrown usually when the connection is closed or invalid.
 */
async function dropTables(){
    const dropCommand = "DROP TABLE IF EXISTS AbilityScore" +
    "DROP TABLE IF EXISTS SavingThrowBonus" +
    "DROP TABLE IF EXISTS SkillExpertise" +
    "DROP TABLE IF EXISTS SkillProficiency" +
    "DROP TABLE IF EXISTS SavingThrowProficiency" +
    "DROP TABLE IF EXISTS Skill;" + 
    "DROP TABLE IF EXISTS Ability;"

    try{
        await connection.execute(dropCommand);
    }
    catch(error){
        throw new DatabaseError('characterStatisticsModel', 'dropTables', `Failed to drop the statistics table from the database: ${error}`);
    }
                         
}

async function createTables(){
    await createAbilityTable();
    await createSkillTable();
    await createSavingThrowProficiencyTable();
    await createSkillProficiencyTable();
    await createSkillExpertiseTable();
    await createSavingThrowBonusTable();
    await createAbilityScoreTable();
}

module.exports = {initialize, dropTables, createTables}