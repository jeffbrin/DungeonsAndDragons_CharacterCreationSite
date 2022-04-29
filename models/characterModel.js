const mysql = require('mysql2/promise');
const valUtils = require('./validateCharacterAndStatistics');
let connection;
const tableName = 'PlayerCharacter';
const logger = require('../logger');
const errors = require('./errorModel');


//## CharacterModel
// * Ethics
// * Morality
// * PlayerCharacter (background, class, user, race, ethics, morality)
// * Known Spell (playercharacter, spell)
// * Owned Item (playercharacter)

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
            .catch((error) => { throw new errors.DatabaseError(`characterModel', 'intitalize', "Couldn't connect to the database: ${error.message}`); });
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
 * @param {Integer} userId - The Id of the user this character will belong to if created
 * @throws {InvalidInputError} - If the Input does not match up with the restrictions set
 * @throws {DatabaseError} - If there was an error connecting to the Database or with the Query
 */
async function addCharacter(classId, raceId, name, maxHP, background, ethicsId, moralityId, level, abilityScoreValues, savingThrowProficienciesIds, proficiencyBonus, userId) {

    //select from character table and select the next highest available id top order by ID
    try{
        await valUtils.isCharValid(connection, name, raceId, classId, maxHP,background, ethicsId, moralityId, level, abilityScoreValues, savingThrowProficienciesIds, userId);
    }
    catch(error){
        throw new errors.InvalidInputError("characterModel", "addCharacter", error.message);
    }

    //ADD CHAR TO DB
    let query = `insert into ${tableName} (name, race, class, hitpoints) values ('${name.toLowerCase()}', '${race.toLowerCase()}', '${charClass.toLowerCase()}', '${hitpoints}');`;

    await connection.execute(query).then(logger.info("Insert command executed in addCharacter")).catch((error) => { throw new errors.DatabaseError('characterModel', 'addCharacter', 'Couldn\'t execute the command'); });

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
    let selectQuery = `Select 1 from ${tableName} where id = ${id}`;
    let [rows, column_definitions] = await connection.query(selectQuery).then(logger.info("select Query before Update Executed - updateCharacter()")).catch((error) => { throw new errors.DatabaseError('characterModel', 'updateCharacter', 'Couldn\'t execute the command'); });

    //Check if there is an ID that matches in the database
    if (rows.length == 0) {
        throw new errors.InvalidInputError('characterModel', 'updateCharacter', "Invalid Id, character DOES NOT EXIST!");
    }
    let query = `Update ${tableName} SET name = '${newName.toLowerCase()}', race = '${newRace.toLowerCase()}', class = '${newClass.toLowerCase()}', hitpoints = ${newHitpoints} where id = ${id};`;
    await connection.execute(query).then(logger.info("Update Query Executed - updateCharacter()")).catch((error) => { throw new errors.DatabaseError(error.message); });
}



/**
 * 
 * @param {Integer} id 
 * @param {Integer} hpValueChange 
 * @description - This function updates the hitpoints of a character in the database after validating the inputs. If the hitpoints go to a negative value, they get set to 0 instead.
 * @throws {InvalidInputError} If the character is not found 
 * @throws {DatabaseError} If there was an error on the database's side
 */
async function hitpointsModifier(id, hpValueChange) {
    let selectQ = `Select hitpoints from ${tableName} where id = ${id};`;
    let [rows, column_definitions] = await connection.query(selectQ).then(console.log("select Query before HP change Executed - hitpointsModifier()")).catch((error) => { throw new errors.DatabaseError(error); });

    if (rows.length === 0) {
        throw new errors.InvalidInputError("Character not found with that id");
    }

    let newHp = rows[0].hitpoints + hpValueChange;

    if (newHp < 0) {
        newHp = 0;
    }

    let query = `Update ${tableName} SET hitpoints = ${newHp} where id = ${id};`;
    await connection.execute(query).then(console.log("Update Hitpoints Query Executed - hitpointsModifier()")).catch((error) => { throw new errors.DatabaseError(error); });
}

/**
 * @description - This function finds a specific character in the database by their name and race combination.
 * @param {String} name - The name of the character to find.
 * @param {String} race - The race of the character to find.
 * @returns the Id of the name and race combo
 */
async function findIdWithNameAndRace(name, race) {
    //with name and race we want to find the id because the id is never really accessible to the user
    let query = `select id from ${tableName} where name = '${name.toLowerCase()}' and race = '${race.toLowerCase()}';`;
    let [rows, column_definitions] = await connection.query(query).then(console.log("select Query before returning ID Executed")).catch((error) => { throw new errors.DatabaseError(error); });
    if (rows.length === 0) {
        throw new errors.InvalidInputError("Character not found with that name and race combo - findIdWithNameAndRace()");
    }
    return rows[0].id;
}

