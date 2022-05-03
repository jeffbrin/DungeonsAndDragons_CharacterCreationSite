const mysql = require('mysql2/promise');
const valUtils = require('./validateCharacterAndStatistics');
let connection;
const tableName = 'PlayerCharacter';
const logger = require('../logger');
const errors = require('./errorModel');
const characterStatsModel = require('./characterStatisticsModel');


//## CharacterModel
// * Ethics
// * Morality
// * PlayerCharacter (background, class, user, race, ethics, morality)
// * Known Spell (PlayerCharacter, spell)
// * Owned Item (PlayerCharacter)

/**
 * Initializes the connection to the database. 
 * It also creates the tables needed and drops the tables if reset is true.
 * @param {String} databaseNameTmp - The name of the database to connect to.
 * @param {Boolean} reset - If true, the database will be reset before the connection is made.
 * @throws {DatabaseError} if there was a problem with a query (connection not initialized, bad query);
 */
async function initialize(databaseNameTmp, reset) {
    connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        port: '10000',
        password: 'pass',
        database: databaseNameTmp
    });

    //if reset true, drop all the tables in reverse creation order.
    if (reset) {
        const deleteDbQuery = `DROP TABLE IF EXISTS OwnedItem, KnownSpell, ${tableName}, Morality;`;
        await connection.execute(deleteDbQuery).then(logger.info(`Tables: OwnedItem, KnownSpell, ${tableName}, Morality deleted if existed to reset the Db and reset increment in initialize()`))
            .catch((error) => { throw new errors.DatabaseError(`characterModel', 'initialize', "Couldn't connect to the database: ${error.message}`); });
    }

    await createEthicsTable();
    await createMoralityTable();
    await createPlayerCharacterTable();
    await createKnownSpellTable();
    await createOwnedItemTable();


}




/**
 * Closes the Connection to the Database
 * @throws {DatabaseError} If there was an error on the database's side
 */
async function closeConnection() {
    await connection.end().then(logger.info(`Connection closed from closeConnection() in characterModel`))
        .catch((error) => { throw new errors.DatabaseError('characterModel', 'closeConnection', "Couldn't close the database connection"); });
}

/* #region  CRUD Operations */

/**
 * Helper method to make testing easier. Adds a character using the addCharacter method but takes in an object and splits it up once.
 * @param {Character} character 
 * @returns 
 */
async function addCharacterObject(character) {
    return await addCharacter(character.classId, character.raceId, character.name, character.maxHP,
        character.background, character.ethicsId, character.moralityId, character.level, character.abilityScoreValues,
        character.savingThrowProficienciesIds, character.proficiencyBonus, character.userId);
}


/**
 * Adds a Character to the PlayerCharacter table
 * @param {Integer} classId - The Id of the user's selected class - 1 Based
 * @param {Integer} raceId - The Id of the user's selected race - 1 Based
 * @param {String} name - The Name of the Character
 * @param {Integer} maxHP - The Maximum amount of Hit Points the character has
 * @param {Integer} background - The Integer representation of the Characters Background in the Background Table - 1 Based
 * @param {Integer} ethicsId - The Ethics of the Character - Foreign Key ID
 * @param {Integer} moralityId - The Morality of the Character
 * @param {Integer} level - The chosen Level of the Character
 * @param {Int32Array} abilityScoreValues - An array of size 6 of Ability Score IDs in order. Each index of the array is the ability score for that index's ability.
 * Ex. [1, 0, 1, 2, 0, 3] -> Starts at strength and ends with Charisma. Array is 0 based but Ability Ids are 1 based
 * @param {Int32Array} savingThrowProficienciesIds - An array of Saving Throw Proficiencies IDs. Each index of the array is the Integer of the 
 * Saving Throw the Character is proficient in (1 based)
 * @param {Integer} proficiencyBonus - The value of the proficiency bonus for a character in the Character Sheet
 * @param {Integer} userId - The Id of the user this character will belong to if created
 * @throws {InvalidInputError} - If the Input does not match up with the restrictions set
 * @throws {DatabaseError} - If there was an error connecting to the Database or with the Query
 */
