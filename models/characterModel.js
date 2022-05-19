const mysql = require('mysql2/promise');
const valUtils = require('./validateCharacterAndStatistics');
let connection;
const tableName = 'PlayerCharacter';
const logger = require('../logger');
const errors = require('./errorModel');
const characterStatsModel = require('./characterStatisticsModel');
const raceModel = require('./raceModel');
const backgroundModel = require('./backgroundModel');
const classModel = require('./classModel');
const spellModel = require('./spellModel');


/**
 * Initializes the connection to the database. 
 * It also creates the tables needed and drops the tables if reset is true.
 * @param {String} databaseNameTmp - The name of the database to connect to.
 * @param {Boolean} reset - If true, the database will be reset before the connection is made.
 * @throws {DatabaseError} if there was a problem with a query (connection not initialized, bad query);
 */
async function initialize(databaseNameTmp, reset)
{
    connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        port: '10000',
        password: 'pass',
        database: databaseNameTmp
    });

    //if reset true, drop all the tables in reverse creation order.
    await characterStatsModel.initialize(databaseNameTmp);
    if (reset)
    {
        const dropItem = `DROP TABLE IF EXISTS OwnedItem;`;
        const dropSpell = `DROP TABLE IF EXISTS KnownSpell;`;
        const dropPlayer = `DROP TABLE IF EXISTS PlayerCharacter;`;
        const dropMorality = `DROP TABLE IF EXISTS Morality;`;
        const dropEthics = `DROP TABLE IF EXISTS Ethics;`;
        try
        {
            await characterStatsModel.dropTables();
            await connection.execute(dropItem);
            await connection.execute(dropSpell);
            await connection.execute(dropPlayer);
            await connection.execute(dropMorality);
            await connection.execute(dropEthics);

            logger.info(`Tables: OwnedItem, KnownSpell, ${ tableName }, Morality deleted if existed to reset the Db and reset increment in initialize()`);

        } catch (error)
        {
            throw new errors.DatabaseError(`characterModel', 'initialize', "Couldn't connect to the database: ${ error.message }`);
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
async function closeConnection()
{
    try
    {
        await connection.end();
        logger.info(`Connection closed from closeConnection() in characterModel`);
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'closeConnection', "Couldn't close the database connection");
    }
}

/* #region  CRUD Operations */

/**
 * Helper method to make testing easier. Adds a character using the addCharacter method but takes in an object and splits it up once.
 * @param {Character} character - The character as an object
 * @returns uses the addCharacter function as a promise
 */
async function addCharacterObject(character)
{
    try
    {
        return await addCharacter(character.ClassId, character.RaceId, character.Name, character.MaxHP,
            character.BackgroundId, character.EthicsId, character.MoralityId, character.Level, character.AbilityScoreValues,
            character.SavingThrowProficienciesIds, character.ProficiencyBonus, character.UserId, character.ArmorClass);
    } catch (error)
    {
        throw error;
    }

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
async function addCharacter(classId, raceId, name, maxHP, background, ethicsId, moralityId, level, abilityScoreValues, savingThrowProficienciesIds, proficiencyBonus, userId, armorClass)
{

    //select from character table and select the next highest available id top order by ID
    const idQuery = `SELECT Id from ${ tableName } ORDER BY Id DESC LIMIT 1;`;
    let characterId = 1;
    try
    {
        let [rows, column_definitions] = await connection.query(idQuery);
        if (rows.length != 0)
        {
            characterId = parseInt(rows[0].Id + 1);
        }
        await valUtils.isCharValid(connection, name, raceId, classId, maxHP, background, ethicsId, moralityId, level, abilityScoreValues, savingThrowProficienciesIds, userId, armorClass);
    }
    catch (error)
    {
        throw new errors.InvalidInputError("characterModel", "addCharacter", `Couldn't Validate the character: ${ error.message }`);
    }

    //ADD CHAR TO DB
    let query = `INSERT into ${ tableName } (Id, UserId, ClassId, RaceId, EthicsId, MoralityId, BackgroundId, Name, MaxHp, CurrentHp, Level, ProficiencyBonus, ArmorClass) values 
    (${ characterId }, ${ userId }, ${ classId }, ${ raceId }, ${ ethicsId }, ${ moralityId }, ${ background }, '${ name }', ${ maxHP }, ${ maxHP }, ${ level }, ${ proficiencyBonus }, ${ armorClass });`;

    try
    {
        await connection.execute(query);
        logger.info("Insert command executed in addCharacter");
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'addCharacter', `Couldn't execute the command: ${ error }`);
    }


    try
    {

        //Add To Character Statistics Table
        //Add Saving Throw Proficiency for each in the array of Ids
        for (let i = 0; i < savingThrowProficienciesIds.length; i++)
        {
            await characterStatsModel.addSavingThrowProficiency(characterId, savingThrowProficienciesIds[i]);
        }


        //Add Ability Score Values
        await characterStatsModel.setAbilityScores(characterId, abilityScoreValues);

    } catch (error)
    {
        if (error instanceof errors.InvalidInputError)
        {
            throw new errors.InvalidInputError('characterModel', 'addCharacter', `Couldn't Add saving throw proficiency or ability score from within the Character statistics model: ${ error.message }`);
        }
        else
        {
            throw new errors.DatabaseError('characterModel', 'addCharacter', `Database connection or query error, Couldn't Add saving throw proficiency or ability score from within the Character statistics model: ${ error.message }`);
        }
    }
    return characterId;
}


async function updateCharacterObject(character)
{
    try
    {
        return await updateCharacter(character.Id, character.ClassId, character.RaceId, character.EthicsId, character.MoralityId, character.BackgroundId,
            character.Name, character.MaxHP,
            character.Level, character.AbilityScoreValues,
            character.SavingThrowProficienciesIds, character.ProficiencyBonus, character.UserId, character.ArmorClass);
    } catch (error)
    {
        throw error;
    }

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
async function updateCharacter(characterId, classId, raceId, ethicsId, moralityId, backgroundId, name, maxHp, level, abilities, savingThrows, proficiencyBonus, userId, armorClass)
{
    try
    {
        await valUtils.isCharValid(connection, name, raceId, classId, maxHp, backgroundId, ethicsId, moralityId, level, abilities, savingThrows, userId);
    } catch (error)
    {
        throw new errors.InvalidInputError('characterModel', 'updateCharacter', `Invalid Character, cannot update character: ${ error.message }`);
    }

    let selectQuery = `Select 1 from ${ tableName } WHERE id = ${ characterId }`;
    let rows, column_definitions;

    try
    {

        [rows, column_definitions] = await connection.query(selectQuery);
        logger.info("select Query before Update Executed - updateCharacter()");

    } catch (error)
    {

        throw new errors.DatabaseError('characterModel', 'updateCharacter', `Couldn\`t execute the command: ${ error.message }`);

    }


    //Check if there is an ID that matches in the database
    if (rows.length == 0)
    {

        throw new errors.InvalidInputError('characterModel', 'updateCharacter', "Invalid Id, character DOES NOT EXIST!");
    }

    let query = `Update ${ tableName } SET Name = '${ name.replace(/'/g, "''") }', RaceId = ${ raceId }, 
        ClassId = ${ classId }, MaxHp = ${ maxHp }, EthicsId = ${ ethicsId }, MoralityId = ${ moralityId }, BackgroundId = ${ backgroundId },
        ProficiencyBonus = ${ proficiencyBonus }, Level = ${ level }, ArmorClass = ${ armorClass } where id = ${ characterId };`;


    try
    {
        await connection.execute(query);
        logger.info("Update Query Executed - updateCharacter(), will update characterStatistics in a sec...");
    } catch (error)
    {
        throw new errors.DatabaseError('characterModule', 'updateCharacter', `Update Failed, Database error: ${ error.message }`);
    }



    //Character Statistics Table
    try
    {

        //Add To Character Statistics Table
        //Add Saving Throw Proficiency for each in the array of Ids
        for (let i = 0; i < savingThrows.length; i++)
        {
            await characterStatsModel.addSavingThrowProficiency(characterId, savingThrows[i]);
        }


        //Add Ability Score Values
        await characterStatsModel.setAbilityScores(characterId, abilities);

    } catch (error)
    {
        if (error instanceof errors.InvalidInputError)
        {
            throw new errors.InvalidInputError('characterModel', 'addCharacter', `Couldn't Add saving throw proficiency or ability score from within the Character statistics model: ${ error.message }`);
        }
        else
        {
            throw new errors.DatabaseError('characterModel', 'addCharacter', `Database connection or query error, Couldn't Add saving throw proficiency or ability score from within the Character statistics model: ${ error.message }`);
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
async function addRemoveHp(id, hpValueChange)
{
    let selectQ = `Select CurrentHp from ${ tableName } WHERE Id = ${ id };`;
    let rows, column_definitions;
    hpValueChange = parseInt(hpValueChange);
    try
    {
        [rows, column_definitions] = await connection.query(selectQ);
        logger.info("select Query before CurrentHp change Executed - addRemoveHp");
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'addRemoveHp', `Database connection failed ${ error.message }`);
    }


    if (rows.length === 0)
    {
        throw new errors.InvalidInputError('characterModel', 'addRemoveHp', `Character with id: ${ id } was not found in the Database`);
    }

    let newHp = rows[0].CurrentHp + hpValueChange;

    let query = `Update ${ tableName } SET CurrentHp = ${ newHp } WHERE Id = ${ id };`;
    try
    {
        await connection.execute(query);
        logger.info("Update CurrentHp Query Executed - addRemoveHp");
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'addRemoveHp', `Database connection failed, couldn't update CurrentHp. ${ error.message }`);
    }
}

/**
 * Gets a specific character based off of the passed in ID
 * @param {Integer} id - the Id of the character that needs to be retrieved from the database
 * @param {Integer} userId - The numeric id of the use who owns the character
 * @returns An Object Containing the Character { Id: {Int}, Name: {String}, Class: {Object}, Race: {Object}, Ethics: {Object}, Morality: {Object}, Background:{Object}, ProficiencyBonus: {Int}, 
 * MaxHp: {Int}, CurrentHp: {Int}, Level: {Int}, ArmorClass: {Int}, Speed: {Int}, Initiative: {Int}, Experience: {Int}, OwnedItem: {Name, Count}, SavingThrowProficiencies: {Int Array},
 * KnownSpells: {Object}  }
 * @throws {InvalidInputError} If the character is not found 
 */
async function getCharacter(id, userId)
{

    //First Check to see if the character exists
    try
    {
        const q = `Select 1 from ${ tableName } where Id = ${ id }`;
        let [rows, cols] = await connection.query(q);
        if (rows.length <= 0)
            throw new errors.InvalidInputError('characterModel', 'getCharacter', `Couldn't find character with Id: ${ id }`);
    } catch (error)
    {
        throw error;
    }

    //Now we know the character exists
    let query = `SELECT c.Id, c.Name, cl.Id as classId, r.Id as raceId, e.Name as Ethics, m.Name as Morality, b.Id as backgroundId, 
    c.ProficiencyBonus, c.MaxHp, c.CurrentHp, c.Level, c.ArmorClass
    FROM PlayerCharacter c, Ethics e, Morality m, Race r, Class cl, Background b 
    WHERE c.Id = ${ id } and c.EthicsId = e.Id and m.Id = c.MoralityId and c.RaceId = r.Id and c.ClassId = cl.Id and c.BackgroundId = b.Id;`;

    let rows, column_definitions;


    try
    {
        [rows, column_definitions] = await connection.query(query);
        logger.info("select Query of PlayerCharacter, Ethics, Morality, Race, Class, and Background tables..");
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'getCharacter', `Database connection failed, couldn't get Character. ${ error.message }`);
    }
    if (rows.length === 0)
        throw new errors.InvalidInputError('characterModel', 'getCharacter', `Character not found with id: ${ id }`);

    character = rows[0];
    //Character now has the fields queried

    try
    {
        let proficiencies = await characterStatsModel.getSavingThrowProficiencies(id);
        character.SavingThrowProficiencies = proficiencies;
        logger.info("SavingThrowProficiencies have been gotten from the StatisticsModel.");
    } catch (error)
    {
        throw error;
    }

    try
    {
        let abilityScores = await characterStatsModel.getAbilityScores(id);
        character.AbilityScores = abilityScores;
        logger.info("AbilityScores have been gotten from the StatisticsModel.");
    } catch (error)
    {
        throw error;
    }


    //getting owned Items
    try
    {
        const ownedQ = `SELECT Name, Count FROM OwnedItem WHERE CharacterId = ${ id };`;
        let [rows, colum_definitions] = await connection.query(ownedQ);
        character.OwnedItems = rows;
        logger.info("OwnedItems have been gotten from the Database.");
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'getCharacter', `Database Error, couldn't get Owned Items: ${ error.message }`);
    }

    //Initiative and Speed and exp
    try
    {
        const initiativeQ = `SELECT Initiative FROM PlayerCharacter WHERE Id = ${ id };`;
        let [rows, col] = await connection.query(initiativeQ);
        character.Initiative = rows[0].Initiative;

        const speedQ = `SELECT Speed FROM PlayerCharacter WHERE Id = ${ id };`;
        let [rowsSpeed, cols] = await connection.query(speedQ);
        character.Speed = rowsSpeed[0].Speed;


        const expQ = `Select Experience FROM ${ tableName } WHERE Id = ${ id };`;
        let [rowExp, columnsExp] = await connection.query(expQ);
        if (rowExp[0].Experience == null || rowExp[0].Experience < 0)
        {
            character.Experience = 0;
        }
        else
        {
            character.Experience = rowExp[0].Experience;
        }

    } catch (error)
    {
        throw error;
    }

    //Get race, class, background
    character.Race = await raceModel.getRace(character.raceId);
    delete character.raceId;

    character.Class = await classModel.getClass(character.classId);
    delete character.classId;

    character.Background = await backgroundModel.getBackground(character.backgroundId);
    delete character.backgroundId;


    //get spells
    const spellsQ = `SELECT SpellId FROM KnownSpell WHERE CharacterId = ${ id };`;
    let spells = [];
    try
    {
        let [spellIds, columnsDefs] = await connection.query(spellsQ);
        if (spellIds.length != 0)
        {
            for (let i = 0; i < spellIds.length; i++)
            {
                spells.push(await spellModel.getSpellById(spellIds[i].SpellId, userId));
            }
        }
        character.Spells = spells;

    } catch (error)
    {
        throw error;
    }

    return character;
}


/**
 * Gets all the moralities from the Morality Table
 * @returns {Array} - An array of String Names for each of the three moralities
 * @throws {DatabaseError} - If the query fails
 */
async function getAllMoralities()
{
    let query = `SELECT Name from Morality;`;

    let rows;
    try
    {
        [rows, colum_definitions] = await connection.query(query);
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'getAllMoralities', `Database Error: ${ error.message }`);
    }

    return rows;
}

