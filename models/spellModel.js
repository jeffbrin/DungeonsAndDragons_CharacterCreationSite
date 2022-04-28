const mysql = require('mysql2/promise')
const validationModel = require('./validateSpellUtils')
const logger = require('../logger');

let connection;
const validSchools = [
    'Conjuration',
    'Necromancy',
    'Evocation',
    'Abjuration',
    'Transmutation',
    'Divination',
    'Enchantment',
    'Illusion'
]

/**
 * Initializes the passed database with the Spell and SpellSchool tables.
 * @param {String} databaseName the name of the database to write to.
 * @param {Boolean} reset indicates whether the new table should be reset.
 */
async function initialize(databaseName, reset) {

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
        throw new InvalidDatabaseConnectionError(`Failed to connect to the dnd database in the docker container. Make sure the docker container is running: ${error.message}`);
    }

    // Create the Spell table
    // Reset if selected
    if (reset) {
        const resetQuery = `DROP TABLE IF EXISTS Spell`;

        // Try catch with await to make sure this is run before the next query is run
        try {
            await connection.execute(resetQuery)
            logger.info(`Table Spell reset`);
        }
        catch (error) {
            throw new DatabaseIOError(`Failed to reset table Spell in the database... check your connection to the database: ${error.message}`)
        }

    }

    // Create the SpellSchool's table
    // Reset if selected
    if (reset) {
        const resetQuery = `DROP TABLE IF EXISTS SpellSchool`;

        // Try catch with await to make sure this is run before the next query is run
        try {
            await connection.execute(resetQuery)
            logger.info(`Table SpellSchool reset`);
        }
        catch (error) {
            throw new DatabaseIOError(`Failed to reset table SpellSchool in the database... check your connection to the database: ${error.message}`)
        }

    }

    // Create and populate the SpellSchool table even if the db isn't reset
    // But catch in case it isn't the first time the db is made
    let sqlQuery = `CREATE TABLE IF NOT EXISTS SpellSchool (id int, name VARCHAR(50), PRIMARY KEY(id));`;
    try {
        await connection.execute(sqlQuery).then(logger.info(`Table SpellSchool created/exists`))
    }
    catch (error) {
        throw new DatabaseIOError(`Failed to create table (SpellSchool)... check your connection to the database: ${error.message}`)
    }

    let schoolAddFailed = false;
    for (let i = 0; i < validSchools.length; i++) {
        try {
            await connection.execute(`INSERT INTO SpellSchool values (${i + 1}, '${validSchools[i].toLowerCase()}');`);
        }
        catch (error) {
            schoolAddFailed = true;
        }
    }

    // Log if one of the schools failed to be added.
    if (schoolAddFailed)
        logger.info('Failed to add at least one spell school to the database. This is likely because the database already contains the schools being added. Make sure the database is reset when a new school is added to the array of schools.');


    // Create / Recreate
    sqlQuery = `CREATE TABLE IF NOT EXISTS Spell (id int, level TINYINT, name VARCHAR(50), schoolId int, description TEXT, PRIMARY KEY(id), FOREIGN KEY (schoolId) REFERENCES SpellSchool(id))`;
    try {
        await connection.execute(sqlQuery).then(logger.info(`Table Spell created/exists`))
    }
    catch (error) {
        throw new DatabaseIOError(`Failed to create table (Spell)... check your connection to the database: ${error.message}`)
    }


}

/**
 * Closes the connection to the database.
 */
async function closeConnection() {
    if(connection)
        connection.end();
}


/**
 * Validates a spell and adds it to the database.
 * If another spell with the same level, name and schoolId is already present, the table will remain unchanged
 * @param {Object} spell The spell to add to the database.
 * @returns The spell added to the database. If a similar spell is in the db already, that one is returned.
 */
async function addSpell(spell) {
    return addSpellFromValues(spell.level, spell.name, spell.schoolId, spell.description);
}

