const mysql = require('mysql2/promise')
const validationModel = require('./validateRaceUtils')
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
    await populateRaceAndRacialTraitTables();
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
        let dropCommand = `DROP TABLE IF EXISTS RacialTrait;`;

        // Drop the RacialTrait table first
        try {
            await connection.execute(dropCommand);
            logger.info(`RacialTrait table dropped.`);
        }
        catch (error) {
            throw new DatabaseError('raceModel', 'createRaceTable', `Failed to drop the RacialTrait table in the database... check your connection to the database: ${error.message}`)
        }

        // Drop the PlayerCharacter table since it contains foreign keys in the Race table
        try {
            await connection.execute(dropCommand);
            logger.info(`PlayerCharacter table dropped.`);
        }
        catch (error) {
            throw new DatabaseError('raceModel', 'createRaceTable', `Failed to drop the PlayerCharacter table in the database... check your connection to the database: ${error.message}`)
        }

        // Drop the Race table
        dropCommand = 'DROP TABLE IF EXISTS Race;'
        try {
            await connection.execute(dropCommand);
            logger.info(`Race table dropped.`);
        }
        catch (error) {
            throw new DatabaseError('raceModel', 'createRaceTable', `Failed to drop the Race table in the database... check your connection to the database: ${error.message}`)
        }
    }

    // Create the Race table
    const createTableCommand = `CREATE TABLE IF NOT EXISTS Race(Id INT, Name TEXT, Description TEXT, PRIMARY KEY(Id));`;
    try {
        await connection.execute(createTableCommand);
        logger.info(`Race table created / already exists.`);
    }
    catch (error) {
        throw new DatabaseError('raceModel', 'createRaceTable', `Failed to create the Race table... check your connection to the database: ${error.message}`)
    }


}

/**
 * Creates the RacialTrait table in the database. This should only be called if the Race table already exists.
 * @throws {DatabaseError} Thrown when there is an issue creating the table in the database.
 */
async function createRacialTraitTable() {
    const createTableCommand = `CREATE TABLE IF NOT EXISTS RacialTrait(RaceId INT, Name VARCHAR(200), Description TEXT, PRIMARY KEY(RaceId, Name), FOREIGN KEY (RaceId) REFERENCES Race(Id));`;
    try {
        await connection.execute(createTableCommand);
        logger.info(`RacialTrait table created / already exists.`);
    }
    catch (error) {
        throw new DatabaseError('raceModel', 'createRacialTraitTable', `Failed to create the RacialTrait table... check your connection to the database: ${error.message}`)
    }
}

/**
 * Populates the Race and RacialTrait tables with the data from the JSON file.
 * @throws {DatabaseError} Thrown when there is an IO issue with the database.
 */
async function populateRaceAndRacialTraitTables() {
    const dataFile = 'database-content-json/races.json';

    // Read the json file
    let racialTraitData;
    try {
        racialTraitData = JSON.parse(await fs.readFile(dataFile));
    }
    catch (error) {
        throw new DatabaseError('raceModel', 'populateRaceAndRacialTraitTables', `There was an issue reading the RacialTrait json file: ${error}`)
    }

    // Check if the table already has data in it
    let raceTableHasData = false;
    try {
        [rows, columnData] = await connection.query('SELECT * from Race;');
        raceTableHasData = rows > 0
    }
    catch (error) {
        throw new DatabaseError('raceModel', 'populateRaceAndRacialTraitTables', `Failed to read from the Race table: ${error}`);
    }

    // Only add the data if the race table doesn't already have data in it
    if (!raceTableHasData) {
        try {

            // Loop through each race in the file
            let raceId = 1;
            for (race in racialTraitData.Races) {

                // Get the list of racial traits for this race
                const racialTraits = racialTraitData.Races[race][`${race} Traits`].content;

                // Add the race to the race table
                const addRaceCommand = `INSERT INTO Race (Id, Name, Description) values(${raceId}, '${race}', '${racialTraits[0].replace(/'/g, "''")}');`;
                await connection.execute(addRaceCommand);
                logger.info(`Added ${race} to the Race table.`);

                // Add all the racial traits
                for (let i = 1; i < racialTraits.length; i++){

                    // traits are formatted as '***NAME*** DESCRIPTION', so split on *** to get 'NAME*** DESCRIPTION', then on '*** ' to split the two
                    const [name, description] = racialTraits[i].split(/^\*\*\*/)[1].split(/\*\*\* /);
                    
                    // Add the racial trait for the specific race
                    addTraitCommand = `INSERT INTO RacialTrait (RaceId, Name, Description) values(${raceId}, '${name}', '${description.replace(/'/g, "''")}');`;
                    await connection.execute(addTraitCommand);
                    logger.info(`Added the racial trait ${name} for ${race}`);
                }
                raceId++;
            }
        } catch (error) {
            throw new DatabaseError('raceModel', 'populateRaceAndRacialTraitTables', `Failed to add a race to the Rae table or a racial trait to the RacialTrait table in the database... Check the database connection: ${error}`)
        }

        logger.info('Successfully populated the Race and RacialTrait tables.')
    }

}

