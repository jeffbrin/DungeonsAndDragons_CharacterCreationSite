const mysql = require('mysql2/promise');
const valUtils = require('./validateCharacterAndStatistics');
let connection;
const tableName = 'PlayerCharacter';
const logger = require('../logger');
const errors = require('./errorModel');
const characterStatsModel = require('./characterStatisticsModel');


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
    await characterStatsModel.initialize(databaseNameTmp);
    if (reset) {
        const deleteDbQuery = `DROP TABLE IF EXISTS OwnedItem, KnownSpell, ${tableName}, Morality, Ethics;`;
        try {
            await characterStatsModel.dropTables();
            await connection.execute(deleteDbQuery);
            logger.info(`Tables: OwnedItem, KnownSpell, ${tableName}, Morality deleted if existed to reset the Db and reset increment in initialize()`);
            
        } catch (error) {
            throw new errors.DatabaseError(`characterModel', 'initialize', "Couldn't connect to the database: ${error.message}`);
        }
    }

    await createEthicsTable();
    await createMoralityTable();
    await createPlayerCharacterTable();
    await createKnownSpellTable();
    await createOwnedItemTable();

    
    await characterStatsModel.createTables();
}




/**
 * Closes the Connection to the Database
 * @throws {DatabaseError} If there was an error on the database's side
 */
async function closeConnection() {
    try {
        await connection.end();
        logger.info(`Connection closed from closeConnection() in characterModel`);
    } catch (error) {
        throw new errors.DatabaseError('characterModel', 'closeConnection', "Couldn't close the database connection");
    }
}

/* #region  CRUD Operations */

/**
 * Helper method to make testing easier. Adds a character using the addCharacter method but takes in an object and splits it up once.
 * @param {Character} character - The character as an object
 * @returns uses the addCharacter function as a promise
 */
async function addCharacterObject(character) {
    return await addCharacter(character.ClassId, character.RaceId, character.Name, character.MaxHP,
        character.BackgroundId, character.EthicsId, character.MoralityId, character.Level, character.AbilityScoreValues,
        character.SavingThrowProficienciesIds, character.ProficiencyBonus, character.UserId, character.ArmorClass);
}

/**
 * Adds a Character to the PlayerCharacter table by first assign them a unique Id, depending on what is available in the database.
 * Then Validates all the inputs
 * @param {Integer} classId - The Id of the user's selected class - 1 Based
 * @param {Integer} raceId - The Id of the user's selected race - 1 Based
 * @param {String} name - The Name of the Character
 * @param {Integer} maxHP - The Maximum amount of Hit Points the character has
 * @param {Integer} background - The Integer representation of the Characters Background in the Background Table - 1 Based
 * @param {Integer} ethicsId - The Ethics of the Character - Foreign Key ID
 * @param {Integer} moralityId - The Morality of the Character
 * @param {Integer} level - The chosen Level of the Character
 * @param {Int32Array} abilityScoreValues - An array of size 6 of. Each index of the array is the ability score for that index's ability.
 * Ex. [10, 8, 15, 12, 9, 9] -> Starts at Strength and ends with Charisma. Ability Score Modifier is calculated off of these values.
 * @param {Int32Array} savingThrowProficienciesIds - An array of Saving Throw Proficiencies IDs. Each index of the array is the Integer of the 
 * Saving Throw the Character is proficient in (1 based)
 * @param {Integer} proficiencyBonus - The value of the proficiency bonus for a character in the Character Sheet
 * @param {Integer} userId - The Id of the user this character will belong to if created
 * @throws {InvalidInputError} - If the Input does not match up with the restrictions set
 * @throws {DatabaseError} - If there was an error connecting to the Database or with the Query
 * @returns {Integer} - The Character Id of the newly created character. If the Add fails, it throws and will not return.
 */
