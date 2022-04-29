const mysql = require('mysql2/promise')
const validationModel = require('./validateRaceUtils')
const logger = require('../logger');
const fs = require('fs/promises');
const { InvalidInputError, DatabaseError } = require('./errorModel');



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
        throw new DatabaseError('characterStatisticsModel', 'initialize', `Failed to connect to the dnd database in the docker container. Make sure the docker container is running: ${error.message}`);
    }

}

/**
 * Creates and populates the ability table.
 */
async function createAbilityTable(){
    const createTableCommand = "CREATE TABLE IF NOT EXISTS Ability(Id INT, Name TEXT, PRIMARY KEY(Id));";

    try{
        await connection.execute(createTableCommand);
    }
    catch(error){
        throw new DatabaseError("characterStatisticsModel", 'createAbilityTable', `Failed to create the ability table, likely due to an undefined connection: ${error}`)
    }
}

/**
 * Creates and populates the skill table.
 */
async function createSkillTable(){
    const createTableCommand = `CREATE TABLE IF NOT EXISTS Skill(Id INT, AbilityId INT, Name TEXT, PRIMARY KEY(Id), FOREIGN KEY (AbilityId) REFERENCES Ability(Id));`;

    try{
        await connection.execute(createTableCommand);
    }
    catch(error){
        throw new DatabaseError("characterStatisticsModel", "createSkillTable", `Failed to create the ability table, likely due to an undefined connection: ${error}`)
    }
}

/**
 * Creates the saving throw proficiency table.
 */
async function createSavingThrowProficiencyTable(){
    const createTableCommand = "CREATE TABLE IF NOT EXISTS SavingThrowProficiency(CharacterId INT, AbilityId INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (AbilityId) REFERENCES Ability(Id), PRIMARY KEY (CharacterId, AbilityId));";

    try{
        await connection.execute(createTableCommand);
    }
    catch(error){
        throw new DatabaseError("characterStatisticsModel", 'createSavingThrowProficiencyTable', `Failed to create the saving throw proficiency table, likely due to an undefined connection: ${error}`)
    }
}

/**
 * Creates the skill proficiency table.
 */
async function createSkillProficiencyTable(){
    const createTableCommand = "CREATE TABLE IF NOT EXISTS SkillProficiency(CharacterId INT, SkillId INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (SkillId) REFERENCES Skill(Id), PRIMARY KEY (CharacterId, SkillId));";

    try{
        await connection.execute(createTableCommand);
    }
    catch(error){
        throw new DatabaseError("characterStatisticsModel", 'createSkillProficiencyTable', `Failed to create the skill proficiency table, likely due to an undefined connection: ${error}`)
    }
}

/**
 * Creates the skill expertise table.
 */
async function createSkillExpertiseTable(){
    const createTableCommand = "CREATE TABLE IF NOT EXISTS SkillExpertise(CharacterId INT, SkillId INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (SkillId) REFERENCES Skill(Id), PRIMARY KEY (CharacterId, SkillId));";

    try{
        await connection.execute(createTableCommand);
    }
    catch(error){
        throw new DatabaseError("characterStatisticsModel", 'createSkillExpertiseTable', `Failed to create the skill expertise table, likely due to an undefined connection: ${error}`)
    }
}

/**
 * Creates the saving throw bonus table.
 */
async function createSavingThrowBonusTable(){
    const createTableCommand = "CREATE TABLE IF NOT EXISTS SavingThrowBonus(CharacterId INT, AbilityId INT, Bonus INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (AbilityId) REFERENCES Ability(Id), PRIMARY KEY(AbilityId, CharacterId));";

    try{
        await connection.execute(createTableCommand);
    }
    catch(error){
        throw new DatabaseError("characterStatisticsModel", 'createSavingThrowBonusTable', `Failed to create the saving throw bonus table, likely due to an undefined connection: ${error}`)
    }
}

/**
 * Creates the ability score table.
 */
async function createAbilityScoreTable(){
    const createTableCommand = "CREATE TABLE IF NOT EXISTS AbilityScore(CharacterId INT, AbilityId INT, Score INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (AbilityId) REFERENCES Ability(Id), PRIMARY KEY(AbilityId, CharacterId));";

    try{
        await connection.execute(createTableCommand);
    }
    catch(error){
        throw new DatabaseError("characterStatisticsModel", 'createAbilityScoreTable', `Failed to create the ability score table, likely due to an undefined connection: ${error}`)
    }

}

/**
 * Drops the tables that need to be dropped before the character model's tables are dropped.
 * @param {Object} connection A connection to the dnd database.
 * @throws {DatabaseError} Thrown usually when the connection is closed or invalid.
 */
async function dropTables(){
    const dropCommand = "DROP TABLE IF EXISTS AbilityScore; "

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