/**
 * Validates the spell's information and adds it to the database table.
 * If a spell with the same level, name and schoolId is already present in the table, the table will remain unchanged.
 * @param {Number} level The level of the spell, must be an integer from 0 - 9
 * @param {String} name The name of the spell must not contain any numbers.
 * @param {String} schoolId The id of the school the spell belongs to, must not contain any numbers.
 * @param {String} description The description of the spell.
 * @returns True if the spell was added, false if a spell with the same details already exists.
 * @throws If the input is invalid or the spell could not be added to the database.
 */
async function addSpellFromValues(level, name, schoolId, description) {

    // Validate the spell, this will throw if the spell is invalid
    let allSchools;
    try {
        allSchools = await getAllSchoolIds();
    }
    catch (error) {
        throw new DatabaseIOError(`Failed to get all spell schools: ${error}`);
    }

    try {
        await validationModel.validateSpell(level, name, schoolId, description, allSchools)
    } catch (err) {
        if (err instanceof Error)
            throw new InvalidInputError(err.message)

        throw err
    };

    // change names to lowercase
    name = name.toLowerCase()

    // Check if the spell already exists
    const findDuplicateQuery = `SELECT level, name, schoolId, description FROM Spell WHERE level=${level} AND name='${name.replace(/'/g, "''")}' AND schoolId=${schoolId}`;
    let matchedSpellRows;
    let columnDefinitions;
    try {
        [matchedSpellRows, columnDefinitions] = await connection.query(findDuplicateQuery)
    } catch (err) {
        throw new DatabaseIOError(`Failed to select from table (Spell): ${err.message}`);
    }

    // If this spell isn't already present in the table, add it
    if (matchedSpellRows.length == 0) {

        // Find next highest id
        [highestIndexRow, columnDefinitions] = await connection.query('SELECT id from Spell order by id desc limit 1');

        // Imitate auto increment
        let newId = 1;
        if (highestIndexRow.length > 0)
            newId = highestIndexRow[0].id + 1;

        // replacing single quotes with 2 single quotes to escape them in sql.
        // /'/g indicates that all the single quotes should be replaced (g as in "global")
        let schoolName;
        const insertQuery = `INSERT INTO Spell (id, level, name, schoolId, description) VALUES (${newId}, ${level}, '${name.replace(/'/g, "''")}', ${schoolId}, '${description.replace(/'/g, "''")}')`;
        try {
            await connection.execute(insertQuery)
            schoolName = await connection.execute(`SELECT name from SpellSchool where id = ${schoolId}`)
        } catch (err) {
            throw new DatabaseIOError(`Failed to write to table (Spell): ${err.message}`);
        }

        // Return the spell added
        logger.info(`Successfully added spell (${name}).`)
        return true;
    }

    // Return whether the spell was successfully added in the table
    // If the added spell's description is different than the one passed, it means 
    // there was another one that would have been overriden
    delete matchedSpellRows.id
    addedSpell = matchedSpellRows[0];
    return addedSpell.description == description;

}

/**
 * Deletes all spells which have the same name as the argument passed.
 * If an invalid spell name is passed, the function returns false since
 * no spell with that name could be deleted.
 * @param {String} name The name of the spell to delete.
 * @returns The number of spells deleted.
 */
async function removeSpellsWithMatchingName(name) {

    // Return right away if the spell name is invalid
    try {
        await validationModel.validateSpellName(name)
    }
    catch (err) {
        if (err instanceof Error)
            throw new InvalidInputError(err);
        throw err
    }

    const deleteQuery = `DELETE FROM Spell WHERE name = '${name.replace(/'/g, "''").toLowerCase()}'`;
    let executionRowsData;
    try {
        [executionRowsData] = await connection.execute(deleteQuery)
    } catch (err) {
        throw new DatabaseIOError(`Failed to delete from table Spell: ${err.message}`)
    }

    return executionRowsData.affectedRows;
}

/**
 * Deletes all spells which have the same id as the argument passed.
 * If an invalid spell id is passed, the function returns false since
 * no spell with that id could be deleted.
 * @param {Number} id A positive integer indicating the id of the spell to delete.
 * @returns Whether a spell with the passed id was deleted.
 * @throws If an invalid id was provided or there was a database issue.
 */
