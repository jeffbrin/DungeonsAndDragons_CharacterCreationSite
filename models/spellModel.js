const mysql = require('mysql2/promise')
const validationModel = require('./validateSpellUtils')
const logger = require('../logger');
const fs = require('fs/promises');
const {DatabaseError, InvalidInputError} = require('./errorModel');

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
        throw new DatabaseError(`Failed to connect to the dnd database in the docker container. Make sure the docker container is running: ${error.message}`);
    }

    // Create the SpellSchool's table
    // Reset if selected
    if (reset) {
        // Drop reliant tables
        await dropReliantTables();
    }

    // Create and populate the SpellSchool table even if the db isn't reset
    // But catch in case it isn't the first time the db is made
    let sqlQuery = `CREATE TABLE IF NOT EXISTS SpellSchool (Id INT, Name TEXT, PRIMARY KEY(Id));`;
    try {
        await connection.execute(sqlQuery).then(logger.info(`Table SpellSchool created/exists`))
    }
    catch (error) {
        throw new DatabaseError(`Failed to create table (SpellSchool)... check your connection to the database: ${error.message}`)
    }

    let spellSchoolTableHasData = false;
    try {
        [rows, columnData] = await connection.query('SELECT * from SpellSchool;');
        spellSchoolTableHasData = rows.length > 0
    }
    catch (error) {
        throw new DatabaseError('raceModel', 'populateRaceAndRacialTraitTables', `Failed to read from the Race table: ${error}`);
    }

    if(!spellSchoolTableHasData){
        for (let i = 0; i < validSchools.length; i++) {
            try {
                await connection.execute(`INSERT INTO SpellSchool values (${i + 1}, '${validSchools[i].toLowerCase()}');`);
            }
            catch (error) {
                throw new DatabaseError('spellModel', 'initialize', `Failed to insert spell schools into the SpellSchool table: ${error}`)
            }
        }
    }

    // Create / Recreate
    sqlQuery = `CREATE TABLE IF NOT EXISTS Spell(Id INT, SchoolId INT, UserId INT, 
        Level INT, Description TEXT, Name TEXT, CastingTime TEXT, 
        EffectRange TEXT, Verbal BOOLEAN, Somatic BOOLEAN, 
        Material BOOLEAN, Materials TEXT NULL, Duration TEXT, Damage TEXT NULL, 
        Concentration BOOLEAN, Ritual BOOLEAN,PRIMARY KEY(Id), FOREIGN KEY (SchoolId) 
        REFERENCES SpellSchool(Id), FOREIGN KEY (UserId) REFERENCES User(Id));`;
    try {
        await connection.execute(sqlQuery).then(logger.info(`Table Spell created/exists`))
    }
    catch (error) {
        throw new DatabaseError(`Failed to create table (Spell)... check your connection to the database: ${error.message}`)
    }
    let spellTableHasData = false;
    try {
        [rows, columnData] = await connection.query('SELECT * from Spell;');
        spellTableHasData = rows.length > 0
    }
    catch (error) {
        throw new DatabaseError('raceModel', 'populateRaceAndRacialTraitTables', `Failed to read from the Race table: ${error}`);
    }

    // Alter character set of table to avoid issue when adding spells
    try{
        await connection.execute('ALTER TABLE Spell CONVERT TO CHARACTER SET utf8;')
    }
    catch(error){
        throw new DatabaseError('spellModel', 'initialize', `Failed to alter character set of Spell table to utf8: ${error}`);
    }

    // Create the ClassPermittedSpell table
    try{
        await connection.execute('CREATE TABLE IF NOT EXISTS ClassPermittedSpell (ClassId INT, SpellId INT, FOREIGN KEY (ClassId) REFERENCES Class(Id), FOREIGN KEY (SpellId) REFERENCES Spell(Id), PRIMARY KEY (ClassId, SpellId));')
    }
    catch(error){
        throw new DatabaseError('spellModel', 'initialize', `Failed to create the ClassPermittedSpell table: ${error}`)
    }

    // Populate the table with Player's Handbook spells
    if(!spellTableHasData){
        await populateSpellTable();
    }


}