async function addCharacter(classId, raceId, name, maxHP, background, ethicsId, moralityId, level, abilityScoreValues, savingThrowProficienciesIds, proficiencyBonus, userId) {

    //select from character table and select the next highest available id top order by ID
    const idQuery = `SELECT Id from ${tableName} ORDER BY Id DESC LIMIT 1;`
    let characterId = 1;
    try {
        let [rows, column_definitions] = await connection.query(idQuery);
        if (rows.length != 0) {
            characterId = parseInt(rows[0].Id);
        }
        await valUtils.isCharValid(connection, name, raceId, classId, maxHP, background, ethicsId, moralityId, level, abilityScoreValues, savingThrowProficienciesIds, userId);
    }
    catch (error) {
        throw new errors.InvalidInputError("characterModel", "addCharacter", `Couldn't Validate the character: ${error.message}`);
    }

    //ADD CHAR TO DB
    let query = `insert into ${tableName} (Id, UserId, ClassId, RaceId, EthicsId, MoralityId, BackgroundId, Name, MaxHp, CurrentHp, Level, ProficiencyBonus) values 
    (${characterId}, ${userId}, ${classId}, ${raceId}, ${ethicsId}, ${moralityId}, ${background}, '${name.toLowerCase()}', ${maxHP}, ${maxHP}, ${level}, ${proficiencyBonus});`;

    await connection.execute(query).then(logger.info("Insert command executed in addCharacter")).catch((error) => { throw new errors.DatabaseError('characterModel', 'addCharacter', 'Couldn\'t execute the command'); });


    try {

        //Add To Character Statistics Table
        //Add Saving Throw Proficiency for each in the array of Ids
        for (let i = 0; i < savingThrowProficienciesIds.length; i++) {
            await characterStatsModel.addSavingThrowProficiency(characterId, savingThrowProficienciesIds[i]);
        }


        //Add Ability Score Values
        await characterStatsModel.setAbilityScores(characterId, abilityScoreValues);

    } catch (error) {
        if (error instanceof errors.InvalidInputError) {
            throw new errors.InvalidInputError('characterModel', 'addCharacter', `Couldn't Add saving throw proficiency or ability score from within the Character statistics model: ${error.message}`);
        }
        else {
            throw new errors.DatabaseError('characterModel', 'addCharacter', `Database connection or query error, Couldn't Add saving throw proficiency or ability score from within the Character statistics model: ${error.message}`);
        }

    }


    return true;
}

/**
 * 
 * @param {Integer} id - The id of the character to update.
 * @param {String} newName - The new name of the character to update.
 * @param {String} newRace - The new race of the character to update.
 * @param {String} newClass - The new Class of the character to update.
 * @param {Integer} newHitpoints - The new hitpoints of the character to update
 * @description - This function updates a character in the database after validating the inputs. Stores strings into the Database as lower case.
 * @throws {InvalidInputError} If the character is not found 
 * @throws {DatabaseError} If there was an error on the database's side
 */
async function updateCharacter(id, newName, newRace, newClass, newHitpoints) {
    if (! await valUtils.isCharValid(newName, newRace, newClass, newHitpoints)) {
        throw new errors.InvalidInputError('characterModel', 'updateCharacter', "Invalid Character, cannot update character");
    }
    let selectQuery = `Select 1 from ${tableName} WHERE id = ${id}`;
    let [rows, column_definitions] = await connection.query(selectQuery).then(logger.info("select Query before Update Executed - updateCharacter()")).catch((error) => { throw new errors.DatabaseError('characterModel', 'updateCharacter', 'Couldn\'t execute the command'); });

    //Check if there is an ID that matches in the database
    if (rows.length == 0) {
        throw new errors.InvalidInputError('characterModel', 'updateCharacter', "Invalid Id, character DOES NOT EXIST!");
    }
    let query = `Update ${tableName} SET name = '${newName.toLowerCase()}', race = '${newRace.toLowerCase()}', class = '${newClass.toLowerCase()}', hitpoints = ${newHitpoints} where id = ${id};`;
    await connection.execute(query).then(logger.info("Update Query Executed - updateCharacter()")).catch((error) => { throw new errors.DatabaseError(error.message); });
}



