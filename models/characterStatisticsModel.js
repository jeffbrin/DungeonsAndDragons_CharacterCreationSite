
/*
* Model written by Jeffrey
*/

const mysql = require('mysql2/promise')
const validationModel = require('./validateCharacterAndStatistics')
const logger = require('../logger');
const fs = require('fs/promises');
const { InvalidInputError, DatabaseError } = require('./errorModel');


let connection;
/**
 * Initializes the passed database by creating a connection. 
 * Doesn't create the tables since there are foreign keys that rely on the characterModel.
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
 * Checks whether a table contains any content.
 * @param {String} tableName The name of the table to check.
 * @returns True if the table contains any records, false if it's empty.
 * @throws {DatabaseError} Thrown if the connection is invalid or if the table name does not exist.
 */
async function doesTableHaveContent(tableName) {
    try {
        [rows, columnData] = await connection.query(`SELECT * FROM ${tableName}`);
        return rows.length > 0;
    }
    catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'doesTableHaveContent', `Failed to query rows from the ${tableName} table: ${error}`);
    }
}

/**
 * Gets the id of a given ability from the database. 
 * The name should have a capitalized first letter.
 * @param {String} name The name of the ability to get the id of.
 * @returns The id of the given race.
 * @throws {DatabaseError} Thrown when the query failed. Common cause is an ability name not in the table or an undefined connection.
 */
async function getAbilityIdFromName(name) {
    try {
        [rows, columns] = await connection.query(`SELECT Id FROM Ability WHERE Name = '${name}'`);
    }
    catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'getAbilityIdFromName', `Failed to get the id of the requested ability from the database. Likely caused by an undefined connection: ${error}`)
    }

    // If the name wasn't found
    if (rows.length == 0) {
        throw new InvalidInputError('characterStatisticsModel', 'getAbilityIdFromName', `Failed to get the id of the ${name} ability because it was not found in the database.`);
    }

    return rows[0].Id;
}

/**
 * Creates and populates the ability table.
 * @throws {DatabaseError} Thrown when the table failed to be made usually due to an undefined connection.
 */
async function createAbilityTable() {
    const createTableCommand = "CREATE TABLE IF NOT EXISTS Ability(Id INT, Name TEXT, PRIMARY KEY(Id));";

    try {
        await connection.execute(createTableCommand);
    }
    catch (error) {
        throw new DatabaseError("characterStatisticsModel", 'createAbilityTable', `Failed to create the ability table, likely due to an undefined connection: ${error}`)
    }

    // Add the values if none are present
    if (!await (doesTableHaveContent('Ability'))) {

        // Read the abilities from the json
        let abilities;
        try {
            abilities = JSON.parse(await fs.readFile('database-content-json/abilities.json'));
        }
        catch (error) {
            throw new DatabaseError('characterStatisticsModel', 'createAbilityTable', `Failed to read from the abilities json file: ${error}`);
        }

        try {
            // Add each ability to the table
            for (let i = 1; i <= abilities.length; i++) {
                await connection.execute(`INSERT INTO Ability (Id, Name) values (${i}, '${abilities[i - 1]}');`);
            }
        } catch (error) {
            throw new DatabaseError('characterStatisticsModel', 'createAbilityTable', `Failed to insert the abilities into the database: ${error}`);
        }
    }
}

/**
 * Creates and populates the skill table.
 * @throws {DatabaseError} Thrown when the table failed to be made usually due to an undefined connection.
 */