/**
 * Gets all the Ethics from the Ethics Table
 * @returns {Array} - An array of String Names for each of the three Ethics
 * @throws {DatabaseError} - If the query fails
 */
async function getAllEthics()
{
    let query = `SELECT Name from Ethics;`;

    let rows;
    try
    {
        [rows, colum_definitions] = await connection.query(query);
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'getAllEthics', `Database Error: ${ error.message }`);
    }

    return rows;
}


/**
 * Adds an item to the OwnedItem table. Checks if user is valid and if item already exists
 * If already exists then calls the helper function to increase the number of that item in the table
 * @param {Integer} characterId - The Id of the character that will owned this item
 * @param {String} itemName - The name of the Item
 * @param {Integer} itemCount - The amount of this item
 * @throws {DatabaseError} - Thrown when there is a database error and one of the queries wasn't completed
 * @throws {InvalidInputError} - Thrown if there was an error with the User ID not being in the Database or 
 * If itemCount parses to NaN
 */
async function addItem(characterId, itemName, itemCount)
{
    itemCount = parseInt(itemCount);
    if (isNaN(itemCount))
    {
        throw new errors.InvalidInputError('characterModel', 'addItem', `Item Count Must be a number`);
    }
    //check characterId
    const characterS = `SELECT * FROM ${ tableName } WHERE Id = ${ characterId };`;
    let characters, columns;
    try
    {
        [characters, columns] = await connection.query(characterS);
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'addItem', `Error querying the Database: ${ error.message }`);
    }
    if (characters.length === 0)
    {
        throw new errors.InvalidInputError('characterModel', 'addItem', `Invalid character Id.`);
    }


    //check to see if there already is this item
    itemName = itemName.toLowerCase();
    const selectQ = `SELECT * FROM OwnedItem WHERE CharacterId = ${ characterId } AND Name = '${ itemName.replace(/'/g, "''") }';`;
    let rows, cols;
    try
    {
        [rows, cols] = await connection.query(selectQ);
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'addItem', `Error querying the Database: ${ error.message }`);
    }

    if (rows.length != 0)
    {
        try
        {
            itemCount += parseInt(rows[0].Count);
            await changeQuantityItem(characterId, itemName, itemCount);
        } catch (error)
        {
            throw error;
        }

    }
    else
    {
        const insertQ = `INSERT INTO OwnedItem (CharacterId, Name, Count) VALUES (${ characterId }, '${ itemName.replace(/'/g, "''") }', ${ itemCount });`;
        try
        {
            await connection.execute(insertQ);
        } catch (error)
        {
            throw new errors.DatabaseError('characterModel', 'addItem', `Couldn't insert the item: ${ error.message }`);
        }
    }
}