/**
 * Drops all the tables that would cause a foreign key constraint if the User table was dropped.
 */
 async function dropReliantTables(){
    try{
        await connection.execute('DROP TABLE IF EXISTS AbilityScore;')
        await connection.execute('DROP TABLE IF EXISTS SkillProficiency;')
        await connection.execute('DROP TABLE IF EXISTS SkillExpertise;')
        await connection.execute('DROP TABLE IF EXISTS SavingThrowProficiency;')
        await connection.execute('DROP TABLE IF EXISTS SavingThrowBonus;')
        await connection.execute('DROP TABLE IF EXISTS KnownSpell;')
        await connection.execute('DROP TABLE IF EXISTS OwnedItem;')
        await connection.execute('DROP TABLE IF EXISTS Spell;')
        await connection.execute('DROP TABLE IF EXISTS SpellSchool;')
    }
    catch(error){
        throw new DatabaseError('userModel', 'dropReliantTables', `Failed to drop the tables which are reliant on the User table: ${error}`)
    }
}

/**
 * Adds all the player's handbook spells to the database.
 */
async function populateSpellTable(){
    const spellsJson = JSON.parse(await fs.readFile('database-content-json/spells.json'));
    
    for (spell of spellsJson){
        console.log(spell);
        // Insert the spell
        const castingTime = spell.casting_time;
        const verbal = spell.components.includes('V');
        const somatic = spell.components.includes('S');
        const material = spell.components.includes('M');
        const concentration = spell.concentration == 'yes';
        const description = spell.desc;
        const duration = spell.duration;
        const level = spell.level;
        const materials = spell.material;
        const name = spell.name;
        const range = spell.range;
        const ritual = spell.ritual == 'yes';
        const schoolName = spell.school;
        let schoolId;

        // Get the school id
        try{
            [schoolId, columns] = await connection.query(`SELECT Id FROM SpellSchool WHERE Name = '${schoolName.toLowerCase().replace(/'/g, "''")}'`);
            schoolId = schoolId[0].Id;
        }
        catch(error){
            throw new DatabaseError('spellModel', 'populateSpellTable', `Failed to query the database to find the spell school id: ${error}`);
        }

        // Get the damage from the description
        let damage = description.match(/[0-9]+d[0-9]/);
        if (damage != null)
            damage = damage[0];

        // Get the class ids of the classes that can cast this
        const classIds = [];
        for(className of spell.class.split(',')){
            const id = await getClassIdFromName(className.trim());
            if (id != null)
                classIds.push(id);
        }

        await addSpellFromValues(level, schoolId, 0, description, name, castingTime, verbal, somatic, material, materials, duration, damage, range, concentration, ritual, classIds)
    }
}

/**
 * Gets a class id from a class name passed.
 * @param {String} name The name of a class. 
 * @returns The id associated with the class, null if the class does not exist
 */
async function getClassIdFromName(name){
    
    let classId;
    try{
        [classId, column] = await connection.query(`SELECT Id FROM Class WHERE Name = '${name}'`);
    }
    catch(error){
        throw new DatabaseError('spellModel', 'getClassIdFromName', `Failed to query the database to get the id of a class: ${error}`);
    }

    if (classId.length == 0)
        return null;

    return classId[0].Id;
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
    return addSpellFromValues(spell.Level, spell.SchoolId, spell.UserId, spell.Description, spell.Name, spell.CastingTime,
                              spell.EffectRange, spell.Verbal, spell.Somatic, spell.Material, spell.Materials, spell.Duration, 
                              spell.Damage, spell.EffectRange, spell.Concentration, spell.Ritual);
}