async function createSkillTable() {
    const createTableCommand = `CREATE TABLE IF NOT EXISTS Skill(Id INT, AbilityId INT, Name TEXT, PRIMARY KEY(Id), FOREIGN KEY (AbilityId) REFERENCES Ability(Id));`;

    try {
        // Create the table
        await connection.execute(createTableCommand);
    }
    catch (error) {
        throw new DatabaseError("characterStatisticsModel", "createSkillTable", `Failed to create the ability table, likely due to an undefined connection: ${error}`)
    }

    // Add the values if none are present
    if (!await (doesTableHaveContent('Skill'))) {

        // Read the abilities from the json
        let skills;
        try {
            skills = JSON.parse(await fs.readFile('database-content-json/skills.json'));
        }
        catch (error) {
            throw new DatabaseError('characterStatisticsModel', 'createSkillTable', `Failed to read from the skills json file: ${error}`);
        }

        try {
            // Add each ability to the table
            for (let i = 1; i <= skills.length; i++) {
                await connection.execute(`INSERT INTO Skill (Id, AbilityId, Name) values (${i}, ${await getAbilityIdFromName(skills[i - 1].Ability)}, '${skills[i - 1].Name}');`);
            }
        } catch (error) {
            throw new DatabaseError('characterStatisticsModel', 'createAbilityTable', `Failed to insert the abilities into the database: ${error}`);
        }
    }
}

/**
 * Creates the saving throw proficiency table.
 * @throws {DatabaseError} Thrown when the table failed to be made usually due to an undefined connection.
 */
async function createSavingThrowProficiencyTable() {
    const createTableCommand = "CREATE TABLE IF NOT EXISTS SavingThrowProficiency(CharacterId INT, AbilityId INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (AbilityId) REFERENCES Ability(Id), PRIMARY KEY (CharacterId, AbilityId));";

    try {
        // Create the table
        await connection.execute(createTableCommand);
    }
    catch (error) {
        throw new DatabaseError("characterStatisticsModel", 'createSavingThrowProficiencyTable', `Failed to create the saving throw proficiency table, likely due to an undefined connection: ${error}`)
    }
}

/**
 * Creates the skill proficiency table.
 * @throws {DatabaseError} Thrown when the table failed to be made usually due to an undefined connection.
 */
async function createSkillProficiencyTable() {
    const createTableCommand = "CREATE TABLE IF NOT EXISTS SkillProficiency(CharacterId INT, SkillId INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (SkillId) REFERENCES Skill(Id), PRIMARY KEY (CharacterId, SkillId));";

    try {
        // Create the table
        await connection.execute(createTableCommand);
    }
    catch (error) {
        throw new DatabaseError("characterStatisticsModel", 'createSkillProficiencyTable', `Failed to create the skill proficiency table, likely due to an undefined connection: ${error}`)
    }
}

/**
 * Creates the skill expertise table.
 * @throws {DatabaseError} Thrown when the table failed to be made usually due to an undefined connection.
 */
async function createSkillExpertiseTable() {
    const createTableCommand = "CREATE TABLE IF NOT EXISTS SkillExpertise(CharacterId INT, SkillId INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (SkillId) REFERENCES Skill(Id), PRIMARY KEY (CharacterId, SkillId));";

    try {
        // Create the table
        await connection.execute(createTableCommand);
    }
    catch (error) {
        throw new DatabaseError("characterStatisticsModel", 'createSkillExpertiseTable', `Failed to create the skill expertise table, likely due to an undefined connection: ${error}`)
    }
}

/**
 * Creates the saving throw bonus table.
 * @throws {DatabaseError} Thrown when the table failed to be made usually due to an undefined connection.
 */
async function createSavingThrowBonusTable() {
    const createTableCommand = "CREATE TABLE IF NOT EXISTS SavingThrowBonus(CharacterId INT, AbilityId INT, Bonus INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (AbilityId) REFERENCES Ability(Id), PRIMARY KEY(AbilityId, CharacterId));";

    try {
        // Create the table
        await connection.execute(createTableCommand);
    }
    catch (error) {
        throw new DatabaseError("characterStatisticsModel", 'createSavingThrowBonusTable', `Failed to create the saving throw bonus table, likely due to an undefined connection: ${error}`)
    }
}