/**
 * Updates the Owned Item Table with the new values
 * Helper Method
 * @param {*} characterId - The Id of the Character who owns the item
 * @param {*} itemName - The name of the item (lowercased already)
 * @param {*} itemCount - The new count of the item (calculated inside last function)
 * @throws {DatabaseError} Thrown when there is a database error and the query wasn't executed properly
 */
async function changeQuantityItem(characterId, itemName, itemCount)
{

    let query;
    itemCount = parseInt(itemCount);
    if (itemCount <= 0)
    {
        //delete
        query = `DELETE FROM OwnedItem WHERE CharacterID = ${ characterId } AND Name = '${ itemName }';`;
    }
    else
    {
        //update to new value that is > 0
        query = `UPDATE OwnedItem SET Count = ${ itemCount } WHERE CharacterID = ${ characterId } AND Name = '${ itemName }';`;
    }


    try
    {
        await connection.execute(query);
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'changeQuantityItem', `Error while updating or deleting the item to its new Count value: ${ error.message }`);
    }

}


/**
 * Removes a specific amount of an item from the table
 * @param {Integer} characterId - The character Id 
 * @param {String} itemName - The name of the 
 * @param {Integer} itemCount - A negative number to remove from the table
 * @throws {InvalidInputError} - Thrown when the itemCount is not negative OR
 * The Character Id is invalid
 * @throws {DatabaseError} - Thrown if there is an error with the queries to the database
 */