/**
 * Updates the CurrentHp of a character in the database after validating the inputs. CurrentHp is allowed to go negative.
 * @param {Integer} id - The Id of the Character that will get the CurrentHp value change
 * @param {Integer} hpValueChange - The increase or decrease amount in Hit Points
 * @throws {InvalidInputError} If the character is not found 
 * @throws {DatabaseError} If there was an error on the database's side
 */
async function addRemoveHp(id, hpValueChange) {
    let selectQ = `Select CurrentHp from ${tableName} WHERE Id = ${id};`;
    let [rows, column_definitions] = await connection.query(selectQ).then(logger.info("select Query before CurrentHp change Executed - addRemoveHp"))
        .catch((error) => { throw new errors.DatabaseError('characterModel', 'addRemoveHp', `Database connection failed ${error.message}`); });

    if (rows.length === 0) {
        throw new errors.InvalidInputError('characterModel', 'addRemoveHp', `Character with id: ${id} was not found in the Database`);
    }

    let newHp = rows[0].CurrentHp + hpValueChange;


    let query = `Update ${tableName} SET CurrentHp = ${newHp} WHERE Id = ${id};`;
    await connection.execute(query).then(logger.info("Update CurrentHp Query Executed - addRemoveHp"))
        .catch((error) => { throw new errors.DatabaseError('characterModel', 'addRemoveHp', `Database connection failed, couldn't update CurrentHp. ${error.message}`); });
}



/**
 * Gets a specific character based off of the passed in ID
 * @param {Integer} id 
 * @returns an object containing the character
 * @throws {InvalidInputError} If the character is not found 
 */
async function getCharacter(id) {
    let query = `SELECT Id, Name, RaceId, ClassId, CurrentHp from ${tableName} WHERE Id = ${id};`;
    let [rows, column_definitions] = await connection.query(query).then(logger.info("select Query before returning Character executed"))
        .catch((error) => { throw new errors.DatabaseError('characterModel', 'getCharacter', `Database connection failed, couldn't get Character. ${error.message}`); });
    if (rows.length === 0) {
        throw new errors.InvalidInputError('characterModel', 'getCharacter', `Character not found with id: ${id}`);
    }
    return rows[0];
}

/**
 * Gets all the Characters corresponding to a given User's Id.
 * @param {Integer} userId - The Id of the user whose characters will be retrieved
 * @returns an array of Character Ids that belong to the user.
 * @throws {InvalidInputError} - If the User does not exist OR the User has no Characters belonging to them.
 * @throws {DatabaseError} - If there is an error with the SELECT query while joining the PlayerCharacter and User Tables.
 */
async function getUserCharacters(userId) {
    const query = `SELECT c.Id from ${tableName} c, User u WHERE c.UserId = u.Id;`;

    try {
        var [rows, colum_definitions] = await connection.query(query);
        logger.info(`Select Query Success in getUserCharacter with userId: ${userId}`);
        if (rows.length === 0) {
            throw new errors.InvalidInputError();
        }
    } catch (error) {
        if (error instanceof errors.InvalidInputError) {
            throw new errors.InvalidInputError('characterModel', 'getUserCharacters', `User does not exists or has no characters`);
        }
        else {
            throw new errors.DatabaseError('characterModel', 'getUserCharacters', `Database connection or query error, couldn't get the Users Characters`);
        }
    }

    return rows;
}

/**
 * Deletes a character from the database with the given Id
 * @param {Integer} id 
 * @throws {InvalidInputError} If the character is not found 
 * @throws {DatabaseError} If there was an error on the database's side
 */