/**
 * Creates the ability score table.
 * @throws {DatabaseError} Thrown when the table failed to be made usually due to an undefined connection.
 */
async function createAbilityScoreTable() {
    const createTableCommand = "CREATE TABLE IF NOT EXISTS AbilityScore(CharacterId INT, AbilityId INT, Score INT, FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), FOREIGN KEY (AbilityId) REFERENCES Ability(Id), PRIMARY KEY(AbilityId, CharacterId));";

    try {
        // Create the table
        await connection.execute(createTableCommand);
    }
    catch (error) {
        throw new DatabaseError("characterStatisticsModel", 'createAbilityScoreTable', `Failed to create the ability score table, likely due to an undefined connection: ${error}`)
    }

}

/**
 * Drops the tables that need to be dropped before the character model's tables are dropped.
 * @param {Object} connection A connection to the dnd database.
 * @throws {DatabaseError} Thrown usually when the connection is closed or invalid.
 */
async function dropTables() {
    const dropAS = "DROP TABLE IF EXISTS AbilityScore;";
    const dropSkill = "DROP TABLE IF EXISTS Skill;";
    const dropSTP = "DROP TABLE IF EXISTS SavingThrowProficiency;";
    const dropSkillP = "DROP TABLE IF EXISTS SkillProficiency;";
    const dropSE = "DROP TABLE IF EXISTS SkillExpertise;";
    const dropSTB = "DROP TABLE IF EXISTS SavingThrowBonus;";
    const dropA = "DROP TABLE IF EXISTS Ability;";

    try {
        await connection.execute(dropAS);
        await connection.execute(dropSTB);
        await connection.execute(dropSE);
        await connection.execute(dropSkillP);
        await connection.execute(dropSTP);
        await connection.execute(dropSkill);
        await connection.execute(dropA);

    }
    catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'dropTables', `Failed to drop the statistics table from the database: ${error}`);
    }

}

/**
 * Creates all the tables that have to do with player statistics and abilities.
 * @throws {DatabaseError} Thrown when a table failed to be made usually due to an undefined connection.
 */
async function createTables() {
    await createAbilityTable();
    await createSkillTable();
    await createSavingThrowProficiencyTable();
    await createSkillProficiencyTable();
    await createSkillExpertiseTable();
    await createSavingThrowBonusTable();
    await createAbilityScoreTable();
}

/**
 * Sets the ability scores for a character.
 * CharacterId must be an integer which exists in the PlayerCharacter table.
 * Ability Scores must be an array with 6 integers.
 * @param {Number} characterId The id of the character to set the ability scores for.
 * @param {Array} abilityScores The ability scores of the character.
 * @throws {DatabaseError} Thrown when the connection is undefined.
 * @throws {InvalidInputError} Thrown when the ability scores array doesn't contain 6 integers or when the character id is invalid.
 */
async function setAbilityScores(characterId, abilityScores) {


    // Validate the ability scores
    await validationModel.checkAbilityScores(abilityScores);

    // Validate the character id
    await validationModel.checkCharacterId(characterId);


    // Delete existing ability scores
    try {
        await connection.execute(`DELETE FROM AbilityScore WHERE CharacterId = ${characterId};`);
    }
    catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'setAbilityScores', `Failed to delete the existing ability scores from the database for the character with id ${characterId}: ${error}`);
    }

    // Add each ability score
    try {
        for (let i = 1; i <= abilityScores.length; i++) {
            await connection.execute(`INSERT INTO AbilityScore (CharacterId, AbilityId, Score) values (${characterId}, ${i}, ${abilityScores[i - 1]});`);
        }
    }
    catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'setAbilityScores', `Failed to add the ability scores for character ${characterId}: ${error}`);
    }

}