async function removeItem(characterId, itemName, itemCount)
{
    if (itemCount >= 0)
    {
        throw new errors.InvalidInputError('characterModel', 'removeItem', 'Item count must be negative!');
    }
    //check characterId
    const characterS = `SELECT * FROM ${ tableName } WHERE Id = ${ characterId };`;
    let characters, columns;
    try
    {
        [characters, columns] = await connection.query(characterS);
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'addItem', `Error querying the Database: ${ error.message }`);
    }
    if (characters.length === 0)
    {
        throw new errors.InvalidInputError('characterModel', 'addItem', `Invalid character Id.`);
    }


    //check to see if there already is this item
    itemName = itemName.toLowerCase();
    const selectQ = `SELECT * FROM OwnedItem WHERE CharacterId = ${ characterId } AND Name = '${ itemName }';`;
    let rows, cols;
    try
    {
        [rows, cols] = await connection.query(selectQ);
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'addItem', `Error querying the Database: ${ error.message }`);
    }

    if (rows.length != 0)
    {
        try
        {
            itemCount += parseInt(rows[0].Count);
            await changeQuantityItem(characterId, itemName, itemCount);
        } catch (error)
        {
            throw error;
        }
    }
    else
    {
        throw new errors.InvalidInputError('characterModel', 'removeItem', `Couldn't remove Item because there is no item that exists with that name.`);
    }
}


/**
 * Adds a known spell to the KnownSpell table
 * @param {Integer} characterId - Id of the charcater to add the Spell to
 * @param {Integer} spellId - The Id of the spell that will be added
 * @param {Integer} userId - The userId whose character will add a spell
 * @throws {InvalidInputError} If the User doesn't own the character, the spell doesn't exist
 * @throws {DatabaseError} If there is an error with the connection to the Database
 */