async function addCharacter(classId, raceId, name, maxHP, background, ethicsId, moralityId, level, abilityScoreValues, savingThrowProficienciesIds, proficiencyBonus, userId, armorClass) {

    //select from character table and select the next highest available id top order by ID
    const idQuery = `SELECT Id from ${tableName} ORDER BY Id DESC LIMIT 1;`
    let characterId = 1;
    try {
        let [rows, column_definitions] = await connection.query(idQuery);
        if (rows.length != 0) {
            characterId = parseInt(rows[0].Id);
        }
        await valUtils.isCharValid(connection, name, raceId, classId, maxHP, background, ethicsId, moralityId, level, abilityScoreValues, savingThrowProficienciesIds, userId, armorClass);
    }
    catch (error) {
        throw new errors.InvalidInputError("characterModel", "addCharacter", `Couldn't Validate the character: ${error.message}`);
    }

    //ADD CHAR TO DB
    let query = `INSERT into ${tableName} (Id, UserId, ClassId, RaceId, EthicsId, MoralityId, BackgroundId, Name, MaxHp, CurrentHp, Level, ProficiencyBonus, ArmorClass) values 
    (${characterId}, ${userId}, ${classId}, ${raceId}, ${ethicsId}, ${moralityId}, ${background}, '${name}', ${maxHP}, ${maxHP}, ${level}, ${proficiencyBonus}, ${armorClass});`;

    try {
        await connection.execute(query);
        logger.info("Insert command executed in addCharacter");
    } catch (error) {
        throw new errors.DatabaseError('characterModel', 'addCharacter', 'Couldn\'t execute the command');
    }


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
    return characterId;
}

/**
 * 
 * @param {Integer} characterId - The Id of the character that will be updated
 * @param {Integer} classId - The Id of the user's selected class - 1 Based
 * @param {Integer} raceId The Id of the user's selected race - 1 Based
 * @param {Integer} ethicsId - The Ethics of the Character - Foreign Key ID
 * @param {Integer} moralityId - The Morality of the Character
 * @param {Integer} backgroundId - The Integer representation of the Characters Background in the Background Table - 1 Based
 * @param {String} name - The Name of the Character
 * @param {Integer} maxHp - The Maximum amount of Hit Points the character has
 * @param {Integer} level - The chosen Level of the Character
 * @param {Int32Array} abilities - An array of size 6. Each index of the array is the ability score for that index's ability.
 * Ex. [15, 9, 8, 12, 14, 10] -> Starts at Strength and ends with Charisma.
 * @param {Int32Array} savingThrows - An array of Saving Throw Proficiencies IDs. Each index of the array is the Integer of the 
 * Saving Throw the Character is proficient in (1 based)
 * @param {Integer} proficiencyBonus - The value of the proficiency bonus for a character in the Character Sheet
 * @returns {Integer} The Id of the Character that was just updated, throws otherwise.
 */
async function updateCharacter(characterId, classId, raceId, ethicsId, moralityId, backgroundId, name, maxHp, level, abilities, savingThrows, proficiencyBonus, userId, armorClass) {
    try {
        await valUtils.isCharValid(connection, name, raceId, classId, maxHp, backgroundId, ethicsId, moralityId, level, abilities, savingThrows, userId)
    } catch (error) {
        throw new errors.InvalidInputError('characterModel', 'updateCharacter', `Invalid Character, cannot update character: ${error.message}`);
    }

    let selectQuery = `Select 1 from ${tableName} WHERE id = ${characterId}`;
    let rows, column_definitions;

    try {

        [rows, column_definitions] = await connection.query(selectQuery);
        logger.info("select Query before Update Executed - updateCharacter()");

    } catch (error) {

        throw new errors.DatabaseError('characterModel', 'updateCharacter', `Couldn\`t execute the command: ${error.message}`);

    }


    //Check if there is an ID that matches in the database
    if (rows.length == 0) {

        throw new errors.InvalidInputError('characterModel', 'updateCharacter', "Invalid Id, character DOES NOT EXIST!");
    }

    let query = `Update ${tableName} SET Name = '${name.replace(/'/g, "''")}', RaceId = ${raceId}, 
        ClassId = ${classId}, MaxHp = ${maxHp}, EthicsId = ${ethicsId}, MoralityId = ${moralityId}, BackgroundId = ${backgroundId},
        ProficiencyBonus = ${proficiencyBonus}, Level = ${level}, ArmorClass = ${armorClass} where id = ${characterId};`;


    try {
        await connection.execute(query);
        logger.info("Update Query Executed - updateCharacter(), will update characterStatistics in a sec...")
    } catch (error) {
        throw new errors.DatabaseError('characterModule', 'updateCharacter', `Update Failed, Database error: ${error.message}`);
    }

    //Character Statistics Table
    try {

        //Add To Character Statistics Table
        //Add Saving Throw Proficiency for each in the array of Ids
        for (let i = 0; i < savingThrows.length; i++) {
            await characterStatsModel.addSavingThrowProficiency(characterId, savingThrows[i]);
        }


        //Add Ability Score Values
        await characterStatsModel.setAbilityScores(characterId, abilities);

    } catch (error) {
        if (error instanceof errors.InvalidInputError) {
            throw new errors.InvalidInputError('characterModel', 'addCharacter', `Couldn't Add saving throw proficiency or ability score from within the Character statistics model: ${error.message}`);
        }
        else {
            throw new errors.DatabaseError('characterModel', 'addCharacter', `Database connection or query error, Couldn't Add saving throw proficiency or ability score from within the Character statistics model: ${error.message}`);
        }
    }

    return characterId;
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
    let rows, column_definitions;
    try {
        [rows, column_definitions] = await connection.query(selectQ);
        logger.info("select Query before CurrentHp change Executed - addRemoveHp");
    } catch (error) {
        throw new errors.DatabaseError('characterModel', 'addRemoveHp', `Database connection failed ${error.message}`);
    }


    if (rows.length === 0) {
        throw new errors.InvalidInputError('characterModel', 'addRemoveHp', `Character with id: ${id} was not found in the Database`);
    }

    let newHp = rows[0].CurrentHp + hpValueChange;

    let query = `Update ${tableName} SET CurrentHp = ${newHp} WHERE Id = ${id};`;
    try {
        await connection.execute(query);
        logger.info("Update CurrentHp Query Executed - addRemoveHp");
    } catch (error) {
        throw new errors.DatabaseError('characterModel', 'addRemoveHp', `Database connection failed, couldn't update CurrentHp. ${error.message}`);
    }
}