/**
 * Adds a skill proficiency for a specific character. If the character already has expertise in said skill, the expertise should be deleted.
 * Character Id must be an integer which exists as an id in the PlayerCharacter table.
 * Skill id must be an integer which exists as an id in the Skill table.
 * @param {Number} characterId The id of a character.
 * @param {Number} skillId The id of the skill which the character is an expert in.
 * @throws {DatabaseError} Thrown when the database connection is undefined.
 * @throws {InvalidInputError} Thrown when the characterId or skillId was invalid or not found in the database. 
 */
async function addSkillProficiency(characterId, skillId) {

    // Validate the skill id
    await validationModel.checkSkillId(skillId);


    // Validate the character id
    await validationModel.checkCharacterId(characterId);

    // Drop existing expertise and proficiency in this skill
    try {
        await connection.execute(`DELETE FROM SkillProficiency WHERE CharacterId = ${characterId} AND SkillId = ${skillId};`);
        await connection.execute(`DELETE FROM SkillExpertise WHERE CharacterId = ${characterId} AND SkillId = ${skillId};`);
    } catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'addSkillProficiency', `Failed to delete existing expertise and proficiency for the character with id ${characterId} in the skill with id ${skillId}: ${error}}`);
    }

    // Add the new proficiency in this skill.
    try {
        await connection.execute(`INSERT INTO SkillProficiency (CharacterId, SkillId) values (${characterId}, ${skillId});`)
    }
    catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'addSkillProficiency', `Failed to add make the character with id ${characterId} proficient in the skill with id ${skillId}: ${error}`);
    }

}

/**
 * Adds a skill expertise for a specific character. If the character is already proficient in said skill, the proficiency should be deleted.
 * Character Id must be an integer which exists as an id in the PlayerCharacter table.
 * Skill id must be an integer which exists as an id in the Skill table.
 * @param {Number} characterId The id of a character.
 * @param {Number} skillId The id of the skill which the character is proficient in.
 * @throws {DatabaseError} Thrown when the database connection is undefined.
 * @throws {InvalidInputError} Thrown when the characterId or skillId was invalid or not found in the database.
 */
async function addSkillExpertise(characterId, skillId) {

    // Validate the skill id
    await validationModel.checkSkillId(skillId);


    // Validate the character id
    await validationModel.checkCharacterId(characterId);


    // Drop existing expertise and proficiency in this skill
    try {
        await connection.execute(`DELETE FROM SkillProficiency WHERE CharacterId = ${characterId} AND SkillId = ${skillId};`);
        await connection.execute(`DELETE FROM SkillExpertise WHERE CharacterId = ${characterId} AND SkillId = ${skillId};`);
    } catch (error) {
        throw new InvalidInputError('characterStatisticsModel', 'addSkillExpertise', `Failed to delete existing expertise and proficiency for the character with id ${characterId} in the skill with id ${skillId}: ${error}}`);
    }

    // Add the new proficiency in this skill.
    try {
        await connection.execute(`INSERT INTO SkillExpertise (CharacterId, SkillId) values (${characterId}, ${skillId});`)
    }
    catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'addSkillExpertise', `Failed to add make the character with id ${characterId} proficient in the skill with id ${skillId}: ${error}`);
    }
}

/**
 * Adds a saving throw bonus for a specific character on a saving throw.
 * Character Id must be an integer which exists as an id in the PlayerCharacter table.
 * Ability id must be an integer which exists as an id in the Ability table.
 * @param {Number} characterId The id of a character.
 * @param {Number} abilityId  The abilityId linked to the saving throw.
 * @throws {DatabaseError} Thrown when the database connection is undefined.
 * @throws {InvalidInputError} Thrown when the characterId or skillId was invalid or not found in the database.
 */