async function addKnownSpell(characterId, spellId, userId)
{
    const query = `SELECT Id FROM PlayerCharacter WHERE UserId = ${ userId } and Id = ${ characterId };`;
    try
    {
        let [rows, cols] = await connection.query(query);
        if (rows.length === 0)
            throw new errors.InvalidInputError('characterModel', 'addKnownSpell', 'User has no characters to add a spell to.');
        let [rowsS, colsS] = await connection.query(`SELECT 1 FROM Spell WHERE Id = ${ spellId };`);
        if (rowsS.length === 0)
            throw new errors.InvalidInputError('characterModel', 'addKnownSpell', 'Spell You\'re trying to add doesn\'t exists');
        logger.info(`Spell Id, userId and characterId authenticated. In addKnownSpell`);
    } catch (error)
    {
        if (error instanceof errors.InvalidInputError)
        {
            throw error;
        }
        else
        {
            throw new errors.DatabaseError('characterModel', 'addKnownSpell', 'Database Error, couldn\'t query the database to see if user has any characters to add a spell to');
        }

    }

    const addQ = `INSERT INTO KnownSpell (SpellId, CharacterId) VALUES (${ spellId }, ${ characterId });`;
    try
    {
        await connection.execute(addQ);
        logger.info(`Spell with Id ${ spellId } added to character with Id ${ characterId }'s known spells - addKnownSpell`);
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'addKnownSpell', 'Database Error, couldn\'t execute the Add KnownSpell query.');
    }
}


/**
 * Removes a known spell from the KnownSpell Table
* @param {Integer} characterId - Id of the charcater that will have a spell removed
 * @param {Integer} spellId - The Id of the spell that will be removed
 * @param {Integer} userId - The userId whose character will remove a spell
 * @throws {InvalidInputError} If the User doesn't own the character, the spell doesn't exist
 * @throws {DatabaseError} If there is an error with the connection to the Database
 */
async function removeKnownSpell(characterId, spellId, userId)
{
    const query = `SELECT Id FROM PlayerCharacter WHERE UserId = ${ userId } and Id = ${ characterId };`;
    try
    {
        let [rows, cols] = await connection.query(query);
        if (rows.length === 0)
            throw new errors.InvalidInputError('characterModel', 'removeKnownSpell', 'User does not own the character.');
        let [rowsS, colsS] = await connection.query(`SELECT 1 FROM Spell WHERE Id = ${ spellId };`);
        if (rowsS.length === 0)
            throw new errors.InvalidInputError('characterModel', 'removeKnownSpell', 'Spell You\'re trying to remove doesn\'t exists');
        logger.info(`Spell Id, userId and characterId authenticated. In removeKnownSpell`);
    } catch (error)
    {
        if (error instanceof errors.InvalidInputError)
        {
            throw error;
        }
        else
        {
            throw new errors.DatabaseError('characterModel', 'removeKnownSpell', 'Database Error, couldn\'t query the database to see if user has any characters to add a spell to');
        }

    }
    const deleteQ = `DELETE FROM KnownSpell WHERE SpellId = ${ spellId } AND CharacterId = ${ characterId };`;
    try
    {
        await connection.execute(deleteQ);
        logger.info(`Spell with Id ${ spellId } deleted from character with Id ${ characterId }'s known spells - removeKnownSpell`);
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'removeKnownSpell', 'Database Error, couldn\'t execute the Delete KnownSpell query.');
    }
}

/**
 * Gets all the Characters corresponding to a given User's Id.
 * @param {Integer} userId - The Id of the user whose characters will be retrieved
 * @returns an array of Character Ids that belong to the user.
 * @throws {InvalidInputError} - If the User does not exist OR the User has no Characters belonging to them.
 * @throws {DatabaseError} - If there is an error with the SELECT query while joining the PlayerCharacter and User Tables.
 */
async function getUserCharacters(userId)
{
    const query = `SELECT Id from ${ tableName } WHERE UserId = ${ userId };`;

    try
    {
        var [rows, colum_definitions] = await connection.query(query);
        logger.info(`Select Query Success in getUserCharacter with userId: ${ userId }`);
        if (rows.length === 0)
        {
            throw new errors.InvalidInputError();
        }
    } catch (error)
    {
        if (error instanceof errors.InvalidInputError)
        {
            throw new errors.InvalidInputError('characterModel', 'getUserCharacters', `User does not exists or has no characters`);
        }
        else
        {
            throw new errors.DatabaseError('characterModel', 'getUserCharacters', `Database connection or query error, couldn't get the Users Characters`);
        }
    }

    characters = [];
    for (row of rows)
    {
        characters.push(await getCharacter(row.Id, userId));
    }

    return characters;
}

/**
 * Deletes a character from the database with the given Id
 * @param {Integer} id 
 * @throws {InvalidInputError} If the character is not found 
 * @throws {DatabaseError} If there was an error on the database's side
 * @returns {boolean} true if deleted, throws otherwise
 */
