const mysql = require('mysql2/promise')
const validationModel = require('./validateSpellUtils')
const logger = require('../logger');
const fs = require('fs/promises');
const { InvalidInputError, DatabaseError } = require('./errorModel');


let connection;
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
        throw new DatabaseError('raceModel', 'initialize', `Failed to connect to the dnd database in the docker container. Make sure the docker container is running: ${error.message}`);
    }

    // Create the tables and populate them
    await createRaceTable(connection, reset);
    await createRacialTraitTable();
    await populateRaceAndRacialTraitTable();
    // .catch(error => {throw error});
}

/**
 * Creates the race table. If the reset flag is set to true, the RacialTrait table will be dropped but not recreated.
 * This functionality is required because the RacialTrait table contains foreign keys from the Race table.
 * @param {boolean} reset Indicates whether the tables should be if they already exist.
 * @throws {DatabaseError} Thrown when a table either failed to be dropped or failed to be created.
 */
async function createRaceTable(reset) {

    // Reset if the reset flag is true
    if (reset) {
        let dropQuery = `DROP TABLE IF EXISTS RacialTrait;`;

        // Drop the RacialTrait table first
        try {
            await connection.execute(dropQuery)
            logger.info(`RacialTrait table dropped.`);
        }
        catch (error) {
            throw new DatabaseError('raceModel', 'createRaceTable', `Failed to drop the RacialTrait table in the database... check your connection to the database: ${error.message}`)
        }

        // Drop the PlayerCharacter table since it contains foreign keys in the Race table
        try {
            await connection.execute(dropQuery)
            logger.info(`PlayerCharacter table dropped.`);
        }
        catch (error) {
            throw new DatabaseError('raceModel', 'createRaceTable', `Failed to drop the PlayerCharacter table in the database... check your connection to the database: ${error.message}`)
        }

        // Drop the Race table
        dropQuery = 'DROP TABLE IF EXISTS Race;'
        try {
            await connection.execute(dropQuery)
            logger.info(`Race table dropped.`);
        }
        catch (error) {
            throw new DatabaseError('raceModel', 'createRaceTable', `Failed to drop the Race table in the database... check your connection to the database: ${error.message}`)
        }
    }

    // Create the Race table
    const createTableQuery = `CREATE TABLE IF NOT EXISTS Race(Id INT, Name TEXT, PRIMARY KEY(Id));`;
    try {
        await connection.execute(createTableQuery).then(logger.info(`Race table created / already exists.`))
    }
    catch (error) {
        throw new DatabaseError('raceModel', 'createRaceTable', `Failed to create the Race table... check your connection to the database: ${error.message}`)
    }


}

/**
 * Creates the RacialTrait table in the database. This should only be called if the Race table already exists.
 */
async function createRacialTraitTable() {
    const createTableQuery = `CREATE TABLE IF NOT EXISTS RacialTrait(RaceId INT, Name VARCHAR(200), Description TEXT, PRIMARY KEY(RaceId, Name), FOREIGN KEY (RaceId) REFERENCES Race(Id));`;
    try {
        await connection.execute(createTableQuery).then(logger.info(`RacialTrait table created / already exists.`))
    }
    catch (error) {
        throw new DatabaseError('raceModel', 'createRacialTraitTable', `Failed to create the RacialTrait table... check your connection to the database: ${error.message}`)
    }
}

async function populateRaceAndRacialTraitTable() {
    const dataFile = 'database-content-json/races.json';

    // Read the json file
    let racialTraitData;
    try{
        racialTraitData = JSON.parse(await fs.readFile(dataFile));
    }
    catch(error){
        throw new DatabaseError('raceModel', 'populateRacialTraitTable', `There was an issue reading the RacialTrait json file: ${error}`)
    }
  
    try {
        console.log(racialTraitData);
        // Loop through each race in the file
        for (race in racialTraitData.Races) {
            
            // Get the list of racial traits for this race
            const racialTraits = racialTraitData.Races[race][`${race} Traits`].content;

        }
    }catch(error){
        throw new DatabaseError('raceModel', 'populateRacialTraitTable', `Failed to add a racial trait to the RacialTrait table in the database... Check the database connection: ${error}`)
    }

}

module.exports = { initialize }