//Id INT, UserId INT, ClassId INT, RaceId INT, EthicsId INT, 
//MoralityId INT, BackgroundId INT, Name TEXT, ProficiencyBonus INT, MaxHp INT, CurrentHp INT, Level INT, ArmorClass INT, Speed INT, Initiative INT, 
//Experience INT
/**
 * Gets a specific character based off of the passed in ID
 * @param {Integer} id - the Id of the character that needs to be retrieved from the database
 * @returns An Object Containing the Character { Id: {Int}, Name: {String}, Class: {String}, Race: {String}, Ethics: {String}, Morality: {String}, Background:{String}, ProficiencyBonus: {Int}, 
 * MaxHp: {Int}, CurrentHp: {Int}, Level: {Int}, ArmorClass: {Int}, Speed: {Int}, Initiative: {Int}, Experience: {Int}, OwnedItem: {Name, Count},  }
 * @throws {InvalidInputError} If the character is not found 
 */
async function getCharacter(id) {

    //First Check to see if the character exists
    try {
        const q = `Select 1 from ${tableName} where Id = ${id}`;
        let [rows, cols] = await connection.query(q);
        if (rows.length <= 0)
            throw new errors.InvalidInputError('characterModel', 'getCharacter', `Couldn't find character with Id: ${id}`);
    } catch (error) {
        throw error;
    }

    //Now we know the character exists
    let query = `SELECT c.Id, c.Name, cl.Id, r.Id, e.Id, m.Id, b.Id, 
    c.ProficiencyBonus, c.MaxHp, c.CurrentHp, c.Level, c.ArmorClass
    FROM PlayerCharacter c, Ethics e, Morality m, Race r, Class cl, Background b 
    WHERE c.Id = ${id} and c.EthicsId = e.Id and m.Id = c.MoralityId and c.RaceId = r.Id and c.ClassId = cl.Id and c.BackgroundId = b.Id;`;

    let rows, column_definitions;


    try {

        [rows, column_definitions] = await connection.query(query);
        logger.info("select Query of PlayerCharacter, Ethics, Morality, Race, Class, and Background tables..");


    } catch (error) {
        throw new errors.DatabaseError('characterModel', 'getCharacter', `Database connection failed, couldn't get Character. ${error.message}`);
    }
    if (rows.length === 0) {
        throw new errors.InvalidInputError('characterModel', 'getCharacter', `Character not found with id: ${id}`);
    }

    character = rows[0];
    //Character now has the fields queried

    try {
        let proficiencies = await characterStatsModel.getSavingThrowProficiencies(id);
        character.SavingThrowProficiencies = proficiencies;
        logger.info("SavingThrowProficiencies have been gotten from the StatisticsModel.");
    } catch (error) {
        throw error;
    }



    try {
        let abilityScores = await characterStatsModel.getAbilityScores(id);
        character.AbilityScores = abilityScores;
        logger.info("AbilityScores have been gotten from the StatisticsModel.");
    } catch (error) {
        throw error;
    }


    //getting owned Items
    try {
        const ownedQ = `SELECT Name, Count FROM OwnedItem WHERE CharacterId = ${id};`;
        let [rows, colum_definitions] = await connection.query(ownedQ);
        character.OwnedItems = rows;
        logger.info("OwnedItems have been gotten from the Database.");
    } catch (error) {
        throw new errors.DatabaseError('characterModel', 'getCharacter', `Database Error, couldn't get Owned Items: ${error.message}`);
    }
    

    //Get name of morality and ethics, race, class, background

    return character;
}