async function addSavingThrowProficiency(characterId, abilityId) {

    // Validate the ability id
    await validationModel.checkAbility(abilityId);


    // Validate the character id
    await validationModel.checkCharacterId(characterId);


    // Drop existing proficiency in this saving throw
    try {
        await connection.execute(`DELETE FROM SavingThrowProficiency WHERE CharacterId = ${characterId} AND AbilityId = ${abilityId};`);
    } catch (error) {
        throw new InvalidInputError('characterStatisticsModel', 'addSavingThrowProficiency', `Failed to delete existing proficiency for the character with id ${characterId} in the saving throw with ability id ${abilityId}: ${error}}`);
    }

    // Add the new proficiency in this ability.
    try {
        await connection.execute(`INSERT INTO SavingThrowProficiency (CharacterId, AbilityId) values (${characterId}, ${abilityId});`)
    }
    catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'addSavingThrowProficiency', `Failed to add make the character with id ${characterId} proficient in the saving throw with ability id ${abilityId}: ${error}`);
    }
}

/**
 * Sets a bonus for a character in a specific saving throw.
 * Character id must be an integer which exists as an id in the PlayerCharacter table.
 * Ability id must be an integer which exists in the Ability table.
 * Bonus must be an integer.
 * If Bonus is 0, this character's saving throw bonus is deleted since that is functionally the same as setting it to 0.
 * @param {Number} characterId The id of a character.
 * @param {Number} abilityId The ability id linked to the saving throw.
 * @param {Number} bonus The bonus for this saving throw.
 * @throws {DatabaseError} Thrown when the database connection is undefined.
 * @throws {InvalidInputError} Thrown when the characterId or skillId was invalid or not found in the database, or when the bonus is not an integer. 
 */
async function setSavingThrowBonus(characterId, abilityId, bonus) {

    // Validate the ability id
    await validationModel.checkAbility(abilityId);


    // Validate the character id
    await validationModel.checkCharacterId(characterId);


    // Remove the existing bonus from the character in this saving throw
    try {
        await connection.execute(`DELETE FROM SavingThrowBonus WHERE CharacterId = ${characterId} AND AbilityId = ${abilityId};`);
    }
    catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'addSavingThrowProficiency', `Failed to delete the existing bonus for the character with id ${characterId} in the saving throw with ability id ${abilityId}: ${error}`);
    }

    // Add the new bonus if bonus isn't 0
    if (bonus != 0) {
        try {
            await connection.execute(`INSERT INTO SavingThrowBonus (CharacterId, AbilityId, Bonus) values (${characterId}, ${abilityId}, ${bonus});`);
        }
        catch (error) {
            throw new DatabaseError('characterStatisticsModel', 'addSavingThrowProficiency', `Failed to add the bonus for the character with id ${characterId} in the saving throw with ability id ${abilityId}: ${error}`);
        }
    }
}

/**
 * Gets a list of all the abilities in the database.
 * Abilities are returned in the following format - {Name: "", Id: #}
 * @returns An array of containing all the abilities in the database.
 * @throws {DatabaseError} Thrown when the database connection is undefined.
 */
async function getAllAbilities() {
    try {
        [abilities, columns] = await connection.query('SELECT Name, Id FROM Ability;');
        return abilities;
    } catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'getAllAbilities', `Failed to get the list of abilities from the database: ${error}`);
    }
}

/**
 * Gets a list of all the skills in the database.
 * Skills are returned in the following format - {Name: "", Id: #, Ability: {Id: #, Name: ""}} 
 * where AbilityId is the id linked with the skill
 * @returns An array containing all the skills in the database with their corresponding ability.
 * @throws {DatabaseError} Thrown when the database connection is undefined.
 */
async function getAllSkills() {
    try {
        [skills, columns] = await connection.query('SELECT S.Name, S.Id, A.Name as AbilityName, A.Id as AbilityId FROM Ability A, Skill S WHERE A.Id = S.AbilityId ORDER BY Name ASC;');
        skills = skills.map(skill => {
            skill.Ability = { Id: skill.AbilityId, Name: skill.AbilityName };
            delete skill.AbilityId;
            delete skill.AbilityName;
            return skill;
        });

        return skills;
    } catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'getAllSkills', `Failed to get the list of skills from the database: ${error}`);
    }
}