/**
 * Gets an array of all the races in the database. This will not include the racial traits of any of the races.
 * @returns Fullfils with an array of all the races in the database in with the following format {Id: #, Name: "", Description: ""}
 * @throws {DatabaseError} Thrown when there is an issue getting the races from the database due to a connection issue.
 */
async function getAllRaces(){
    const getRacesQuery = "SELECT Id, Name, Description FROM Race;"
    let races;
    try{
        [races, columnData] = await connection.query(getRacesQuery);
    }
    catch(error){
        throw new DatabaseError('raceModel', 'getAllRaces', `Failed to get all the races in the database: ${error}`);
    }

    return races;
}

/**
 * Gets all the details about a specific race. 
 * If the id is not a valid id, or if no race is found with the given id, an exception will be thrown.
 * A valid id is an integer which is greater than 0.
 * @param {Number} id The id of the race to get.
 * @returns Fullfils with the race with the provided id. The object contains the race id, name, description and all the racial traits. It is returned in the following structure: {Id: #, Name: "", Description: "", Traits: [{Name: "", Description: ""}, ...]}
 * @throws {InvalidInputError} Thrown if the id is invalid or if it was not found.
 * @throws {DatabaseError} Thrown is there is an issue getting the race from the database due to a connection issue.
 */
async function getRace(id){

    try{
        validationModel.validateRaceId(id);
    }
    catch(error){
        throw new InvalidInputError('raceModel', 'getRace', `Invalid input: ${error.message}`);
    }

    // Get the race details
    const getRaceQuery = `SELECT Id, Name, Description FROM Race WHERE Id = ${id};`;
    let race;
    try{
        [race, columnData] = await connection.query(getRaceQuery);
    }
    catch(error){
        throw new DatabaseError('raceModel', 'getRace', `Failed to get the race with id ${id} from the database: ${error}`);
    }
    
    // Check to make sure a race was found
    if (race.length == 0)
        throw new InvalidInputError('raceModel', 'getRace', 'A race with the provided id could not be found.')
    
    // Get the racial traits
    const getRacialTraitsQuery = `SELECT Name, Description FROM RacialTrait WHERE RaceId = ${id}`;
    let traits;
    try{
        [traits, columnData] = await connection.query(getRacialTraitsQuery);
    }
    catch(error){
        throw new DatabaseError('raceModel', 'getRace', `Failed to get the racial traits of the race with id ${id} from the database: ${error}`)
    }

    // Add the traits to the race object
    race = race[0]
    race.Traits = traits;

    return race;
}

/**
 * Closes the connection to the database.
 */
async function closeConnection(){
    try{
        connection.end()
    }
    catch(error){
        throw new DatabaseError('raceModel', 'closeConnection',`Failed to close the connection: ${error}`);
    }
}

module.exports = { initialize, getAllRaces, getRace, closeConnection}