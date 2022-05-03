/**
 * Code written by chase 
 * Inspiration from jeff based on the creation of his raceModel.js implementations 
 */

const mysql = require('mysql2/promise')
const logger = require('../logger');
const fs = require('fs/promises');
const { InvalidInputError, DatabaseError } = require('./errorModel');
const { exit } = require('process');

// initialize("dnd_db_testing", true );


let connection;
/**
 * Initializes the passed database with backgrounds tables.
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
        throw new DatabaseError('backgroundModel', 'initialize', `Failed to connect to the dnd database in the docker container. Make sure the docker container is running: ${error.message}`);
    }

    // Create the tables and populate them
    await createBackgroundTable(reset);
    await createBackgroundFeatureTable();
    await populateBackgroundAndFeaturesTable();
    // console.log(await getAllBackgrounds());
    // console.log(await getBackground(1));

    // .catch(error => {throw error});
}

/**
 * Creates the background table. If the reset flag is set to true, the backgroundFeature table will be dropped but not recreated.
 * This functionality is required because the backgroundFeature table contains foreign keys from the background table.
 * @param {boolean} reset Indicates whether the tables should be if they already exist.
 * @throws {DatabaseError} Thrown when a table either failed to be dropped or failed to be created.
 */
async function createBackgroundTable(reset) {

    // Reset if the reset flag is true
    if (reset) {
        let dropQuery = `DROP TABLE IF EXISTS BackgroundFeature;`;

        // Drop the BackgrounFeature table first
        try {
            await connection.execute(dropQuery)
            logger.info(`BackgroundFeature table dropped.`);
        }
        catch (error) {
            throw new DatabaseError('backgroundModel', 'createBackgroundTable', `Failed to drop the Background Feature table in the database... check your connection to the database: ${error.message}`)
        }

        // Drop the PlayerCharacter table since it contains foreign keys in the background table
        dropQuery = `DROP TABLE IF EXISTS PlayerCharacter;`;
        try {
            await connection.execute(dropQuery)
            logger.info(`PlayerCharacter table dropped.`);
        }
        catch (error) {
            throw new DatabaseError('backgroundModel', 'createBackgroundTable', `Failed to drop the PlayerCharacter table in the database... check your connection to the database: ${error.message}`)
        }

        // Drop the Background table
        dropQuery = 'DROP TABLE IF EXISTS Background;'
        try {
            await connection.execute(dropQuery)
            logger.info(`Background table dropped.`);
        }
        catch (error) {
            throw new DatabaseError('backgroundModel', 'createBackgroundTable', `Failed to drop the Background table in the database... check your connection to the database: ${error.message}`)
        }
    }

    // Create the Background table
    const createTableQuery = `CREATE TABLE IF NOT EXISTS Background(Id INT, Name TEXT, Description TEXT, PRIMARY KEY (Id));`;
    try {
        await connection.execute(createTableQuery).then(logger.info(`Background table created / already exists.`))
    }
    catch (error) {
        throw new DatabaseError('backgroundModel', 'createBackgroundTable', `Failed to create the Background table... check your connection to the database: ${error.message}`)
    }


}

/**
 * Creates the BackgroundFeature table in the database. This should only be called if the Background table already exists.
 */
async function createBackgroundFeatureTable() {
    const createTableQuery = `CREATE TABLE IF NOT EXISTS BackgroundFeature(BackgroundId INT, Name VARCHAR(200), Description TEXT, FOREIGN KEY (BackgroundId) REFERENCES Background(Id), PRIMARY KEY (BackgroundId, Name));`;
    try {
        await connection.execute(createTableQuery).then(logger.info(`BackgroundFeature table created / already exists.`))
    }
    catch (error) {
        throw new DatabaseError('backgroundModel', 'createBackgroundFeatureTable', `Failed to create the BackgroundFeature table... check your connection to the database: ${error.message}`)
    }
}



/**
 * Populates the Background and BackgroundFeature tables with the data from the JSON file.
 * @throws {DatabaseError} Thrown when there is an IO issue with the database.
 */