/**
 * Closes the connection to the database.
 */
async function closeConnection() {
    try {
        if (connection)
            connection.end();
    }
    catch (error) {
        logger.error(error);
    }
}

/**
 * Gets the skill proficiencies for a specific character.
 * @param {Integer} characterId The id of the character to get the skill proficiencies of.
 * @returns A list of skill ids representing the skills the character is proficient in.
 * @throws {InvalidInputError} Thrown when the characterId is invalid.
 * @throws {DatabaseError} Thrown when the function failed to query from the database.
 */
async function getSkillProficiencies(characterId) {

    // Validate the character id
    await validationModel.checkCharacterId(characterId);


    let skillIdObjects;
    try {
        [skillIdObjects, columns] = await connection.query(`SELECT SkillId FROM SkillProficiency WHERE CharacterId = ${characterId}`);
        return skillIdObjects.map(x => x.SkillId);
    }
    catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'getSkillProficiencies', `Failed to get the skill proficiency ids from the database: ${error}`);
    }

}

/**
 * Gets the skill expertise for a specific character.
 * @param {Integer} characterId The id of the character to get the skill expertise of.
 * @returns A list of skill ids representing the skills the character has expertise in.
 * @throws {InvalidInputError} Thrown when the characterId is invalid.
 * @throws {DatabaseError} Thrown when the function failed to query from the database.
 */
async function getSkillExpertise(characterId) {
    // Validate the character id
    await validationModel.checkCharacterId(characterId);


    let skillIdObjects;
    try {
        [skillIdObjects, columns] = await connection.query(`SELECT SkillId FROM SkillExpertise WHERE CharacterId = ${characterId}`);
        return skillIdObjects.map(x => x.SkillId);
    }
    catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'getSkillExpertise', `Failed to get the skill expertise ids from the database: ${error}`);
    }
}

/**
 * Gets the saving throw proficiencies for a specific character.
 * @param {Integer} characterId The id of a character to get the proficiencies of.
 * @returns A list of integers representing the ids of the abilities linked with the saving throws the character is proficient in.
 * @throws {InvalidInputError} Thrown when the characterId is invalid.
 * @throws {DatabaseError} Thrown when the function failed to query from the database.
 */
async function getSavingThrowProficiencies(characterId) {
    // Validate the character id
    await validationModel.checkCharacterId(characterId);


    let savingThrowIdObjects;
    try {
        [savingThrowIdObjects, columns] = await connection.query(`SELECT AbilityId FROM SavingThrowProficiency WHERE CharacterId = ${characterId}`);
        return savingThrowIdObjects.map(x => x.AbilityId);
    }
    catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'getSavingThrowProficiencies', `Failed to get the saving throw proficiency ids from the database: ${error}`);
    }
}

/**
 * Gets the saving throw bonuses for a specific character.
 * @param {Integer} characterId The id of a character to get the bonuses of.
 * @returns A list of objects, each containing a saving throw id and the player's bonus in that saving throw - {Id: #AbilityId, Bonus: #}
 * @throws {InvalidInputError} Thrown when the characterId is invalid.
 * @throws {DatabaseError} Thrown when the function failed to query from the database.
 */
async function getSavingThrowBonuses(characterId) {
    // Validate the character id
    await validationModel.checkCharacterId(characterId);


    let savingThrowBonusObjects;
    try {
        [savingThrowBonusObjects, columns] = await connection.query(`SELECT AbilityId, Bonus FROM SavingThrowBonus WHERE CharacterId = ${characterId}`);
        return savingThrowBonusObjects;
    }
    catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'getSavingThrowBonuses', `Failed to get the saving throw bonuses from the database: ${error}`);
    }

}

/**
 * Gets all the ability scores of a character.
 * @param {Integer} characterId The id of a character.
 * @returns An object containing tha character's ability scores {Score: #, AbilityId: #, AbilityName: "..."}
 * @throws {InvalidInputError} Thrown when the characterId is invalid.
 * @throws {DatabaseError} Thrown when the function failed to query from the database.
 */