async function removeCharacter(id)
{
    let query = `DELETE FROM ${ tableName } WHERE Id = ${ id };`;

    //Select The Id of the user who's character this belongs to in order to remove that character from them as well

    try
    {
        let checkingQ = `SELECT Id from ${ tableName } WHERE Id = ${ id };`;
        let [rows, column_definitions] = await connection.query(checkingQ);
        logger.info("Select query to check if Id exists has been executed");
        if (rows.length === 0)
        {
            throw new errors.InvalidInputError('characterModel', 'removeCharacter', `Character with Id: ${ id } does not exist in the Database.`);
        }

        let ownedItemsQ = `DELETE FROM OwnedItem where CharacterId = ${ id };`;
        await connection.execute(ownedItemsQ);

        let knownSpellsQ = `DELETE FROM KnownSpell where CharacterId = ${ id };`;
        await connection.execute(knownSpellsQ);

        let savingThrowQ = `DELETE FROM SavingThrowProficiency WHERE CharacterId = ${ id };`;
        await connection.execute(savingThrowQ);

        let expertise = `DELETE FROM SkillExpertise WHERE CharacterId = ${ id };`;
        await connection.execute(expertise);

        let abilityScoreQ = `DELETE FROM AbilityScore where CharacterId = ${ id };`;
        await connection.execute(abilityScoreQ);

        let skillProfQ = `DELETE FROM SkillProficiency WHERE CharacterId = ${ id };`;
        await connection.execute(skillProfQ);


        await connection.execute(query);
        logger.info(`Delete Query Executed Character with id: ${ id }. About to return true`);
        return true;
    }
    catch (error)
    {
        if (error instanceof errors.InvalidInputError)
        {
            throw error;
        }

        throw new errors.DatabaseError('characterModel', 'removeCharacter', `Database connection failed, couldn't delete Character with id ${ id }. ${ error.message }`);
    }
}

/**
 * Updates a character with the given Id in order to increment by 1 their level
 * @param {Integer} characterId - The Id of the Character that will have their Level Updated
 * @throws {InvalidInputError} - If the Character with the given Id does not exist
 * @throws {DatabaseError} - If there was an error with the Database Connection and the one of the queries didn't work
 */