async function removeSpellById(id) {

    // Return right away if the spell id is invalid
    try {
        await validationModel.validateSqlTableId(id)
    }
    catch (error) {
        throw new InvalidInputError(`Failed to remove spell with id (${id}): ${error}`)
    }

    const deleteQuery = `DELETE FROM Spell WHERE id = ${id}`;
    let executionRowsData;
    try {
        [executionRowsData] = await connection.execute(deleteQuery)
    } catch (err) {
        throw new DatabaseIOError(`Failed to delete from table Spell: ${err.message}`)
    }

    return executionRowsData.affectedRows > 0;
}

/**
 * Gets the contents of a the spell table in the database.
 * @returns An array containing the rows of a table in the database.
 */
async function getAllSpells() {

    let rows;
    let columnDefinitions;

    try {
        [rows, columnDefinitions] = await connection.query(`select S.id, S.level, S.name, S.description, SS.name as "school" from Spell S, SpellSchool SS WHERE S.schoolId = SS.id;`)
    } catch (error) {
        throw new DatabaseIOError(`Failed to read from table Spell ... Try resetting the database : ${error.message}`)
    }

    return rows;

}

/**
 * Gets the spells who match the criteria passed in the function
 * Leaving a parameter null indicates that any value is acceptable for that field.
 * At least one value must be provided (all 3 arguments can not be null at the same time).
 * @param {Number} level The level all the spells should be
 * @param {String} name The name all the spells should have
 * @param {String} schoolId The school id all the spells should be in
 * @returns An array containing the spells which match the specifications passed.
 */
async function getSpellsWithSpecifications(level, name, schoolId) {

    // Later code checks if the name is null, the same
    // logic should be applied for an empty name
    if (name == "")
        name = null;

    // Get all the school ids for validation
    let allSchools;
    try {
        allSchools = await getAllSchoolIds();
    }
    catch (error) {
        throw new DatabaseIOError(`Failed to get all spell schools from the database: ${error}`);
    }

    // Validate the spell inputs
    try {
        if (level != null)
            await validationModel.validateSpellLevel(level)
        if (name != null)
            await validationModel.validateSpellName(name)
        if (schoolId != null)
            await validationModel.validateSpellSchool(schoolId, allSchools)
    } catch (error) {
        if (error instanceof Error)
            throw new InvalidInputError(error.message)
        throw error
    }


    // Update
    let tempSelectQuery = `SELECT S.id, level, S.name, SS.name as 'school', description FROM Spell S, SpellSchool SS WHERE S.schoolId = SS.id AND`;

    // Add each column where applicable
    if (level != null)
        tempSelectQuery += ` level = ${level} AND`;
    if (name != null){
        // Treat % and _ as literals if the name contains those characters - for the "like" clause
        name = name.replace('%', '[%]');
        name = name.replace('_', '[_]');
        tempSelectQuery += ` S.name like '%${name.replace(/'/g, "''").toLowerCase()}%' AND`;
    }
    if (schoolId != null)
        tempSelectQuery += ` schoolId = ${schoolId} AND`

    // Remove the last comma
    let selectQuery = tempSelectQuery.slice(0, -3);
    let rows;
    let columnDefinitions;
    try {
        [rows, columnDefinitions] = await connection.query(selectQuery)
    } catch (error) {
        throw new DatabaseIOError(`Failed to read from table Spell: ${error.message}`)
    };

    return rows;

}

/**
 * Gets a spell that matches the id.
 * @param {Number} id The id of the spell to get.
 * @returns A spell that matches the id, null if no spell contains the id.
 */