/**
 * Validates the spell's information and adds it to the database table.
 * No value can be empty besides materials and damage.
 * If a spell with the same level, name and schoolId is already present in the table, the table will remain unchanged.
  * @param {Integer} level The level of the spell, must be an integer from 0 - 9
  * @param {Integer} schoolId The Id of the school the spell belongs to, must not contain any numbers.
  * @param {Integer} userId The id of the user who created this spell, 0 by default.
  * @param {String} description The description of the spell.
  * @param {String} name The name of the spell must not contain any numbers.
  * @param {String} castingTime The casting time of the spell in string form Ex. "1 Action"
  * @param {Boolean} verbal Indicates whether the spell requires verbal components.
  * @param {Boolean} somatic Indicates whether the spell requires somatic components.
  * @param {Boolean} material Indicates whether the spell requires material components.
  * @param {String} materials The materials needed to cast the spell - null if material is false
  * @param {String} duration The duration of the spell. Ex. "1 minute" or "instantaneous".
  * @param {String} damage The damage of the spell, can be null.
  * @param {String} effectRange The range of the spell Ex. "60 feet" or "Self"
  * @param {Boolean} concentration Indicates whether the spell requires concentration.
  * @param {Boolean} ritual Indicates whether the spell can be cast as a ritual.
  * @param {Array} classIds An array of class ids which can cast the spell.
 * @returns The spell that was added to the database.
 * @throws {InvalidInputError} Thrown when the input is invalid.
 * @throws {DatabaseError} Thrown when the spell could not be added to the database.
 */