async function getAbilityScores(characterId) {
    // Validate the character id
    try {
        await validationModel.checkCharacterId(characterId);
    }
    catch (error) {
        throw new InvalidInputError('characterStatisticsModel', 'getSavingThrowBonuses', error.message);
    }

    let abilityScores;
    try {
        [abilityScores, columns] = await connection.query(`SELECT Score, AbilityId, Name as AbilityName FROM AbilityScore, Ability A WHERE AbilityId = Id AND CharacterId = ${characterId};`);
        return abilityScores;
    }
    catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'getAbilityScores', `Failed to get the ability scores from the database: ${error}`);
    }
}

/**
 * Removes a skill proficiency from a character
 * @param {Integer} characterId The id of a character.
 * @param {Integer} skillId The id of a skill. 
 * @throws {InvalidInputError} Thrown when the character or skill id is invalid.
 * @throws {DatabaseError} Thrown when the function fails to execute on the database.
 */
async function removeSkillProficiency(characterId, skillId) {

    // Validate character id
    await validationModel.checkCharacterId(characterId);

    // Validate skill id
    await validationModel.checkSkillId(skillId);

    try {
        await connection.execute(`DELETE FROM SkillProficiency WHERE CharacterId = ${characterId} AND SkillId = ${skillId}`)
    }
    catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'removeSkillProficiency', `Failed to delete a skill proficiency in the skill ${skillId} for character ${characterId}: ${error}`);
    }
}

/**
 * Removes a skill expertise from a character
 * @param {Integer} characterId The id of a character.
 * @param {Integer} skillId The id of a skill. 
 * @throws {InvalidInputError} Thrown when the character or skill id is invalid.
 * @throws {DatabaseError} Thrown when the function fails to execute on the database.
 */
async function removeSkillExpertise(characterId, skillId) {

    // Validate character id
    await validationModel.checkCharacterId(characterId);

    // Validate skill id
    await validationModel.checkSkillId(skillId);

    try {
        await connection.execute(`DELETE FROM SkillExpertise WHERE CharacterId = ${characterId} AND SkillId = ${skillId}`)
    }
    catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'removeSkillExpertise', `Failed to delete a skill expertise in the skill ${skillId} for character ${characterId}: ${error}`);
    }
}

/**
 * Removes a saving throw proficiency from a character
 * @param {Integer} characterId The id of a character.
 * @param {Integer} skillId The id of a skill. 
 * @throws {InvalidInputError} Thrown when the character or ability id is invalid.
 * @throws {DatabaseError} Thrown when the function fails to execute on the database.
 */
async function removeSavingThrowProficiency(characterId, abilityId) {

    // Validate character id
    await validationModel.checkCharacterId(characterId);

    // Validate skill id
    await validationModel.checkAbility(abilityId);

    try {
        await connection.execute(`DELETE FROM SavingThrowProficiency WHERE CharacterId = ${characterId} AND AbilityId = ${abilityId}`)
    }
    catch (error) {
        throw new DatabaseError('characterStatisticsModel', 'removeSavingThrowProficiency', `Failed to delete a saving throw proficiency in the skill ${skillId} for character ${characterId}: ${error}`);
    }
}


module.exports = {
    initialize,
    closeConnection,
    dropTables,
    createTables,
    setAbilityScores,
    addSkillProficiency,
    addSkillExpertise,
    addSavingThrowProficiency,
    setSavingThrowBonus,
    getAllAbilities,
    getAllSkills,
    getSkillProficiencies,
    getSavingThrowBonuses,
    getSavingThrowProficiencies,
    getSkillExpertise,
    getAbilityScores,
    removeSkillProficiency,
    removeSkillExpertise,
    removeSavingThrowProficiency
}