async function getSpellById(id) {

    // Validate the id
    try {
        await validationModel.validateSqlTableId(id)
    } catch (error) {
        throw new InvalidInputError(error.message)
    };

    // Get all spells with specified id
    let rows;
    let columnDefinitions;
    try {
        [rows, columnDefinitions] = await connection.execute(`SELECT S.id, level, S.name, SS.name as 'school', description FROM Spell S, SpellSchool SS where S.id = ${id} and S.schoolId = SS.id`)
    } catch (error) {
        throw new DatabaseIOError(`Failed to get spell from database: ${error.message}`)
    };


    // return null if nothing was found
    return rows.length == 0 ? null : rows[0];

}

/**
 * Changes the spell whose id matches to now have the values passed in as arguments.
 * If a field should remain unchanged, pass null in the parameter that should remain unchanged.
 * If the changed spell would be a duplicate, the spell is deleted instead.
 * @param {Number} id The id of the spell to update.
 * @param {String} newLevel The new level to set the spell's level to.
 * @param {String} newName The new name to set the spell's name to.
 * @param {String} newSchoolId The spell's new schoolId id.
 * @param {String} newDescription the spell's new description.
 * @returns Whether a spell was successfully updated.
 * @throws If an invalid value is passed in newName, newSchoolId or newDescription and isn't equal to null, or an invalid id is passed. Or if all passed values are null.
 */
async function updateSpellById(id, newLevel, newName, newSchoolId, newDescription) {

    if (newLevel == null && newName == null && newSchoolId == null && newDescription == null) {
        throw new InvalidInputError('At least one field should be changed (not null).')
    }

    if (id <= 0)
        throw new InvalidInputError("Id can not be a negative value.")
    if (id % 1 != 0)
        throw new InvalidInputError("Id must be an integer.")

    // Get all the schools for validation
    let allSchools;
    try {
        allSchools = await getAllSchoolIds();
    }
    catch (error) {
        throw new DatabaseIOError(`Failed to get all spell schools from the database: ${error}`);
    }

    // Validate the spell inputs
    try {
        if (newLevel != null)
            await validationModel.validateSpellLevel(newLevel)

        if (newName != null)
            await validationModel.validateSpellName(newName)

        if (newSchoolId != null)
            await validationModel.validateSpellSchool(newSchoolId, allSchools)

        if (newDescription != null)
            await validationModel.validateSpellDescription(newDescription)
    }
    catch (error) {
        if (error instanceof Error)
            throw new InvalidInputError(error.message)
        throw error;
    }

    // For just newDescription, don't check for all the duplicates
    if (!(newLevel == null && newName == null && newSchoolId == null && newDescription != null)) {
        
        try{
            // Make sure the spell is in the database before deleting potential duplicates
            let rows, columnDefinitions;
            [rows, columnDefinitions] = await connection.query(`SELECT * FROM Spell where id = ${id}`);
            if (rows.length == 0)
                return false;
        }
        catch(error){
            throw new DatabaseIOError(`Failed to query the database to find the spell to be updated: ${error}`);
        }

        let rows;
        try{
            // Get all rows that will be a duplicate if they change
            [rows, columnDefinitions] = await connection.query(`SELECT * FROM Spell S WHERE id != ${id} 
            AND name = ${newName == null ? `(select name from Spell where id = ${id})` : `'${newName.replace(/'/g, "''").toLowerCase()}'`} 
            AND level = ${newLevel == null ? `(select level from Spell where id = ${id})` : `${newLevel}`} 
            AND schoolId = ${newSchoolId == null ? `(select schoolId from Spell where id = ${id})` : `${newSchoolId}`}`
            );
        }
        catch(error){
            throw new DatabaseIOError(`Failed to select duplicate spells from the database before updating the spell information: ${error}`);
        }

        // Delete the spells that would be a duplicate
        try {
            rows.forEach(async (spell) => {
                await connection.execute(`DELETE FROM Spell WHERE id = ${spell.id}`);
            })
        }
        catch (error) {
            throw new DatabaseIOError(`Failed to delete from spell table: ${error.message}`);
        }
    }

    // Update
    let tempUpdateQuery = 'UPDATE Spell SET ';

    // Add each column where applicable
    if (newLevel != null)
        tempUpdateQuery += ` level = ${newLevel},`;
    if (newName != null)
        tempUpdateQuery += ` name = '${newName.replace(/'/g, "''").toLowerCase()}',`;
    if (newSchoolId != null)
        tempUpdateQuery += ` schoolId = ${newSchoolId},`
    if (newDescription != null)
        tempUpdateQuery += ` description = '${newDescription.replace(/'/g, "''")}',`

    // Remove the last comma
    let updateQuery = tempUpdateQuery.slice(0, -1);


    // Add where clause
    updateQuery += ` WHERE id = ${id}`;
    let executionData;
    try {
        [executionData] = await connection.execute(updateQuery)
    } catch (error) {
        throw new DatabaseIOError(`Failed to update Spell table: ${error.message}`)
    }

    return executionData.affectedRows > 0;
}