async function removeCharacter(id) {
    let query = `DELETE FROM ${tableName} WHERE Id = ${id};`;

    //Select The Id of the user who's character this belongs to in order to remove that character from them as well
    //ASK JEFF BOUT THIS
    const userQ = `SELECT Id FROM UserId WHERE CharacterId = ${id};`;

    try {
        let checkingQ = `SELECT 1 from ${tableName} WHERE Id = ${id};`;
        let [rows, column_definitions] = await connection.query(checkingQ).then(logger.info("Select query to check if Id exists has been executed"));

        if (rows.length === 0) {
            throw new errors.InvalidInputError('characterModel', 'removeCharacter', `Character with Id: ${id} does not exist in the Database.`);
        }
        await connection.execute(query).then(logger.info(`Delete Query Executed Character with id: ${id}`))
            .catch((error) => { throw new errors.DatabaseError('characterModel', 'removeCharacter', `Database connection failed, couldn't delete Character with id ${id}. ${error.message}`); });
        return true;
    }
    catch (error) {
        throw error;
    }
}

/**
 * Updates a character with the given Id in order to increment by 1 their level
 * @param {Integer} characterId - The Id of the Character that will have their Level Updated
 * @throws {InvalidInputError} - If the Character with the given Id does not exist
 * @throws {DatabaseError} - If there was an error with the Database Connection and the one of the queries didn't work
 */
async function levelUp(characterId) {
    const query = `SELECT Level FROM ${tableName} WHERE Id = ${characterId};`;

    try {
        var [rows, colum_definitions] = await connection.query(query);
        logger.info('Select query executed inside of levelUp function');
        if (rows.length === 0) throw new errors.InvalidInputError();

        let currentLevel = parseInt(rows[0].Level);
        currentLevel += 1;

        const updateQuery = `UPDATE ${tableName} SET Level = ${currentLevel} WHERE Id = ${characterId};`;

        await connection.execute(updateQuery);
        logger.info(`UPDATE query Success, character with id: ${characterId}'s level is now ${currentLevel}.`);

    } catch (error) {
        if (error instanceof errors.InvalidInputError) {
            throw new errors.InvalidInputError('characterModel', 'levelUp', `Character does not exist`);
        }
        else {
            throw new errors.DatabaseError('characterModel', 'levelUp', `Database connection or query error, couldn't level up the Character`);
        }
    }
}

/**
 * Updates a character with the given Id in order to increment by the passed in experience to their current Experience
 * @param {Integer} characterId - The Id of the Character that will have their Experience Updated
 * @param {Integer} experience - The number od experience points to add/remove from the character
 * @throws {InvalidInputError} - If the Character with the given Id does not exist
 * @throws {DatabaseError} - If there was an error with the Database Connection and the one of the queries didn't work
 */
async function updateExp(characterId, experience) {
    const query = `SELECT Experience FROM ${tableName} WHERE Id = ${characterId};`;

    try {
        var [rows, colum_definitions] = await connection.query(query);
        logger.info('Select query executed inside of updateExp function');
        if (rows.length === 0) throw new errors.InvalidInputError();

        let currentExperience = parseInt(rows[0].Experience);
        currentExperience += experience;

        const updateQuery = `UPDATE ${tableName} SET Experience = ${currentExperience} WHERE Id = ${characterId};`;

        await connection.execute(updateQuery);
        logger.info(`UPDATE query Success, character with id: ${characterId}'s Experience is now ${currentExperience}.`);

    } catch (error) {
        if (error instanceof errors.InvalidInputError) {
            throw new errors.InvalidInputError('characterModel', 'updateExp', `Character does not exist`);
        }
        else {
            throw new errors.DatabaseError('characterModel', 'updateExp', `Database connection or query error, couldn't add experience to the Character`);
        }
    }
}

/**
 * Replaces the current Armor Class of a Character with the new value passed in to the function.
 * @param {Integer} characterId - The Id of the character whose Armor Class will be Updated
 * @param {Integer} armorClass - The new value of the characters Armor Class
 * @throws {InvalidInputError} - If the Character with the given Id does not exist
 * @throws {DatabaseError} - If there was an error with the Database Connection and the one of the queries didn't work
 */