/**
 * Gets all the moralities from the Morality Table
 * @returns {Array} - An array of String Names for each of the three moralities
 * @throws {DatabaseError} - If the query fails
 */
async function getAllMoralities(){
    let query = `SELECT Name from Morality;`;

    let rows;
    try {
        [rows, colum_definitions] = await connection.query(query);
    } catch (error) {
        throw new errors.DatabaseError('characterModel', 'getAllMoralities', `Database Error: ${error.message}`);
    }

    return rows;
}

/**
 * Gets all the Ethics from the Ethics Table
 * @returns {Array} - An array of String Names for each of the three Ethics
 * @throws {DatabaseError} - If the query fails
 */
 async function getAllEthics(){
    let query = `SELECT Name from Ethics;`;

    let rows;
    try {
        [rows, colum_definitions] = await connection.query(query);
    } catch (error) {
        throw new errors.DatabaseError('characterModel', 'getAllEthics', `Database Error: ${error.message}`);
    }

    return rows;
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

    characters = []
    for (row of rows){
        characters.push(await getCharacter(row.Id));
    }

    return characters
}

/**
 * Deletes a character from the database with the given Id
 * @param {Integer} id 
 * @throws {InvalidInputError} If the character is not found 
 * @throws {DatabaseError} If there was an error on the database's side
 * @returns {boolean} true if deleted, throws otherwise
 */