/**
 * Changes every spell whose name matches oldName to now have the name in newName.
 * If one of the spells to be changed will become a duplicate, it will be deleted instead.
 * @param {String} oldName The name of the spells to update.
 * @param {String} newName The new name to set all the spells' names to.
 * @returns The number of spells whose names were changed.
 */
async function updateSpellNames(oldName, newName) {

    // Validate the spell name
    try {
        await validationModel.validateSpellName(oldName);
        await validationModel.validateSpellName(newName);
    }
    catch (error) {
        if (error instanceof Error)
            throw new InvalidInputError(error.message);
        throw error;
    }

    // Get all rows that will be a duplicate if they change
    let rows;
    let columnDefinitions;
    try {
        [rows, columnDefinitions] = await connection.query(`SELECT * FROM Spell S WHERE name = '${oldName.toLowerCase().replace(/'/g, "''")}' AND EXISTS (SELECT 1 FROM Spell WHERE name = '${newName.toLowerCase().replace(/'/g, "''")}' AND level = S.level AND schoolId = S.schoolId)`);
    }
    catch (error) {
        throw new DatabaseIOError(`Failed to select from Spell table: ${error}`)
    }
    // Delete the spells that would be a duplicate
    try {
        rows.forEach(async (spell) => {
            await connection.execute(`DELETE FROM Spell WHERE id = ${spell.id}`);
        })
    }
    catch (error) {
        throw new DatabaseIOError(`Failed to delete from spell table: ${error.message}`);
    }

    // Update the names
    let executionData;
    try {
        [executionData] = await connection.execute(`UPDATE Spell SET name = '${newName.toLowerCase().replace(/'/g, "''")}' WHERE name = '${oldName.toLowerCase().replace(/'/g, "''")}'`)
    } catch (error) {
        throw new DatabaseIOError(`Failed to update the Spell table: ${error.message}`)
    };

    return executionData.affectedRows;

}

/**
 * Returns a list of all the spell schools stored in the database with the first letter of their name capitalized.
 */
async function getAllSchools() {
    try {
        [schoolObjects, columnDefinitions] = await connection.query('SELECT id, name FROM SpellSchool')

        for (let i = 0; i < schoolObjects.length; i++){

            schoolObjects[i].name = schoolObjects[i].name[0].toUpperCase() + schoolObjects[i].name.substring(1, schoolObjects[i].name.length);
        }

        return schoolObjects;
    } catch (error) {
        throw new DatabaseIOError(`Failed to get ids from the SpellSchool table: ${error.message}`)
    };
}

/**
 * Gets a list of all the school ids in the database.
 * @returns A list of all school ids in the database.
 */
async function getAllSchoolIds() {
    return (await getAllSchools()).map(object => object.id);
}

class InvalidInputError extends Error { };
class InvalidDatabaseConnectionError extends Error { };
class DatabaseIOError extends Error { };

module.exports = {
    initialize,
    closeConnection,
    addSpell,
    addSpellFromValues,
    removeSpellsWithMatchingName,
    removeSpellById,
    getAllSpells,
    getSpellById,
    getSpellsWithSpecifications,
    updateSpellById,
    updateSpellNames,
    getAllSchools,
    InvalidInputError,
    InvalidDatabaseConnectionError,
    DatabaseIOError
}