/**
 * Gets a specific character based off of the passed in ID
 * @param {Integer} id 
 * @returns an object containing the character
 * @throws {InvalidInputError} If the character is not found 
 */
async function getCharacter(id) {
    let query = `select id, name, race, class, hitpoints from ${tableName} where id = ${id};`;
    let [rows, column_definitions] = await connection.query(query).then(console.log("select Query before returning Character executed")).catch((error) => { throw new errors.DatabaseError(error); });
    if (rows.length === 0) {
        throw new errors.InvalidInputError("Character not found with that name and race combo - findIdWithNameAndRace()");
    }
    return rows[0];
}

/**
 * deletes a character from the database
 * @param {Integer} id 
 * @returns true if success, throws if false
 * @throws {InvalidInputError} If the character is not found 
 * @throws {DatabaseError} If there was an error on the database's side
 */
async function deleteCharacter(id) {
    let query = `delete from ${tableName} where id = ${id};`;

    try {
        let checkingQ = `select * from ${tableName} where id = ${id};`;
        let [rows, column_definitions] = await connection.query(checkingQ).then(console.log("Select query to check if Id exists has been executed"));

        if (rows.length === 0) {
            throw new errors.InvalidInputError("Character not found with that ID");
        }
        await connection.execute(query).then(console.log(`Delete Query Executed Character with id: ${id} was deleted`)).catch((error) => { throw new errors.DatabaseError("Delete Query could not be completed"); });
        return true;
    }
    catch (error) {
        throw error;
    }

}

/**
 * 
 * @returns the rows returned by selecting everything in the table in the database
 * @throws {InvalidInputError} If the character is not found 
 * @throws {DatabaseError} If there was an error on the database's side
 */
async function printDb() {
    let query = `Select * from ${tableName}`;
    let [rows, colum_definitions] = await connection.query(query).then(console.log("printDb() select method executed!")).catch((error) => { throw new errors.DatabaseError(error); });
    return rows;
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
    await connection.execute(sqlQuery).then(logger.info(`Table: Ethics Created/Exists - initialize()`))
        .catch((error) => { throw new errors.DatabaseError('characterModel', 'createEthicsTable', `Couldn't connect to the database: ${error.message}.`); });
}

/**
 * Creates the Morality table with an SQL Query
 * @throws {DatabaseError} if there was a problem with executing the SQL Query
 */
async function createMoralityTable() {
    const sql = `CREATE TABLE IF NOT EXISTS Morality(Id INT, Name TEXT, PRIMARY KEY(Id));`;
    await connection.execute(sql).then(logger.info(`Table: Morality Created/Exists - initialize()`))
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
    await connection.execute(sqlQueryC).then(logger.info(`Table: ${tableName} Created/Exists - initialize()`))
        .catch((error) => { throw new errors.DatabaseError('characterModel', 'createPlayerCharacterTable', `Couldn't connect to the database: ${error.message}.`); });
}
/**
 * Creates the KnownSpell table with an SQL Query
 * @throws {DatabaseError} if there was a problem with executing the SQL Query
 */
async function createKnownSpellTable() {
    const sql = `CREATE TABLE IF NOT EXISTS KnownSpell(SpellId INT, CharacterId INT, FOREIGN KEY (SpellId) 
    REFERENCES Spell(Id), FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), PRIMARY KEY (SpellId, CharacterId));`;
    await connection.execute(sql).then(logger.info(`Table: KnownSpell Created/Exists - initialize()`))
        .catch((error) => { throw new errors.DatabaseError('characterModel', 'createKnownSpellTable', `Couldn't connect to the database: ${error.message}.`); });

}

/**
 * Creates the OwnedItem table with an SQL Query
 * @throws {DatabaseError} if there was a problem with executing the SQL Query
 */
async function createOwnedItemTable() {
    const sql = `CREATE TABLE IF NOT EXISTS OwnedItem(CharacterId INT, Name VARCHAR(200), Count INT, 
    FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), PRIMARY KEY (CharacterId, Name));`;
    await connection.execute(sql).then(logger.info(`Table: KnownSpell Created/Exists - initialize()`))
        .catch((error) => { throw new errors.DatabaseError('characterModel', 'createOwnedItemTable', `Couldn't connect to the database: ${error.message}.`); });
}
/* #endregion */

module.exports = {
    initialize,
    addCharacter,
    printDb,
    updateCharacter,
    findIdWithNameAndRace,
    closeConnection,
    hitpointsModifier,
    getCharacter,
    deleteCharacter,
    getConnection
};