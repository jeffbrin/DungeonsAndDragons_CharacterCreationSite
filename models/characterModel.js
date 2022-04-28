const mysql = require('mysql2/promise');
const valUtils = require('./validateCharacter');
let connection;
const tableName = 'PlayerCharacter';
const logger = require('../logger');
const errors = require('../models/errorModel');



/**
 * 
 * @param {String} databaseNameTmp - The name of the database to connect to.
 * @param {Boolean} reset - If true, the database will be reset before the connection is made.
 * @description This function initializes the connection to the database. It also creates and drops the table
 */
async function initialize(databaseNameTmp, reset) {
    connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        port: '10000',
        password: 'pass',
        database: databaseNameTmp
    });

    if (reset) {
        //delete this query in the final version, this is here just for testing so you don't have to delete the entries after every time you run the code to debug.
        const deleteDbQuery = `Drop table if exists ${tableName};`;
        await connection.execute(deleteDbQuery).then(logger.info(`Table: ${tableName} deleted if existed to reset the Db and reset increment in initialize()`)).catch((error) => { console.error(error); });
    }

    const sqlQueryC = `Create table if not exists ${tableName}(id int AUTO_INCREMENT, name varchar(50), race VARCHAR(50), class VARCHAR(50), hitpoints int, primary key(id));`;
    await connection.execute(sqlQueryC).then(logger.info(`Table: ${tableName} Created/Exists - initialize()`)).catch((error) => { console.error(error); });
}

async function closeConnection() {
    await connection.end().then(logger.info(`Connection closed from closeConnection() in dndModel`)).catch((error) => {console.log(error);});
}

//Region Add/Update/Delete Methods
/**
 * 
 * @param {String} name - The name of the character to add.
 * @param {String} race - The race of the character to add
 * @param {String} charClass - The class of the character to add
 * @param {Integer} hitpoints - The number of hitpoints the Character has when created.
 * @description - This function adds a character to the database after validating the inputs. Stores into the Database as lower case
 * @throws {InvalidInputError} If the character is not found 
 * @throws {DatabaseError} If there was an error on the database's side
 */
async function addCharacter(name, race, charClass, hitpoints) {
    if (! await valUtils.isCharValid(name, race, charClass, hitpoints)) {
        throw new errors.InvalidInputError("Invalid Character, cannot ADD in addCharacter()");
    }

    //ADD CHAR TO DB
    let query = `insert into ${tableName} (name, race, class, hitpoints) values ('${name.toLowerCase()}', '${race.toLowerCase()}', '${charClass.toLowerCase()}', '${hitpoints}');`;

    await connection.execute(query).then(console.log("Insert command executed in addCharacter()")).catch((error) => { throw new errors.DatabaseError(error); });

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
        throw new errors.InvalidInputError("Invalid Character, cannot update character - updateCharacter()");
    }
    let selectQuery = `Select 1 from ${tableName} where id = ${id}`;
    let [rows, column_definitions] = await connection.query(selectQuery).then(console.log("select Query before Update Executed - updateCharacter()")).catch((error) => { throw new errors.DatabaseError(error); });

    //Check if there is an ID that matches in the database
    if (rows.length == 0) {
        throw new errors.InvalidInputError("Invalid Id, character DOES NOT EXIST!");
    }
    let query = `Update ${tableName} SET name = '${newName.toLowerCase()}', race = '${newRace.toLowerCase()}', class = '${newClass.toLowerCase()}', hitpoints = ${newHitpoints} where id = ${id};`;
    await connection.execute(query).then(console.log("Update Query Executed - updateCharacter()")).catch((error) => { throw new errors.DatabaseError(error.message); });
}


//END REGION

//MISC METHODS

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
async function getCharacter(id){
    let query = `select id, name, race, class, hitpoints from ${tableName} where id = ${id};`;
    let [rows, column_definitions] = await connection.query(query).then(console.log("select Query before returning Character executed")).catch((error) => { throw new errors.DatabaseError(error); });
    if (rows.length === 0) {
        throw new errors.InvalidInputError("Character not found with that name and race combo - findIdWithNameAndRace()");
    }
    return rows[0];
}

/**
 * deletes a character
 * @param {Integer} id 
 * @returns true if success, throws if false
 * @throws {InvalidInputError} If the character is not found 
 * @throws {DatabaseError} If there was an error on the database's side
 */
async function deleteCharacter(id){
    let query = `delete from ${tableName} where id = ${id};`;
    
    try{
        let checkingQ = `select * from ${tableName} where id = ${id};`;
        let [rows, column_definitions] = await connection.query(checkingQ).then(console.log("Select query to check if Id exists has been executed"));

        if(rows.length === 0){
            throw new errors.InvalidInputError("Character not found with that ID");
        }
        await connection.execute(query).then(console.log(`Delete Query Executed Character with id: ${id} was deleted`)).catch((error) => {throw new errors.DatabaseError("Delete Query could not be completed");});
        return true;
    }
    catch (error){
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

/**
 * Gets the connection to this database
 * @returns the connection to the database
 */
function getConnection(){
    return this.connection;
}

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