async function updateAC(characterId, armorClass) {
    const query = `SELECT ArmorClass FROM ${tableName} WHERE Id = ${characterId};`;

    try {
        var [rows, colum_definitions] = await connection.query(query);
        logger.info('Select query executed inside of updateAC function');
        if (rows.length === 0) throw new errors.InvalidInputError();



        const updateQuery = `UPDATE ${tableName} SET ArmorClass = ${armorClass} WHERE Id = ${characterId};`;

        await connection.execute(updateQuery);
        logger.info(`UPDATE query Success, character with id: ${characterId}'s ArmorClass is now ${armorClass}.`);

    } catch (error) {
        if (error instanceof errors.InvalidInputError) {
            throw new errors.InvalidInputError('characterModel', 'updateAC', `Character does not exist`);
        }
        else {
            throw new errors.DatabaseError('characterModel', 'updateAC', `Database connection or query error, couldn't update ArmorClass of the Character`);
        }
    }
}

/**
 * Replaces the current Speed of a Character with the new value passed in to the function.
 * @param {Integer} characterId - The Id of the character whose Speed will be Updated
 * @param {Integer} speed - The new value of the characters Speed
 * @throws {InvalidInputError} - If the Character with the given Id does not exist
 * @throws {DatabaseError} - If there was an error with the Database Connection and the one of the queries didn't work
 */
async function updateSpeed(characterId, speed) {
    const query = `SELECT Speed FROM ${tableName} WHERE Id = ${characterId};`;

    try {
        var [rows, colum_definitions] = await connection.query(query);
        logger.info('Select query executed inside of updateSpeed function');
        if (rows.length === 0) throw new errors.InvalidInputError();

        const updateQuery = `UPDATE ${tableName} SET Speed = ${speed} WHERE Id = ${characterId};`;

        await connection.execute(updateQuery);
        logger.info(`UPDATE query Success, character with id: ${characterId}'s Speed is now ${speed}.`);

    } catch (error) {
        if (error instanceof errors.InvalidInputError) {
            throw new errors.InvalidInputError('characterModel', 'updateSpeed', `Character does not exist`);
        }
        else {
            throw new errors.DatabaseError('characterModel', 'updateSpeed', `Database connection or query error, couldn't update speed of the Character`);
        }
    }
}

/**
 * Replaces the current Initiative of a Character with the new value passed in to the function.
 * @param {Integer} characterId - The Id of the character whose Initiative will be Updated
 * @param {Integer} initiative - The new value of the characters Initiative
 * @throws {InvalidInputError} - If the Character with the given Id does not exist
 * @throws {DatabaseError} - If there was an error with the Database Connection and the one of the queries didn't work
 */
async function updateInitiative(characterId, initiative) {
    const query = `SELECT Initiative FROM ${tableName} WHERE Id = ${characterId};`;

    try {
        var [rows, colum_definitions] = await connection.query(query);
        logger.info('Select query executed inside of updateSpeed function');
        if (rows.length === 0) throw new errors.InvalidInputError();



        const updateQuery = `UPDATE ${tableName} SET Initiative = ${initiative} WHERE Id = ${characterId};`;

        await connection.execute(updateQuery);
        logger.info(`UPDATE query Success, character with id: ${characterId}'s Initiative is now ${initiative}.`);

    } catch (error) {
        if (error instanceof errors.InvalidInputError) {
            throw new errors.InvalidInputError('characterModel', 'updateInitiative', `Character does not exist`);
        }
        else {
            throw new errors.DatabaseError('characterModel', 'updateInitiative', `Database connection or query error, couldn't update Initiative of the Character`);
        }
    }
}


/* #endregion */

/**
 * Gets the connection to this database
 * @returns the connection to the database
 */
function getConnection() {
    return connection;
}

/* #region  Create Table Methods */
/**
 * Creates the Ethics table with an SQL Query
 * @throws {DatabaseError} if there was a problem with executing the SQL Query
 */
