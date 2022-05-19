const mysql = require('mysql2/promise')
const validationModel = require('./validateSpellUtils')
const logger = require('../logger');
const fs = require('fs/promises');
const {DatabaseError, InvalidInputError} = require('./errorModel');

const COLS_TO_SELECT = 'S.*, SS.Name as school, SS.Id as schoolId';

let connection;

/**
 * Gets an array of spell school names from the json file.
 * @returns An array of all the spell school names.
 */
async function getSchoolsFromJSON(){
    return JSON.parse(await fs.readFile('database-content-json/spellSchools.json'));
}

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
        const validSchools = await getSchoolsFromJSON();
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
        await connection.execute('DROP TABLE IF EXISTS ClassPermittedSpell;')
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

        await addSpellFromValues(level, schoolId, 0, description, name, castingTime, range, verbal, somatic, material, materials, duration, damage, concentration, ritual, classIds)
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
 * If the exact same spell already exists, the spell is not added but no error is thrown.
 * @param {Object} spell The spell to add to the database.
 * @returns The spell added to the database. If a similar spell is in the db already, that one is returned.
 * @throws {InvalidInputError} Thrown when the input is invalid.
 * @throws {DatabaseError} Thrown when the spell could not be added to the database.
 */

async function addSpell(spell) {
    return addSpellFromValues(spell.Level, spell.SchoolId, spell.UserId, spell.Description, spell.Name, spell.CastingTime,
                              spell.EffectRange, spell.Verbal, spell.Somatic, spell.Material, spell.Materials, spell.Duration, 
                              spell.Damage, spell.Concentration, spell.Ritual, spell.Classes);
}

/**
 * Validates the spell's information and adds it to the database table.
 * No value can be empty besides materials and damage.
 * If the exact same spell already exists, the spell is not added but no error is thrown.
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
async function addSpellFromValues(level, schoolId, userId, description, name, castingTime, effectRange, verbal, somatic, material, materials, duration, damage, concentration, ritual, classIds) {

    // Validate the spell, this will throw if the spell is invalid
    materials = materials ? materials : null;
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
    const findDuplicateQuery = `SELECT * FROM Spell, ClassPermittedSpell WHERE level=${level} AND name='${name}' AND schoolId=${schoolId} AND (UserId = ${userId} OR UserId = 0) 
                                AND CastingTime = '${castingTime}' AND Description = '${description}' AND Verbal = ${verbal} AND Somatic = ${somatic} AND Material = ${material} 
                                AND Materials = '${materials}' AND Duration = '${duration}' AND Damage = '${damage}' AND EffectRange = '${effectRange}' AND Concentration = ${concentration} 
                                AND Ritual = ${ritual};`;

    
    let matchedSpellRows;
    let columnDefinitions;
    try {
        [matchedSpellRows, columnDefinitions] = await connection.query(findDuplicateQuery)
    } catch (err) {
        throw new DatabaseError(`Failed to select from table (Spell): ${err.message}`);
    }

    // If this spell isn't already present in the table, add it
    let spellInDb;
    let existingClassIds;
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
        
        try {
            await connection.execute(insertQuery)
            spellInDb = await connection.execute(`SELECT * from Spell WHERE Id = ${newId}`);
            spellInDb = spellInDb[0][0];
        } catch (err) {
            throw new DatabaseError(`Failed to write to table (Spell): ${err.message}`);
        }

        // Return the spell added
        logger.info(`Successfully added spell (${name}).`)

    }else{    
        // Get the list of class ids in the database that can already cast this spell
        // This allows the user to add more schools for a spell by adding the spell
        try{
            [existingClassIds, columns] = await connection.query(`SELECT ClassId FROM ClassPermittedSpell WHERE SpellId = ${matchedSpellRows[0].Id}`);
            existingClassIds = existingClassIds.map(obj => obj.ClassId);
        }
        catch(error){
            throw new DatabaseError('spellModel', 'addSpellFromValues', `Failed to get the list of classes a spell can be casted by: ${error}`);
        }
    }

    for(classId of classIds){
        if(!existingClassIds || !existingClassIds.includes(Number(classId))){
            try{
                await connection.execute(`INSERT INTO ClassPermittedSpell (ClassId, SpellId) values (${classId}, ${matchedSpellRows.length == 0 ? spellInDb.Id : matchedSpellRows[0].Id});`)
            }
            catch(error){
                throw new DatabaseError('spellModel', 'addSpellFromValues', `Failed to add spell to the ClassPermittedSpell table: ${error};`)
            }
        }
    }

    // Return the spell in the database
    if(matchedSpellRows.length == 0)
        return spellInDb;

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
        await validationModel.validateSpellId(Id, userId, connection);
        await validationModel.validateUser(userId, connection);
    }
    catch (error) {
        if(error instanceof DatabaseError)
            throw error;
        throw new InvalidInputError('spellModel', 'removeSpellById', `Failed to remove spell with Id (${Id}): ${error.message}`)
        
    }

    const deleteQuery = `DELETE FROM Spell WHERE Id = ${Id} AND UserId = ${userId}`;
    let executionRowsData;
    try {
        await connection.execute(`DELETE FROM ClassPermittedSpell WHERE SpellId = ${Id}`);
        [executionRowsData] = await connection.execute(deleteQuery);
    } catch (err) {
        throw new DatabaseError('spellModel', 'removeSpellById', `Failed to delete from table Spell: ${err.message}`)
    }

    if(executionRowsData.affectedRows == 0)
        throw new InvalidInputError('spellModel', 'removeSpellById', 'User does not have permission to delete the selected spell.');

}

/**
 * Gets the contents of a the spell table in the database.
 * Will return all the spells created by the user and the default user.
 * @param {Integer} userId The id of a user, default to 0.
 * @returns An array containing the rows of a table in the database.
 * @throws {InvalidInputError} Thrown when the user id is invalid.
 * @throws {DatabaseError} Thrown when there is an issue with the database connection.
 */