async function addSpellFromValues(level, schoolId, userId, description, name, castingTime, verbal, somatic, material, materials, duration, damage, effectRange, concentration, ritual, classIds) {

    // Validate the spell, this will throw if the spell is invalid
    try{
        await validationModel.validateSpell(level, schoolId, userId, description, name, castingTime, verbal, somatic, material, materials, duration, damage, effectRange, concentration, ritual, classIds, connection);
    }catch(error){
        if(error instanceof DatabaseError)
            throw error

        throw new InvalidInputError('spellModel', 'addSpellFromValues', error);
    }

    // change names to lowercase
    name = name.toLowerCase().replace(/'/g, "''");
    description = description.replace(/'/g, "''");
    castingTime = castingTime.replace(/'/g, "''");
    duration = duration.replace(/'/g, "''");
    effectRange = effectRange.replace(/'/g, "''");

    if (damage != null)
        damage = damage.replace(/'/g, "''");
    if (materials != null)
        materials = materials.replace(/'/g, "''");


    // Check if the spell already exists
    const findDuplicateQuery = `SELECT * FROM Spell WHERE level=${level} AND name='${name}' AND schoolId=${schoolId}`;
    let matchedSpellRows;
    let columnDefinitions;
    try {
        [matchedSpellRows, columnDefinitions] = await connection.query(findDuplicateQuery)
    } catch (err) {
        throw new DatabaseError(`Failed to select from table (Spell): ${err.message}`);
    }

    // If this spell isn't already present in the table, add it
    if (matchedSpellRows.length == 0) {

        // Find next highest Id
        [highestIndexRow, columnDefinitions] = await connection.query('SELECT Id from Spell order by Id desc limit 1');

        // Imitate auto increment
        let newId = 1;
        if (highestIndexRow.length > 0)
            newId = highestIndexRow[0].Id + 1;

        // INSERT
        const insertQuery = `INSERT INTO Spell (Id, SchoolId, UserId, Level, Description, Name, CastingTime, EffectRange, Verbal, 
                            Somatic, Material, Materials, Duration, Damage, Concentration, Ritual) VALUES 
                            (${newId}, ${schoolId}, ${userId}, ${level}, '${description}', '${name}', '${castingTime}', '${effectRange}', ${verbal}, ${somatic}, ${material}, '${materials}', '${duration}', '${damage}', ${concentration}, ${ritual});`;
        
        let spellInDb;
        try {
            await connection.execute(insertQuery)
            spellInDb = await connection.execute(`SELECT * from Spell WHERE Id = ${newId}`);
            spellInDb = spellInDb[0][0];
        } catch (err) {
            throw new DatabaseError(`Failed to write to table (Spell): ${err.message}`);
        }

        // Add to the ClassPermittedSpells table
        for(classId of classIds){
            try{
                await connection.execute(`INSERT INTO ClassPermittedSpell (ClassId, SpellId) values (${classId}, ${spellInDb.Id});`)
            }
            catch(error){
                throw new DatabaseError('spellModel', 'addSpellFromValues', `Failed to add spell to the ClassPermittedSpell table: ${error};`)
            }
        }


        // Return the spell added
        logger.info(`Successfully added spell (${name}).`)

        // Return the spell in the database
        return spellInDb;
    }

    return matchedSpellRows[0];

    

}

/**
 * Deletes all spells which have the same Id as the argument passed.
 * If an invalid spell Id is passed, the function returns false since
 * no spell with that Id could be deleted.
 * @param {Number} Id A positive integer indicating the Id of the spell to delete.
 * @param {Integer} userId The id of the user trying to delete a spell.
 * @throws {InvalidInputerror} Throw when a bad user or spell id is passed, or if the user doesn't have permission to delete the selected spell.
 * @throws {DatabaseError} Thrown when there is an issue writing to the database.
 */
async function removeSpellById(Id, userId) {

    // Return right away if the spell Id is invalid
    try {
        await validationModel.validateSqlTableId(Id)
        await validationModel.validateUser(userId, connection);
    }
    catch (error) {
        throw new InvalidInputError(`Failed to remove spell with Id (${Id}): ${error}`)
    }

    const deleteQuery = `DELETE FROM Spell WHERE Id = ${Id} AND UserId = ${userId}`;
    let executionRowsData;
    try {
        [executionRowsData] = await connection.execute(deleteQuery)
    } catch (err) {
        throw new DatabaseError(`Failed to delete from table Spell: ${err.message}`)
    }

    if(executionRowsData.affectedRows == 0)
        throw new InvalidInputError('spellModel', 'removeSpellById', 'User does not have permission to delete the selected spell.');

}

/**
 * Gets the contents of a the spell table in the database.
 * Will return all the spells created by the user and the default user.
 * @param {Integer} userId The id of a user, default to 0.
 * @returns An array containing the rows of a table in the database.
 */
async function getAllSpells(userId = 0) {

    let rows;
    let columnDefinitions;

    try {
        [rows, columnDefinitions] = await connection.query(`select S.*, SS.name as "school" from Spell S, SpellSchool SS WHERE S.schoolId = SS.Id AND (S.UserId = ${userId} OR S.UserId = 0);`)
    } catch (error) {
        throw new DatabaseError(`Failed to read from table Spell ... Try resetting the database : ${error.message}`)
    }

    return rows;

}

/**
 * Gets the spells who match the criteria passed in the function
 * Leaving a parameter null indicates that any value is acceptable for that field.
  * @param {Integer} level The level of the spell, must be an integer from 0 - 9
  * @param {Integer} schoolId The Id of the school the spell belongs to, must not contain any numbers.
  * @param {Integer} userId The id of the user who created this spell, 0 by default.
  * @param {String} name The name of the spell must not contain any numbers.
  * @param {String} castingTime The casting time of the spell in string form Ex. "1 Action"
  * @param {Boolean} verbal Indicates whether the spell requires verbal components.
  * @param {Boolean} somatic Indicates whether the spell requires somatic components.
  * @param {Boolean} material Indicates whether the spell requires material components.
  * @param {String} materials The materials needed to cast the spell - null if material is false
  * @param {String} duration The duration of the spell. Ex. "1 minute" or "instantaneous".
  * @param {String} effectRange The range of the spell Ex. "60 feet" or "Self"
  * @param {Boolean} concentration Indicates whether the spell requires concentration.
  * @param {Boolean} ritual Indicates whether the spell can be cast as a ritual.
  * @param {Array} classIds An array of class ids which can cast the spell.
 * @returns An array containing the spells which match the specifications passed.
 */
async function getSpellsWithSpecifications(level, schoolId, userId, name, castingTime, verbal, somatic, material, duration, effectRange, concentration, ritual, classIds) {

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
        throw new DatabaseError(`Failed to get all spell schools from the database: ${error}`);
    }

    // Validate the spell inputs
    try {
        if (level != null)
            await validationModel.validateSpellLevel(level)
        if (name != null)
            await validationModel.validateSpellName(name)
        if (schoolId != null)
            await validationModel.validateSpellSchool(schoolId, connection)
        if (userId != null)
            await validationModel.validateUser(userId, connection)
        if(castingTime != null)
            await validationModel.validateSpellGenericString(castingTime, 'casting time');
        if(verbal != null)
            await validationModel.validateSpellComponentBool(verbal);
        if(somatic != null)
            await validationModel.validateSpellComponentBool(somatic);
        if(material != null)
            await validationModel.validateMaterials(material, materials);
        if(duration != null)
            await validationModel.validateSpellComponentBool(duration);
        if(effectRange != null)
            await validationModel.validateSpellGenericString(effectRange, 'range');
        if(concentration != null)
            await validationModel.validateSpellComponentBool(concentration);
        if(ritual != null)
            await validationModel.validateSpellComponentBool(ritual);
        if(classIds != null)
            await validationModel.validateClassIds(classIds);

    } catch (error) {
        if (error instanceof Error)
            throw new InvalidInputError(error.message)
        throw error
    }

    // Update
    let tempSelectQuery = `SELECT S.*, SS.Name as 'school', description FROM Spell S, SpellSchool SS WHERE S.schoolId = SS.Id AND`;

    // Add each column where applicable
    if (level != null)
        tempSelectQuery += ` Level = ${level} AND`;
    if (name != null){
        // Treat % and _ as literals if the name contains those characters - for the "like" clause
        name = name.replace('%', '[%]');
        name = name.replace('_', '[_]');
        tempSelectQuery += ` S.Name like '%${name.replace(/'/g, "''").toLowerCase()}%' AND`;
    }
    if (schoolId != null)
        tempSelectQuery += ` SchoolId = ${schoolId} AND`
    if(castingTime != null)
        tempSelectQuery += `CastingTime = ${castingTime} AND`
    if(verbal != null)
        tempSelectQuery += `Verbal = ${verbal} AND`
    if(somatic != null)
        tempSelectQuery += `Somatic = ${somatic} AND`
    if(material != null)
        tempSelectQuery += `Material = ${material} AND`
    if(duration != null)
        tempSelectQuery += `Duration = ${duration} AND`
    if(range != null)
        tempSelectQuery += `Range = ${range} AND`
    if(concentration != null)
        tempSelectQuery += `Concentration = ${concentration} AND`;
    if(ritual != null)
        tempSelectQuery += `Ritual = ${ritual} AND`
    if(classIds != null){
        if(classIds.length > 0)
            tempSelectQuery += '('
        for(id of classIds)
            tempSelectQuery += `EXISTS (SELECT 1 FROM ClassPermittedSpell WHERE ClassId = ${id}) AND`
        tempSelectQuery = tempSelectQuery.substr(0, tempSelectQuery.length-3) + ') AND';
    }

    // Remove the last AND
    let selectQuery = tempSelectQuery + (userId == null ? 'UserId = 0' : `(UserId = 0 OR UserId = ${userId})`);
    let rows;
    let columnDefinitions;
    try {
        [rows, columnDefinitions] = await connection.query(selectQuery)
    } catch (error) {
        throw new DatabaseError(`Failed to read from table Spell: ${error.message}`)
    };

    return rows;

}

/**
 * Gets a spell that matches the Id.
 * @param {Number} Id The Id of the spell to get.
 * @returns A spell that matches the Id, null if no spell contains the Id.
 */
async function getSpellById(Id) {

    // Validate the Id
    try {
        await validationModel.validateSqlTableId(Id)
    } catch (error) {
        throw new InvalidInputError(error.message)
    };

    // Get all spells with specified Id
    let rows;
    let columnDefinitions;
    try {
        [rows, columnDefinitions] = await connection.execute(`SELECT S.Id, level, S.name, SS.name as 'school', description FROM Spell S, SpellSchool SS where S.Id = ${Id} and S.schoolId = SS.Id`)
    } catch (error) {
        throw new DatabaseError(`Failed to get spell from database: ${error.message}`)
    };


    // return null if nothing was found
    return rows.length == 0 ? null : rows[0];

}

/**
 * Changes the spell whose Id matches to now have the values passed in as arguments.
 * If a field should remain unchanged, pass null in the parameter that should remain unchanged.
 * If the changed spell would be a duplicate, the spell is deleted instead.
 * @param {Number} Id The Id of the spell to update.
 * @param {String} newLevel The new level to set the spell's level to.
 * @param {String} newName The new name to set the spell's name to.
 * @param {String} newSchoolId The spell's new schoolId Id.
 * @param {String} newDescription the spell's new description.
 * @returns Whether a spell was successfully updated.
 * @throws If an invalid value is passed in newName, newSchoolId or newDescription and isn't equal to null, or an invalid Id is passed. Or if all passed values are null.
 */
async function updateSpellById(Id, newLevel, newName, newSchoolId, newDescription) {

    if (newLevel == null && newName == null && newSchoolId == null && newDescription == null) {
        throw new InvalidInputError('At least one field should be changed (not null).')
    }

    if (Id <= 0)
        throw new InvalidInputError("Id can not be a negative value.")
    if (Id % 1 != 0)
        throw new InvalidInputError("Id must be an integer.")

    // Get all the schools for validation
    let allSchools;
    try {
        allSchools = await getAllSchoolIds();
    }
    catch (error) {
        throw new DatabaseError(`Failed to get all spell schools from the database: ${error}`);
    }

    // Validate the spell inputs
    try {
        if (newLevel != null)
            await validationModel.validateSpellLevel(newLevel)

        if (newName != null)
            await validationModel.validateSpellName(newName)

        if (newSchoolId != null)
            await validationModel.validateSpellSchool(newSchoolId, connection)

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
            [rows, columnDefinitions] = await connection.query(`SELECT * FROM Spell where Id = ${Id}`);
            if (rows.length == 0)
                return false;
        }
        catch(error){
            throw new DatabaseError(`Failed to query the database to find the spell to be updated: ${error}`);
        }

        let rows;
        try{
            // Get all rows that will be a duplicate if they change
            [rows, columnDefinitions] = await connection.query(`SELECT * FROM Spell S WHERE Id != ${Id} 
            AND name = ${newName == null ? `(select name from Spell where Id = ${Id})` : `'${newName.replace(/'/g, "''").toLowerCase()}'`} 
            AND level = ${newLevel == null ? `(select level from Spell where Id = ${Id})` : `${newLevel}`} 
            AND schoolId = ${newSchoolId == null ? `(select schoolId from Spell where Id = ${Id})` : `${newSchoolId}`}`
            );
        }
        catch(error){
            throw new DatabaseError(`Failed to select duplicate spells from the database before updating the spell information: ${error}`);
        }

        // Delete the spells that would be a duplicate
        try {
            rows.forEach(async (spell) => {
                await connection.execute(`DELETE FROM Spell WHERE Id = ${spell.Id}`);
            })
        }
        catch (error) {
            throw new DatabaseError(`Failed to delete from spell table: ${error.message}`);
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
    updateQuery += ` WHERE Id = ${Id}`;
    let executionData;
    try {
        [executionData] = await connection.execute(updateQuery)
    } catch (error) {
        throw new DatabaseError(`Failed to update Spell table: ${error.message}`)
    }

    return executionData.affectedRows > 0;
}

/**
 * Returns a list of all the spell schools stored in the database with the first letter of their name capitalized.
 */
async function getAllSchools() {
    try {
        [schoolObjects, columnDefinitions] = await connection.query('SELECT Id, name FROM SpellSchool')

        for (let i = 0; i < schoolObjects.length; i++){

            schoolObjects[i].name = schoolObjects[i].name[0].toUpperCase() + schoolObjects[i].name.substring(1, schoolObjects[i].name.length);
        }

        return schoolObjects;
    } catch (error) {
        throw new DatabaseError(`Failed to get ids from the SpellSchool table: ${error.message}`)
    };
}

/**
 * Gets a list of all the school ids in the database.
 * @returns A list of all school ids in the database.
 */
async function getAllSchoolIds() {
    return (await getAllSchools()).map(object => object.Id);
}


module.exports = {
    initialize,
    closeConnection,
    addSpell,
    addSpellFromValues,
    removeSpellById,
    getAllSpells,
    getSpellById,
    getSpellsWithSpecifications,
    updateSpellById,
    getAllSchools
}