async function removeCharacter(id) {
    let query = `DELETE FROM ${tableName} WHERE Id = ${id};`;

    //Select The Id of the user who's character this belongs to in order to remove that character from them as well

    try {
        let checkingQ = `SELECT Id from ${tableName} WHERE Id = ${id};`;
        let [rows, column_definitions] = await connection.query(checkingQ);
        logger.info("Select query to check if Id exists has been executed");
        if (rows.length === 0) {
            throw new errors.InvalidInputError('characterModel', 'removeCharacter', `Character with Id: ${id} does not exist in the Database.`);
        }

        let ownedItemsQ = `DELETE FROM OwnedItem where CharacterId = ${id};`;
        await connection.execute(ownedItemsQ);

        let knownSpellsQ = `DELETE FROM KnownSpell where CharacterId = ${id};`;
        await connection.execute(knownSpellsQ);

        let savingThrowQ = `DELETE FROM SavingThrowProficiency WHERE CharacterId = ${id};`;
        await connection.execute(savingThrowQ);

        let expertise = `DELETE FROM SkillExpertise WHERE CharacterId = ${id};`;
        await connection.execute(expertise);

        let abilityScoreQ = `DELETE FROM AbilityScore where CharacterId = ${id};`;
        await connection.execute(abilityScoreQ);

        let skillProfQ = `DELETE FROM SkillProficiency WHERE CharacterId = ${id};`;
        await connection.execute(skillProfQ);


        await connection.execute(query);
        logger.info(`Delete Query Executed Character with id: ${id}. About to return true`);
        return true;
    }
    catch (error) {
        throw new errors.DatabaseError('characterModel', 'removeCharacter', `Database connection failed, couldn't delete Character with id ${id}. ${error.message}`);
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
 * Inserts the 3 ethics to the table if they are not already there
 * @throws {DatabaseError} if there was a problem with executing the SQL Queries
 */
async function createEthicsTable() {
    const sqlQuery = "CREATE TABLE IF NOT EXISTS Ethics(Id INT, Name TEXT, PRIMARY KEY(Id));";
    try {
        await connection.execute(sqlQuery);
        logger.info(`Table: Ethics Created/Exists - createEthicsTable()`);
    } catch (error) {
        throw new errors.DatabaseError('characterModel', 'createEthicsTable', `Couldn't connect to the database: ${error.message}.`);
    }

    const checkIfEthics = `SELECT Id from Ethics;`;
    const ethics = ['lawful', 'chaotic', 'neutral'];
    try {
        let [rows, columns] = await connection.query(checkIfEthics);
        if (!rows.length > 0) {
            logger.info(`Ethics not there, will add them to the Ethics Table.`);
            for (let i = 0; i < 3; i++) {
                const ethicsQ = `INSERT INTO Ethics(Id, Name) VALUES (${i + 1}, '${ethics[i]}');`;
                await connection.execute(ethicsQ);
                logger.info(`Added ${ethics[i]} to the Ethics Table with Id: ${i + 1}`);
            }
            return;
        }
        logger.info(`Ethics already there, will not add them.`)
    } catch (error) {
        throw new errors.DatabaseError('characterModel', 'createEthicsTable', `Database connection or query error, Couldn't Add or query from the Ethics table: ${error.message}`);
    }


}

/**
 * Creates the Morality table with an SQL Query
 * Adds the 3 moralities to the table if there are none in the Table (if they were added before)
 * @throws {DatabaseError} if there was a problem with executing the SQL Query
 */
async function createMoralityTable() {
    const sql = `CREATE TABLE IF NOT EXISTS Morality(Id INT, Name TEXT, PRIMARY KEY(Id));`;

    try {

        await connection.execute(sql);
        logger.info(`Table: Morality Created/Exists - createMoralityTable()`);

    } catch (error) {

        throw new errors.DatabaseError('characterModel', 'createMoralityTable', `Couldn't connect to the database: ${error.message}.`);

    }
    const checkIfMoralities = `SELECT Id from Morality;`;
    const moralities = ['good', 'evil', 'neutral'];
    try {
        let [rows, columns] = await connection.query(checkIfMoralities);
        if (!rows.length > 0) {
            logger.info(`Moralities not there, will add them to the Morality Table.`);
            for (let i = 0; i < 3; i++) {
                const moralityQ = `INSERT INTO Morality(Id, Name) VALUES (${i + 1}, '${moralities[i]}');`;
                await connection.execute(moralityQ);
                logger.info(`Added ${moralities[i]} to the Morality Table with Id: ${i + 1}`);
            }
            return;
        }
        logger.info(`Moralities already there, will not add them.`)
    } catch (error) {
        throw new errors.DatabaseError('characterModel', 'createMoralityTable', `Database connection or query error, Couldn't Add or query from the Morality table: ${error.message}`);
    }
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

    try {
        await connection.execute(sqlQueryC);
        logger.info(`Table: ${tableName} Created/Exists - createPlayerCharacterTable()`);
    } catch (error) {
        throw new errors.DatabaseError('characterModel', 'createPlayerCharacterTable', `Couldn't connect to the database: ${error.message}.`);
    }
}
/**
 * Creates the KnownSpell table with an SQL Query
 * @throws {DatabaseError} if there was a problem with executing the SQL Query
 */
async function createKnownSpellTable() {
    const sql = `CREATE TABLE IF NOT EXISTS KnownSpell(SpellId INT, CharacterId INT, FOREIGN KEY (SpellId) 
    REFERENCES Spell(Id), FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), PRIMARY KEY (SpellId, CharacterId));`;

    try {
        await connection.execute(sql);
        logger.info(`Table: KnownSpell Created/Exists - createKnownSpellTable()`);
    } catch (error) {
        throw new errors.DatabaseError('characterModel', 'createKnownSpellTable', `Couldn't connect to the database: ${error.message}.`);
    }
}

/**
 * Creates the OwnedItem table with an SQL Query
 * @throws {DatabaseError} if there was a problem with executing the SQL Query
 */
async function createOwnedItemTable() {
    const sql = `CREATE TABLE IF NOT EXISTS OwnedItem(CharacterId INT, Name VARCHAR(200), Count INT, 
    FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), PRIMARY KEY (CharacterId, Name));`;

    try {
        await connection.execute(sql);
        logger.info(`Table: KnownSpell Created/Exists - createOwnedItemTable()`);
    } catch (error) {
        throw new errors.DatabaseError('characterModel', 'createOwnedItemTable', `Couldn't connect to the database: ${error.message}.`);
    }
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
    getAllEthics,
    getAllMoralities,
    levelUp,
    updateExp,
    updateAC,
    updateSpeed,
    updateInitiative,
    addCharacterObject
};