async function levelUp(characterId)
{
    const query = `SELECT Level FROM ${ tableName } WHERE Id = ${ characterId };`;

    try
    {
        var [rows, colum_definitions] = await connection.query(query);
        logger.info('Select query executed inside of levelUp function');
        if (rows.length === 0) throw new errors.InvalidInputError();

        let currentLevel = parseInt(rows[0].Level);
        currentLevel += 1;

        const updateQuery = `UPDATE ${ tableName } SET Level = ${ currentLevel } WHERE Id = ${ characterId };`;

        await connection.execute(updateQuery);
        logger.info(`UPDATE query Success, character with id: ${ characterId }'s level is now ${ currentLevel }.`);

    } catch (error)
    {
        if (error instanceof errors.InvalidInputError)
        {
            throw new errors.InvalidInputError('characterModel', 'levelUp', `Character does not exist`);
        }
        else
        {
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
async function updateExp(characterId, experience)
{
    const query = `SELECT Experience FROM ${ tableName } WHERE Id = ${ characterId };`;

    try
    {
        var [rows, colum_definitions] = await connection.query(query);
        logger.info('Select query executed inside of updateExp function');
        if (rows.length === 0) throw new errors.InvalidInputError();


        const updateQuery = `UPDATE ${ tableName } SET Experience = ${ experience } WHERE Id = ${ characterId };`;

        await connection.execute(updateQuery);
        logger.info(`UPDATE query Success, character with id: ${ characterId }'s Experience is now ${ experience }.`);

    } catch (error)
    {
        if (error instanceof errors.InvalidInputError)
        {
            throw new errors.InvalidInputError('characterModel', 'updateExp', `Character does not exist`);
        }
        else
        {
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
async function updateAC(characterId, armorClass)
{
    const query = `SELECT ArmorClass FROM ${ tableName } WHERE Id = ${ characterId };`;

    try
    {
        var [rows, colum_definitions] = await connection.query(query);
        logger.info('Select query executed inside of updateAC function');
        if (rows.length === 0) throw new errors.InvalidInputError();



        const updateQuery = `UPDATE ${ tableName } SET ArmorClass = ${ armorClass } WHERE Id = ${ characterId };`;

        await connection.execute(updateQuery);
        logger.info(`UPDATE query Success, character with id: ${ characterId }'s ArmorClass is now ${ armorClass }.`);

    } catch (error)
    {
        if (error instanceof errors.InvalidInputError)
        {
            throw new errors.InvalidInputError('characterModel', 'updateAC', `Character does not exist`);
        }
        else
        {
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
async function updateSpeed(characterId, speed)
{
    const query = `SELECT Speed FROM ${ tableName } WHERE Id = ${ characterId };`;

    try
    {
        var [rows, colum_definitions] = await connection.query(query);
        logger.info('Select query executed inside of updateSpeed function');
        if (rows.length === 0) throw new errors.InvalidInputError();

        const updateQuery = `UPDATE ${ tableName } SET Speed = ${ speed } WHERE Id = ${ characterId };`;

        await connection.execute(updateQuery);
        logger.info(`UPDATE query Success, character with id: ${ characterId }'s Speed is now ${ speed }.`);

    } catch (error)
    {
        if (error instanceof errors.InvalidInputError)
        {
            throw new errors.InvalidInputError('characterModel', 'updateSpeed', `Character does not exist`);
        }
        else
        {
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
async function updateInitiative(characterId, initiative)
{
    const query = `SELECT Initiative FROM ${ tableName } WHERE Id = ${ characterId };`;

    try
    {
        var [rows, colum_definitions] = await connection.query(query);
        logger.info('Select query executed inside of updateSpeed function');
        if (rows.length === 0) throw new errors.InvalidInputError();



        const updateQuery = `UPDATE ${ tableName } SET Initiative = ${ initiative } WHERE Id = ${ characterId };`;

        await connection.execute(updateQuery);
        logger.info(`UPDATE query Success, character with id: ${ characterId }'s Initiative is now ${ initiative }.`);

    } catch (error)
    {
        if (error instanceof errors.InvalidInputError)
        {
            throw new errors.InvalidInputError('characterModel', 'updateInitiative', `Character does not exist`);
        }
        else
        {
            throw new errors.DatabaseError('characterModel', 'updateInitiative', `Database connection or query error, couldn't update Initiative of the Character`);
        }
    }
}


/**
 * Generates a new Object based off of the current object and the current Id of the character being visited
 * Adds the new one to the top
 * If not new then moves it to the top (max 3 Objects)
 * If there is no previous cookie then create a new object with the visited character
 * @param {Integer} characterIdVisited - Current Character being visited (Id)
 * @param {Array} previousRecents - Previous array of integers of characterIds
 * @returns {Object} An Object containing { name: "String", recentCharacters: [5,2,3], expires: Date }
 */
async function createRecentCharactersCookie(characterIdVisited, previousRecents)
{
    const MAX_LENGTH = 3;
    if (previousRecents)
    {
        if (!Array.isArray(previousRecents))
            throw new errors.InvalidInputError('characterModel', 'createRecentCharactersCookie', 'previousRecents must be an array of integers');
        //take data from old one and see
        let oldRecents = {};
        oldRecents.recentCharacters = previousRecents;
        oldRecents.name = "recentCharacters";
        oldRecents.expires = new Date(Date.now() + 900000);

        // { id: parseInt(characterIdVisited) }
        let index = oldRecents.recentCharacters.findIndex(object =>
        {
            return object.id === parseInt(characterIdVisited);
        });

        //if already at index 0 then just return, nothing changes
        if (index === 0) return oldRecents;
        //if > 0 have to take it from wherever it is and put it at [0]
        else if (index > 0)
        {
            let newArray = [];
            newArray.push({ id: oldRecents.recentCharacters[index].id, name: oldRecents.recentCharacters[index].name });
            for (let i = 0; i < oldRecents.recentCharacters.length; i++)
            {
                if (i === index) continue;

                if (newArray.length === MAX_LENGTH) break;

                newArray.push({ id: oldRecents.recentCharacters[i].id, name: oldRecents.recentCharacters[i].name });
            }
            oldRecents.recentCharacters = newArray;

            return oldRecents;
        }
        //it's not in the array so just add to [0] and make sure length is 3
        else
        {
            if (oldRecents.recentCharacters.length === MAX_LENGTH)
            {
                oldRecents.recentCharacters.pop();
                try
                {
                    oldRecents.recentCharacters.splice(0, 0, { id: characterIdVisited, name: await getNameInternal(characterIdVisited) });
                    return oldRecents;
                } catch (error)
                {
                    throw error;
                }
            }

            try
            {
                oldRecents.recentCharacters.splice(0, 0, { id: characterIdVisited, name: await getNameInternal(characterIdVisited) });
            } catch (error)
            {
                throw error;
            }

            return oldRecents;
        }
    }
    else
    {
        let obj = {};
        try
        {
            obj.name = "recentCharacters"; obj.recentCharacters = [{ id: characterIdVisited, name: await getNameInternal(characterIdVisited) }]; obj.expires = new Date(Date.now() + 900000);
        } catch (error)
        {
            throw error;
        }
        return obj;
    }
}

/**
 * Internal helper method used to get name of a Character based off of ID
 * @param {Integer} id 
 * @returns {String} - Name of the Character
 * @throws {InvalidInputError} if the Id provided is invalid
 * @throws {DatabaseError} if the connection experiences an error
 */
async function getNameInternal(id)
{
    const q = `SELECT Name from PlayerCharacter WHERE Id = ${ id }`;
    try
    {
        let [rows, cols] = await connection.query(q);
        return rows[0].Name;
    } catch (error)
    {
        if (error instanceof errors.InvalidInputError)
        {
            throw new errors.InvalidInputError('characterModel', 'getNameInternal', `Character does not exist`);
        }
        else
        {
            throw new errors.DatabaseError('characterModel', 'getNameInternal', `Database connection or query error, couldn't get name of the Character`);
        }
    }
}


/* #endregion */

/**
 * Gets the connection to this database
 * @returns the connection to the database
 */
function getConnection()
{
    return connection;
}

/* #region  Create Table Methods */
/**
 * Creates the Ethics table with an SQL Query
 * Inserts the 3 ethics to the table if they are not already there
 * @throws {DatabaseError} if there was a problem with executing the SQL Queries
 */
async function createEthicsTable()
{
    const sqlQuery = "CREATE TABLE IF NOT EXISTS Ethics(Id INT, Name TEXT, PRIMARY KEY(Id));";
    try
    {
        await connection.execute(sqlQuery);
        logger.info(`Table: Ethics Created/Exists - createEthicsTable()`);
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'createEthicsTable', `Couldn't connect to the database: ${ error.message }.`);
    }

    const checkIfEthics = `SELECT Id from Ethics;`;
    const ethics = ['lawful', 'chaotic', 'neutral'];
    try
    {
        let [rows, columns] = await connection.query(checkIfEthics);
        if (!rows.length > 0)
        {
            logger.info(`Ethics not there, will add them to the Ethics Table.`);
            for (let i = 0; i < 3; i++)
            {
                const ethicsQ = `INSERT INTO Ethics(Id, Name) VALUES (${ i + 1 }, '${ ethics[i] }');`;
                await connection.execute(ethicsQ);
                logger.info(`Added ${ ethics[i] } to the Ethics Table with Id: ${ i + 1 }`);
            }
            return;
        }
        logger.info(`Ethics already there, will not add them.`);
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'createEthicsTable', `Database connection or query error, Couldn't Add or query from the Ethics table: ${ error.message }`);
    }


}

/**
 * Creates the Morality table with an SQL Query
 * Adds the 3 moralities to the table if there are none in the Table (if they were added before)
 * @throws {DatabaseError} if there was a problem with executing the SQL Query
 */
async function createMoralityTable()
{
    const sql = `CREATE TABLE IF NOT EXISTS Morality(Id INT, Name TEXT, PRIMARY KEY(Id));`;

    try
    {

        await connection.execute(sql);
        logger.info(`Table: Morality Created/Exists - createMoralityTable()`);

    } catch (error)
    {

        throw new errors.DatabaseError('characterModel', 'createMoralityTable', `Couldn't connect to the database: ${ error.message }.`);

    }
    const checkIfMoralities = `SELECT Id from Morality;`;
    const moralities = ['good', 'evil', 'neutral'];
    try
    {
        let [rows, columns] = await connection.query(checkIfMoralities);
        if (!rows.length > 0)
        {
            logger.info(`Moralities not there, will add them to the Morality Table.`);
            for (let i = 0; i < 3; i++)
            {
                const moralityQ = `INSERT INTO Morality(Id, Name) VALUES (${ i + 1 }, '${ moralities[i] }');`;
                await connection.execute(moralityQ);
                logger.info(`Added ${ moralities[i] } to the Morality Table with Id: ${ i + 1 }`);
            }
            return;
        }
        logger.info(`Moralities already there, will not add them.`);
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'createMoralityTable', `Database connection or query error, Couldn't Add or query from the Morality table: ${ error.message }`);
    }
}
/**
 * Creates the PlayerCharacter table with an SQL Query
 * @throws {DatabaseError} if there was a problem with executing the SQL Query
 */
async function createPlayerCharacterTable()
{
    const sqlQueryC = `CREATE TABLE IF NOT EXISTS PlayerCharacter(Id INT, UserId INT, ClassId INT, RaceId INT, EthicsId INT, 
        MoralityId INT, BackgroundId INT, Name TEXT, ProficiencyBonus INT, MaxHp INT, CurrentHp INT, Level INT, ArmorClass INT, Speed INT, Initiative INT, 
        Experience INT, PRIMARY KEY(Id), FOREIGN KEY (UserId) REFERENCES User(Id), FOREIGN KEY (ClassId) REFERENCES Class(Id), 
        FOREIGN KEY (RaceId) REFERENCES Race(Id), FOREIGN KEY (EthicsId) REFERENCES Ethics(Id), FOREIGN KEY (MoralityId) 
        REFERENCES Morality(Id), FOREIGN KEY (BackgroundId) REFERENCES Background(Id));`;

    try
    {
        await connection.execute(sqlQueryC);
        logger.info(`Table: ${ tableName } Created/Exists - createPlayerCharacterTable()`);
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'createPlayerCharacterTable', `Couldn't connect to the database: ${ error.message }.`);
    }
}
/**
 * Creates the KnownSpell table with an SQL Query
 * @throws {DatabaseError} if there was a problem with executing the SQL Query
 */
async function createKnownSpellTable()
{
    const sql = `CREATE TABLE IF NOT EXISTS KnownSpell(SpellId INT, CharacterId INT, FOREIGN KEY (SpellId) 
    REFERENCES Spell(Id), FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), PRIMARY KEY (SpellId, CharacterId));`;

    try
    {
        await connection.execute(sql);
        logger.info(`Table: KnownSpell Created/Exists - createKnownSpellTable()`);
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'createKnownSpellTable', `Couldn't connect to the database: ${ error.message }.`);
    }
}

/**
 * Creates the OwnedItem table with an SQL Query
 * @throws {DatabaseError} if there was a problem with executing the SQL Query
 */
async function createOwnedItemTable()
{
    const sql = `CREATE TABLE IF NOT EXISTS OwnedItem(CharacterId INT, Name VARCHAR(200), Count INT, 
    FOREIGN KEY (CharacterId) REFERENCES PlayerCharacter(Id), PRIMARY KEY (CharacterId, Name));`;

    try
    {
        await connection.execute(sql);
        logger.info(`Table: KnownSpell Created/Exists - createOwnedItemTable()`);
    } catch (error)
    {
        throw new errors.DatabaseError('characterModel', 'createOwnedItemTable', `Couldn't connect to the database: ${ error.message }.`);
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
    addCharacterObject,
    addItem,
    removeItem,
    createRecentCharactersCookie,
    addKnownSpell,
    removeKnownSpell,
    updateCharacterObject
};