async function getAllSpells(userId = 0) {

    let rows;
    let columnDefinitions;

    try{
    await validationModel.validateUser(userId, connection);
    }
    catch(error){
        if(error instanceof DatabaseError)
            throw error;
        throw new InvalidInputError('spellModel', 'getAllSpells', error.message);
    }

    try {
        [rows, columnDefinitions] = await connection.query(`select S.*, SS.name as "school" from Spell S, SpellSchool SS WHERE S.schoolId = SS.Id AND (S.UserId = ${userId} OR S.UserId = 0) ORDER BY Level ASC;`)
    } catch (error) {
        throw new DatabaseError(`Failed to read from table Spell ... Try resetting the database : ${error.message}`)
    }

    // This was making it very slow
    // // Get the classes that can cast the spells
    // for (spell of rows){
    //     spell.Classes = await getClassesObjectListFromSpellId(spell.Id);
    // }

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
  * @param {Boolean} homebrewOnlyOrNone Indicates whether the spells should be only homebrew or only phb. False = phb, True = Homebrew
 * @returns An array containing the spells which match the specifications passed.
 */
async function getSpellsWithSpecifications(level, schoolId, userId, name, castingTime, verbal, somatic, material, duration, effectRange, concentration, ritual, classIds, homebrewOnlyOrNone) {

    // Later code checks if the name is null, the same
    // logic should be applied for an empty name
    if (name == "")
        name = null;

    // Validate the spell inputs
    try {
        if (level != null)
            await validationModel.validateSpellLevel(level)
        if (name != null)
            await validationModel.validateSpellName(name)
        if (schoolId != null)
            await validationModel.validateSpellSchool(schoolId, connection)
        await validationModel.validateUser(userId, connection)
        if(castingTime != null)
            await validationModel.validateSpellGenericString(castingTime, 'casting time');
        if(verbal != null)
            await validationModel.validateSpellComponentBool(verbal);
        if(somatic != null)
            await validationModel.validateSpellComponentBool(somatic);
        if(material != null)
            await validationModel.validateSpellComponentBool(material);
        if(duration != null)
            await validationModel.validateSpellGenericString(duration, 'duration');
        if(effectRange != null)
            await validationModel.validateSpellGenericString(effectRange, 'range');
        if(concentration != null)
            await validationModel.validateSpellComponentBool(concentration);
        if(ritual != null)
            await validationModel.validateSpellComponentBool(ritual);
        if(classIds != null)
            await validationModel.validateClassIds(classIds, connection);
        if(homebrewOnlyOrNone != null)
            await validationModel.validateSpellComponentBool(homebrewOnlyOrNone);

    } catch (error) {
        if (error instanceof DatabaseError)
            throw error;    
        throw new InvalidInputError('spellModel', 'getSpellsWithSpecifications', error.message)
        
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
        tempSelectQuery += ` CastingTime = '${castingTime}' AND`
    if(verbal != null)
        tempSelectQuery += ` Verbal = ${verbal} AND`
    if(somatic != null)
        tempSelectQuery += ` Somatic = ${somatic} AND`
    if(material != null)
        tempSelectQuery += ` Material = ${material} AND`
    if(duration != null)
        tempSelectQuery += ` Duration = '${duration}' AND`
    if(effectRange != null)
        tempSelectQuery += ` EffectRange = '${effectRange}' AND`
    if(concentration != null)
        tempSelectQuery += ` Concentration = ${concentration} AND`;
    if(ritual != null)
        tempSelectQuery += ` Ritual = ${ritual} AND`
    if(classIds != null){
        if(classIds.length > 0)
            tempSelectQuery += '('
        for(id of classIds)
            tempSelectQuery += ` EXISTS (SELECT 1 FROM ClassPermittedSpell WHERE ClassId = ${id} AND SpellId = S.Id) AND`
        tempSelectQuery = tempSelectQuery.substr(0, tempSelectQuery.length-3) + ') AND';
    }

    // Remove the last AND
    let userWhereClause = homebrewOnlyOrNone == null ? (userId == null ? ' UserId = 0' : ` (UserId = 0 OR UserId = ${userId})`) : homebrewOnlyOrNone ? ` UserId = ${userId}` : ' UserId = 0';
    let selectQuery = tempSelectQuery + userWhereClause;
    selectQuery += ' ORDER BY Level ASC';
    let rows;
    let columnDefinitions;
    try {
        [rows, columnDefinitions] = await connection.query(selectQuery)
    } catch (error) {
        throw new DatabaseError('spellModel', 'getSpellsWithSpecifications', `Failed to read from the Spell table: ${error.message}`)
    };

    // This was making it very slow
    // // Get the classes that can cast the spells
    // for(spell of rows){
    //     spell.Classes = await getClassesObjectListFromSpellId(spell.Id);
    // }

    return rows;

}

/**
 * Gets a spell that matches the Id. The user must have access to the requested spell.
 * @param {Integer} Id The Id of the spell to get.
 * @param {Integer} userId The id of the user requesting the spell.
 * @returns A spell that matches the Id, null if no spell contains the Id.
 * @throws {InvalidInputError} Thrown when no spell with the provided id exists or the user can not access it.
 * @throws {DatabaseError} Thrown when there is an issue with the database connection.
 */
async function getSpellById(Id, userId) {

    // Validate the Id
    try {
        await validationModel.validateSpellId(Id, userId, connection);
        await validationModel.validateUser(userId, connection);
    } catch (error) {
        if(error instanceof DatabaseError)
            throw error;
        throw new InvalidInputError('spellModel', 'getSpellById', error);
    };

    // Get all spells with specified Id
    let rows;
    let columnDefinitions;
    try {
        [rows, columnDefinitions] = await connection.execute(`SELECT ${COLS_TO_SELECT} FROM Spell S, SpellSchool SS where S.Id = ${Id} and S.schoolId = SS.Id AND (S.UserId = ${userId} OR S.UserId = 0);`)
    } catch (error) {
        throw new DatabaseError(`Failed to get spell from database: ${error.message}`)
    };

    if(rows.length == 0)
        throw new InvalidInputError('spellModel', 'getSpellById', 'The requested spell either does not exist or you can not access it.');

    const spell = rows[0];
    spell.Classes = await getClassesObjectListFromSpellId(spell.Id);

    // return null if nothing was found
    return rows[0];

}

/**
 * Gets a list of objects {Id, Name} representing the classes that can cast the spell passed.
 * @param {Integer} spellId The id of a spell
 * @returns A list of object containing the id and the name of each class indicated in the class ids list.
 */
async function getClassesObjectListFromSpellId(spellId){
    // Get the class ids
    let classIds;
    try{
        classIds = await connection.query(`SELECT ClassId FROM ClassPermittedSpell WHERE SpellId = ${spellId};`);
        classIds = classIds[0].map(obj => obj.ClassId);
    }
    catch(error){
        throw new DatabaseError('spellModel', 'getClassesObjectListFromSpellId', `Failed to get the ids of the classes which can cast the passed spell: ${error}`);
    }

    try{
        let statement = '('
        for(id of classIds){
            statement += ` Id = ${id} OR`;
        }
        statement = statement.substring(0, statement.length-2) + ')'
        return (await connection.query(`SELECT Id, Name FROM Class WHERE ${statement};`))[0];
    }
    catch(error){
        throw new DatabaseError('spellModel', 'getClassesObjectListFromSpellId', `Failed to query the database for the classes info: ${error}`);
    }
}

/**
 * Updates a spell to contain new values. If a certain value should not be edited, it should be passed as null.
 * Errors are thrown for invalid values. If a spell already exists with the values specified, it will be deleted and replaced with the spell
 * being updated. If the deleted spell has different classIds than the spell being edited, the spell being edited will keep the classes.
 * @param {Integer} Id The id of the spell to change.
 * @param {Integer} userId The user trying to change the spell.
 * @param {Integer} newLevel The new level of the spell.
 * @param {Integer} newSchoolId The id of the new school of the spell.
 * @param {String} newDescription The new description of the spell.
 * @param {String} newName The new name of the spell.
 * @param {String} newCastingTime The new casting time of the spell.
 * @param {Boolean} newVerbal The new verbal value of the spell.
 * @param {Boolean} newSomatic The new somatic value of the spell.
 * @param {Boolean} newMaterial The new material value of the spell.
 * @param {String} newMaterials The new materials required to cast the spell.
 * @param {String} newDuration The new duration of the spell.
 * @param {String} newDamage The new damage of the spell.
 * @param {String} newEffectRange The new range of the spell.
 * @param {Boolean} newConcentration The new concentration value of the spell.
 * @param {Boolean} newRitual The new ritual value of the spell.
 * @param {Array} newClassIds The new array of class ids which can cast the spell.
 * @returns The new edited spell.
 * @throws {InvalidInputError} Thrown if all the arguments are null of if any are invalid.
 * @throws {DatabaseError} Thrown when there is an issue interracting with the database.
 */
async function updateSpellById(Id, userId, newLevel, newSchoolId, newDescription, newName, newCastingTime, newVerbal, newSomatic, newMaterial, newMaterials, newDuration, newDamage, newEffectRange, newConcentration, newRitual, newClassIds) {

    if (newLevel == null && newName == null && newSchoolId == null && newDescription == null && newCastingTime == null && newVerbal == null && newSomatic == null &&
        newMaterial == null && newDuration == null && newEffectRange == null && newConcentration == null && newRitual == null && newClassIds == null) {
        throw new InvalidInputError('spellModel', 'updateSpellById', 'At least one field should be changed (not null).')
    }

    if (Id <= 0)
        throw new InvalidInputError('spellModel', 'updateSpellById', "Id can not be a negative value.")
    if (Id % 1 != 0)
        throw new InvalidInputError('spellModel', 'updateSpellById', "Id must be an integer.")



    // Validate the spell inputs
    try {
        await validationModel.validateUser(userId, connection);
        if (newLevel != null)
            await validationModel.validateSpellLevel(newLevel)
        if (newName != null)
            await validationModel.validateSpellName(newName)
        if (newSchoolId != null)
            await validationModel.validateSpellSchool(newSchoolId, connection)
        if(newCastingTime != null)
            await validationModel.validateSpellGenericString(newCastingTime, 'casting time');
        if(newVerbal != null)
            await validationModel.validateSpellComponentBool(newVerbal);
        if(newSomatic != null)
            await validationModel.validateSpellComponentBool(newSomatic);
        if(newMaterial != null)
            await validationModel.validateMaterials(newMaterial, newMaterials);
        if(newDuration != null)
            await validationModel.validateSpellGenericString(newDuration, 'duration');
        if(newEffectRange != null)
            await validationModel.validateSpellGenericString(newEffectRange, 'range');
        if(newConcentration != null)
            await validationModel.validateSpellComponentBool(newConcentration);
        if(newRitual != null)
            await validationModel.validateSpellComponentBool(newRitual);
        if(newClassIds != null)
            await validationModel.validateClassIds(newClassIds, connection);
        if(newDescription)
            await validationModel.validateSpellGenericString(newDescription, 'description');
        if(newDamage)
            await validationModel.validateSpellGenericString(newDamage, 'damage');

    } catch (error) {
        if (error instanceof InvalidInputError || error instanceof DatabaseError)
            throw error
        throw new InvalidInputError('spellModel', 'updateSpellById', error.message)
        
    }

    // Check if the spell would become a duplicate if it is changed and delete it
    try{
        // DO NOT CHANGE THE SPACING AND INDENTATION OF THE STRING
        // will mess up the substring
        let selectQuery = `SELECT Id FROM Spell S WHERE UserId = ${userId} AND S.Id != ${Id} AND 
                    ${newLevel == null ? '' : `Level = ${newLevel} AND `}
                    ${newName == null ? '' : `Name = '${newName.toLowerCase().replace(/'/g, "''")}' AND `}
                    ${newSchoolId == null ? '' : `SchoolId = ${newSchoolId} AND `}
                    ${newCastingTime == null ? '' : `CastingTime = '${newCastingTime.replace(/'/g, "''")}' AND `}
                    ${newVerbal == null ? '' : `Verbal = ${newVerbal} AND `}
                    ${newSomatic == null ? '' : `Somatic = ${newSomatic} AND `}
                    ${newMaterial == null ? '' : `Material = ${newMaterial} AND ${newMaterials == null ? 'Materials is null' : `Materials = '${newMaterials.toLowerCase().replace(/'/g, "''")}'`} AND `}
                    ${newDuration == null ? '' : `Duration = '${newDuration.replace(/'/g, "''")}' AND `}
                    ${newEffectRange == null ? '' : `EffectRange = '${newEffectRange.replace(/'/g, "''")}' AND `}
                    ${newConcentration == null ? '' : `Concentration = ${newConcentration} AND `}
                    ${newRitual == null ? '' : `Ritual = ${newRitual} AND `}
                    ${newDescription == null ? '' : `Description = '${newDescription.replace(/'/g, "''")}' AND `}
                    ${newDamage == null ? 'Damage is null AND ' : `Damage = '${newDamage.toLowerCase().replace(/'/g, "''")}' AND `}`;
        selectQuery = selectQuery.substring(0, selectQuery.length - 5);
        let selectedSpell = await connection.query(selectQuery);
        selectedSpell = selectedSpell[0];
        if(selectedSpell.length > 0){
            // Get the classes for this spell 
            selectedSpell = selectedSpell[0]
            let classes = await connection.query(`SELECT ClassId FROM ClassPermittedSpell WHERE SpellId = ${selectedSpell.Id}`);
            classes = classes.map(obj => obj.ClassId);

            // If the classes aren't the same, delete the spell from the ClassPermittedSpell table
            if(newClassIds == null || classes.length != newClassIds.length)
                await connection.execute(`DELETE FROM ClassPermittedSpell WHERE SpellId = ${selectedSpell.Id}`);
            else{
                for(classId of newClassIds){
                    if(!classes.includes(classId)){
                        await connection.execute(`DELETE FROM ClassPermittedSpell WHERE SpellId = ${selectedSpell.Id}`);
                        break;
                    }
                }
            }
            // Delete the spell since getting here means there is a duplicate
            await connection.execute(`DELETE FROM Spell WHERE Id = ${selectedSpell.Id}`);
        }
    }
    catch(error){
        throw new DatabaseError('spellModel', 'updateSpellById', `Failed to check if a spell would become a duplicate before updating: ${error}`);
    }

    // Update
    let tempUpdateQuery = 'UPDATE Spell SET ';

    // Add each column where applicable
    if (newLevel != null)
        tempUpdateQuery += ` Level = ${newLevel},`;
    if (newName != null)
        tempUpdateQuery += ` Name = '${newName.replace(/'/g, "''").toLowerCase()}',`;
    if (newSchoolId != null)
        tempUpdateQuery += ` SchoolId = ${newSchoolId},`
    if (newDescription != null)
        tempUpdateQuery += ` Description = '${newDescription.replace(/'/g, "''")}',`

    if(newCastingTime != null)
        tempUpdateQuery += ` CastingTime = '${newCastingTime.replace(/'/g, "''")}',`
    if(newVerbal != null)
    tempUpdateQuery += ` Verbal = ${newVerbal},`
    if(newSomatic != null)
    tempUpdateQuery += ` Somatic = ${newSomatic},`
    if(newMaterial != null)
    tempUpdateQuery += ` Material = ${newMaterial}, Materials = ${newMaterials == null ? null : `'${newMaterials}'`},`
    if(newDuration != null)
    tempUpdateQuery += ` Duration = '${newDuration.replace(/'/g, "''")}',`
    if(newEffectRange != null)
    tempUpdateQuery += ` EffectRange = '${newEffectRange.replace(/'/g, "''")}',`
    if(newConcentration != null)
    tempUpdateQuery += ` Concentration = ${newConcentration},`
    if(newRitual != null)
    tempUpdateQuery += ` Ritual = ${newRitual},`
    if(newDamage != null)
        tempUpdateQuery += ` Damage = '${newDamage.toLowerCase().replace(/'/g, "''")}',`
    else
        tempUpdateQuery += ` Damage = null,`

    // Remove the last comma
    let updateQuery = tempUpdateQuery.slice(0, -1);


    // Add where clause
    updateQuery += ` WHERE Id = ${Id}`;
    let executionData, spellInDatabase;
    try {
        [executionData] = await connection.execute(updateQuery);
    } catch (error) {
        throw new DatabaseError('spellModel', 'updateSpellById' `Failed to update Spell table: ${error}`)
    }

    spellInDatabase = await getSpellById(Id, userId);

    // If class ids was passed, edit those
    if(newClassIds != null){
        try{
            await connection.execute(`DELETE FROM ClassPermittedSpell WHERE SpellId = ${Id}`);
            for(classId of newClassIds){
                await connection.execute(`INSERT INTO ClassPermittedSpell (ClassId, SpellId) values (${classId}, ${Id});`)
            }
        }
        catch(error){
            throw new DatabaseError('spellModel', 'updateSpellById', `Failed to edit the class ids for the updated spell: ${error}`);
        }
    }
    spellInDatabase.Classes = await getClassesObjectListFromSpellId(spellInDatabase.Id);

    return spellInDatabase;
}

/**
 * Returns a list of all the spell schools stored in the database with the first letter of their name capitalized.
 */
async function getAllSchools() {
    try {
        [schoolObjects, columnDefinitions] = await connection.query('SELECT Id, name FROM SpellSchool')

        for (let i = 0; i < schoolObjects.length; i++){

            schoolObjects[i].Name = schoolObjects[i].name[0].toUpperCase() + schoolObjects[i].name.substring(1, schoolObjects[i].name.length);
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
    getAllSchools,
    dropReliantTables
}