async function populateBackgroundAndFeaturesTable() {
    const dataFile = 'database-content-json/backgrounds.json';

    // Read the json file
    let backgroundData;
    try {
        backgroundData = JSON.parse(await fs.readFile(dataFile));
    }
    catch (error) {
        throw new DatabaseError('backgroundModel', 'populateBackgroundAndFeaturesTable', `There was an issue reading the Backgrounds json file: ${error}`)
    }
    // Check if the table already has data in it
    let backgroundTableHasData = false;
    try {
        [rows, columnData] = await connection.query('SELECT * from Background;');
        backgroundTableHasData = rows.length > 0;
    }
    catch (error) {
        throw new DatabaseError('backgroundModel', 'populateBackgroundAndFeatureTables', `Failed to read from the Background table: ${error}`);
    }

    // Only add the data if the background table doesn't already have data in it
    if (!backgroundTableHasData) {
        try {

            // Loop through each background in the file
            let backgroundId = 1;
            for (let i = 0; i < backgroundData.length; i++) {


                // Get the list of features for this background
                //  const Backgrounds = BackgroundData;
                let name = backgroundData[i].Name;
                let desc = backgroundData[i].Description;
                let features = backgroundData[i].Features;

                // Add the background to the background table
                const addBackgroundCommand = `INSERT INTO Background (Id, Name, Description) values(${backgroundId}, '${name}', '${desc.replace(/'/g, "''")}');`;
                await connection.execute(addBackgroundCommand);
                logger.info(`Added ${name} to the Background table.`);

                // Add all the features
                for (let j = 0; j < features.length; j++) {

                    // features
                    let fName = features[j].Name;
                    let fDesc = features[j].Description;

                    // Add the background feature for the specific background
                    addFeatureCommand = `INSERT INTO BackgroundFeature (BackgroundId, Name, Description) values(${backgroundId}, '${fName.replace(/'/g, "''")}', '${fDesc.replace(/'/g, "''")}');`;
                    await connection.execute(addFeatureCommand);
                    //  logger.info(`Added the background feature ${fname} for ${name}`);
                }
                backgroundId++;
            }

        } catch (error) {
            throw new DatabaseError('backgroundModel', 'populateBackgroundAndFeatureTables', `Failed to add a background to the Background table or a feature to the BackgroundFeature table in the database... Check the database connection: ${error}`)
        }

        logger.info('Successfully populated the Background and BackgroundFeature tables.')
    }



}

/**
 * Gets an array of all the Backgrounds in the database. This will not include the Features of any of the Backgrounds.
 * @returns  with an array of all the Backgrounds in the database in with the following format {Id: #, Name: "", Description: "", Features: []}
 * @throws {DatabaseError} Thrown when there is an issue getting the Backgrounds from the database due to a connection issue.
 */
async function getAllBackgrounds() {
    const getBackgroundsQuery = "SELECT * FROM Background;"
    let data;
    try {
        data = await connection.query(getBackgroundsQuery);


    }
    catch (error) {
        throw new DatabaseError('BackgroundModel', 'getAllBackgrounds', `Failed to get all the Backgrounds in the database: ${error}`);
    }
    return data[0];

}

/**
 * Gets all the details about a specific background. 
 * If the id is not a valid id, or if no background is found with the given id, an exception will be thrown.
 * A valid id is an integer which is greater than 0.
 * @param {Number} id The id of the background to get.
 * @returns Fullfils with the background with the provided id. The object contains the background id, name, description and all the racial Features. It is returned in the following structure: {Id: #, Name: "", Description: "", Features: [{Name: "", Description: ""}, ...]}
 * @throws {InvalidInputError} Thrown if the id is invalid or if it was not found.
 * @throws {DatabaseError} Thrown is there is an issue getting the background from the database due to a connection issue.
 */
async function getBackground(id) {

    try {
        validationModel.validateBackgroundId(id);
    }
    catch (error) {
        throw new InvalidInputError('backgroundModel', 'getBackground', `Invalid input: ${error.message}`);
    }

    // Get the background details
    const getBackgroundQuery = `SELECT Id, Name, Description FROM Background WHERE Id = ${id};`;
    let background;
    try {
        [background, columnData] = await connection.query(getBackgroundQuery);
    }
    catch (error) {
        throw new DatabaseError('backgroundModel', 'getBackground', `Failed to get the background with id ${id} from the database: ${error}`);
    }

    // Check to make sure a background was found
    if (background.length == 0)
        throw new InvalidInputError('backgroundModel', 'getBackground', 'A background with the provided id could not be found.')

    // Get the racial Features
    const getBackgroundFeaturesQuery = `SELECT Name, Description FROM BackgroundFeature WHERE BackgroundId = ${id}`;
    let Features;
    try {
        [Features, columnData] = await connection.query(getBackgroundFeaturesQuery);
    }
    catch (error) {
        throw new DatabaseError('backgroundModel', 'getBackground', `Failed to get the racial Features of the background with id ${id} from the database: ${error}`)
    }

    // Add the Features to the background object
    background = background[0]
    background.Features = Features;

    return background;
}

/**
 * Closes the connection to the database.
 */
async function closeConnection() {
    try {
        connection.end()
    }
    catch (error) {
        throw new DatabaseError('backgroundModel', 'closeConnection', `Failed to close the connection: ${error}`);
    }
}
module.exports = { initialize, getAllBackgrounds, getBackground, closeConnection }