async function createEthicsTable() {
    const sqlQuery = "CREATE TABLE IF NOT EXISTS Ethics(Id INT, Name TEXT, PRIMARY KEY(Id));";
    await connection.execute(sqlQuery).then(logger.info(`Table: Ethics Created/Exists - createEthicsTable()`))
        .catch((error) => { throw new errors.DatabaseError('characterModel', 'createEthicsTable', `Couldn't connect to the database: ${error.message}.`); });
}

/**
 * Creates the Morality table with an SQL Query
 * @throws {DatabaseError} if there was a problem with executing the SQL Query
 */
async function createMoralityTable() {
    const sql = `CREATE TABLE IF NOT EXISTS Morality(Id INT, Name TEXT, PRIMARY KEY(Id));`;
    await connection.execute(sql).then(logger.info(`Table: Morality Created/Exists - createMoralityTable()`))
        .catch((error) => { throw new errors.DatabaseError('characterModel', 'createMoralityTable', `Couldn't connect to the database: ${error.message}.`); });
}
/**
 * Creates the PlayerCharacter table with an SQL Query
 * @throws {DatabaseError} if there was a problem with executing the SQL Query
 */
async function createPlayerCharacterTable() {
    const sqlQueryC = `CREATE TABLE IF NOT EXISTS PlayerCharacter(Id INT, UserId INT, ClassId INT, RaceId INT, EthicsId INT, 
        MoralityId INT, BackgroundId INT, Name TEXT, ProficiencyBonus INT, MaxHp INT, CurrentHp INT, Level INT, ArmorClass INT, Speed INT, Initiative INT, 
        Experience INT, PRIMARY KEY(Id), FOREIGN KEY (UserId) REFERENCES User(Id), FOREIGN KEY (ClassId) REFERENCES Class(Id), 
        FOREIGN KEY (RaceId) REFERENCES Race(Id), FOREIGN KEY (EthicsId) REFERENCES Ethics(Id), FOREIGN KEY (MoralityId) 
        REFERENCES Morality(Id), FOREIGN KEY (BackgroundId) REFERENCES Background(Id));`;
    await connection.execute(sqlQueryC).then(logger.info(`Table: ${tableName} Created/Exists - createPlayerCharacterTable()`))
        .catch((error) => { throw new errors.DatabaseError('characterModel', 'createPlayerCharacterTable', `Couldn't connect to the database: ${error.message}.`); });
}
/**
 * Creates the KnownSpell table with an SQL Query
 * @throws {DatabaseError} if there was a problem with executing the SQL Query
 */
async function createKnownSpellTable() {
    const sql = `CREATE TABLE IF NOT EXISTS KnownSpell(SpellId INT, CharacterId INT, FOREIGN KEY (SpellId) 
    REFERENCES Spell(Id), FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), PRIMARY KEY (SpellId, CharacterId));`;
    await connection.execute(sql).then(logger.info(`Table: KnownSpell Created/Exists - createKnownSpellTable()`))
        .catch((error) => { throw new errors.DatabaseError('characterModel', 'createKnownSpellTable', `Couldn't connect to the database: ${error.message}.`); });

}

/**
 * Creates the OwnedItem table with an SQL Query
 * @throws {DatabaseError} if there was a problem with executing the SQL Query
 */
async function createOwnedItemTable() {
    const sql = `CREATE TABLE IF NOT EXISTS OwnedItem(CharacterId INT, Name VARCHAR(200), Count INT, 
    FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), PRIMARY KEY (CharacterId, Name));`;
    await connection.execute(sql).then(logger.info(`Table: KnownSpell Created/Exists - createOwnedItemTable()`))
        .catch((error) => { throw new errors.DatabaseError('characterModel', 'createOwnedItemTable', `Couldn't connect to the database: ${error.message}.`); });
}
/* #endregion */

module.exports = {
    initialize,
    addCharacter,
    updateCharacter,
    closeConnection,
    addRemoveHp,
    getCharacter,
    removeCharacter,
    getConnection,
    getUserCharacters,
    levelUp,
    updateExp,
    updateAC,
    updateSpeed,
    updateInitiative,
    addCharacterObject
};