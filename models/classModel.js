const mysql = require('mysql2/promise')
const validationModel = require('./validateClassUtils')
const logger = require('../logger');
const fs = require('fs/promises');
const { InvalidInputError, DatabaseError } = require('./errorModel');
const console = require('console');

// initialize("dnd_db_testing", true);

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
        throw new DatabaseError('ClassModel', 'initialize', `Failed to connect to the dnd database in the docker container. Make sure the docker container is running: ${error.message}`);
    }

    // Create the tables and populate them
    await createClassTable(connection, reset);
    await createClassFeatureTable();
    await populateClassAndClassFeatureTables();

    // console.log(await getAllClasses());
    // console.log(await getClass(1));
}

/**
 * Creates the Class table. If the reset flag is set to true, the ClassFeature table will be dropped but not recreated.
 * This functionality is required because the ClassFeature table contains foreign keys from the Class table.
 * @param {boolean} reset Indicates whether the tables should be if they already exist.
 * @throws {DatabaseError} Thrown when a table either failed to be dropped or failed to be created.
 */
async function createClassTable(reset) {

    // Reset if the reset flag is true
    if (reset) {
        let dropCommand = `DROP TABLE IF EXISTS ClassFeature;`;

        // Drop the ClassFeature table first
        try {
            await connection.execute(dropCommand);
            logger.info(`ClassFeature table dropped.`);
        }
        catch (error) {
            throw new DatabaseError('ClassModel', 'createClassTable', `Failed to drop the ClassFeature table in the database... check your connection to the database: ${error.message}`)
        }

        

        // Drop the ClassPermittedSpell table first
        dropCommand = `DROP TABLE IF EXISTS ClassPermittedSpell;`;
        try {
            await connection.execute(dropCommand);
            logger.info(`ClassPermittedSpell table dropped.`);
        }
        catch (error) {
            throw new DatabaseError('classModel', 'createClassTable', `Failed to drop the ClassPermittedSpell table in the database... check your connection to the database: ${error.message}`)
        }

        // Drop the PlayerCharacter table since it contains foreign keys in the Class table
        dropCommand = `DROP TABLE IF EXISTS PlayerCharacter;`;
        try {
            await connection.execute(dropCommand);
            logger.info(`PlayerCharacter table dropped.`);
        }
        catch (error) {
            throw new DatabaseError('ClassModel', 'createClassTable', `Failed to drop the PlayerCharacter table in the database... check your connection to the database: ${error.message}`)
        }

        // Drop the Class table
        dropCommand = 'DROP TABLE IF EXISTS Class;'
        try {
            await connection.execute(dropCommand);
            logger.info(`Class table dropped.`);
        }
        catch (error) {
            throw new DatabaseError('ClassModel', 'createClassTable', `Failed to drop the Class table in the database... check your connection to the database: ${error.message}`)
        }
    }

    // Create the Class table
    const createTableCommand = `CREATE TABLE IF NOT EXISTS Class(Id INT, Name TEXT, HitDie TEXT, PRIMARY KEY (Id));`;
    try {
        await connection.execute(createTableCommand);
        logger.info(`Class table created / already exists.`);
    }
    catch (error) {
        throw new DatabaseError('ClassModel', 'createClassTable', `Failed to create the Class table... check your connection to the database: ${error.message}`)
    }


}

/**
 * Creates the ClassFeature table in the database. This should only be called if the Class table already exists.
 * @throws {DatabaseError} Thrown when there is an issue creating the table in the database.
 */
async function createClassFeatureTable() {
    const createTableCommand = `CREATE TABLE IF NOT EXISTS ClassFeature(ClassId INT, Name VARCHAR(200), Description TEXT, Level INT, FOREIGN KEY (ClassId) REFERENCES Class(Id), PRIMARY KEY (ClassId, Name, Level));`;
    try {
        await connection.execute(createTableCommand);
        logger.info(`ClassFeature table created / already exists.`);
    }
    catch (error) {
        throw new DatabaseError('ClassModel', 'createClassFeatureTable', `Failed to create the ClassFeature table... check your connection to the database: ${error.message}`)
    }
}

/**
 * Populates the Class and ClassFeature tables with the data from the JSON file.
 * @throws {DatabaseError} Thrown when there is an IO issue with the database.
 */
async function populateClassAndClassFeatureTables() {
    const dataFile = 'database-content-json/classes.json';
    const MAXLEVEL = 20;
    // Read the json file
    let ClassData;
    try {
        ClassData = JSON.parse(await fs.readFile(dataFile));
    }
    catch (error) {
        throw new DatabaseError('ClassModel', 'populateClassAndClassFeatureTables', `There was an issue reading the ClassFeature json file: ${error}`)
    }

    // Check if the table already has data in it
    let ClassTableHasData = false;
    try {
        [rows, columnData] = await connection.query('SELECT * from Class;');
        ClassTableHasData = rows > 0;
        
    }
    catch (error) {
        throw new DatabaseError('ClassModel', 'populateClassAndClassFeatureTables', `Failed to read from the Class table: ${error}`);
    }
    
    // Only add the data if the Class table doesn't already have data in it
    if (!ClassTableHasData) {
        try {

            

            // Loop through each Class in the file
            let ClassId = 1;
    for (Class in ClassData) {
        classFeatures = ClassData[Class]["Class Features"];
        let HitDie = ClassData[Class]["Class Features"]["Hit Points"].content[0].split(' ')[2];
        // Get the list of class Features for this Class
         
        let classLevelTable;

        //get current class table for levels
        for(cFeatures in classFeatures){
            if(cFeatures == "The " + Class){
               
                if(classFeatures[cFeatures].content != null){
                    for(let i = 0; i < classFeatures[cFeatures].content.length; i++){
                        if(classFeatures[cFeatures].content[i].table != null){
                            classLevelTable = classFeatures[cFeatures].content[i].table.Features;
                        }
                    }
                }else {
                    
                    classLevelTable = classFeatures[cFeatures].table.Features;
                }
                
            }
        }

        // console.log(classLevelTable);
         // Add the Class to the Class table
        const addClassCommand = `INSERT INTO Class (Id, Name, HitDie) values(${ClassId}, '${Class}', '${HitDie}');`;
        await connection.execute(addClassCommand);
        logger.info(`Added ${Class} to the Class table.`);
        
        // Add all the class Features
        for(cFeatures in classFeatures){
            if(cFeatures == "content" || cFeatures == "Hit Points"){
                continue;
            }
            if(cFeatures == "The " + Class){
                continue;
            }
            let cFeatureName = cFeatures
            let cFeatureDesc;
            let cFeatureLevel = [];
            let addFeatureCommand;
            if(classFeatures[cFeatures].content == null){
                cFeatureDesc =ReduceArrayToString(classFeatures[cFeatures])
            }else{
                cFeatureDesc = ReduceArrayToString(classFeatures[cFeatures].content)
            }
            for(let j = 0; j < classLevelTable.length; j++){
                
                if(classLevelTable[j].includes(cFeatures)){
                    cFeatureLevel.push(j+1);
                }
            }

            // console.log(ClassId);
            // console.log(cFeatures);
            // console.log(cFeatureDesc);
            // console.log(cFeatureLevel);
            
            if(cFeatureLevel.length == 0){
                cFeatureLevel[0] = 1 
                addFeatureCommand = `INSERT INTO ClassFeature (ClassId, Name, Description, Level) values(${ClassId}, '${cFeatures}', '${cFeatureDesc.replace(/'/g, "''")}', 1);`;
                await connection.execute(addFeatureCommand);
            }else{
                
                for(let k = 0; k < cFeatureLevel.length; k++){
                    addFeatureCommand = `INSERT INTO ClassFeature (ClassId, Name, Description, Level) values(${ClassId}, '${cFeatures}', '${cFeatureDesc.replace(/'/g, "''")}', ${cFeatureLevel[k]});`;
                    await connection.execute(addFeatureCommand);
            
                }
            }
            
        }
        ClassId++;
        
    }
        } catch (error) {
            throw new DatabaseError('ClassModel', 'populateClassAndClassFeatureTables', `Failed to add a Class to the Class table or a class feature to the ClassFeature table in the database... Check the database connection: ${error}`)
        }

        logger.info('Successfully populated the Class and ClassFeature tables.')
    }

}

/**
 * Concatenates an array of strings onto one singular string
 * @param {*} array 
 * @returns string
 */
function ReduceArrayToString(array){
   if(typeof array == "string"){
        return array + "\n";
   }
    return array.reduce((current, next) => {
        return current + ReduceArrayToString(next);
    },"");
    

   
}


/**
 * Gets an array of all the Classes in the database. This will not include the class Features of any of the Classes.
 * @returns Fullfils with an array of all the Classes in the database in with the following format {Id: #, Name: "", Description: ""}
 * @throws {DatabaseError} Thrown when there is an issue getting the Classes from the database due to a connection issue.
 */
async function getAllClasses(){
    const getClassesQuery = "SELECT Id, Name, HitDie FROM Class;"
    let Classes;
    try{
        [Classes, columnData] = await connection.query(getClassesQuery);
    }
    catch(error){
        throw new DatabaseError('ClassModel', 'getAllClasses', `Failed to get all the Classes in the database: ${error}`);
    }

    return Classes;
}

/**
 * Gets all the details about a specific Class. 
 * If the id is not a valid id, or if no Class is found with the given id, an exception will be thrown.
 * A valid id is an integer which is greater than 0.
 * @param {Number} id The id of the Class to get.
 * @returns Fullfils with the Class with the provided id. The object contains the Class id, name, description and all the class Features. It is returned in the following structure: {Id: #, Name: "", Description: "", Traits: [{Name: "", Description: ""}, ...]}
 * @throws {InvalidInputError} Thrown if the id is invalid or if it was not found.
 * @throws {DatabaseError} Thrown is there is an issue getting the Class from the database due to a connection issue.
 */
async function getClass(id){

    try{
        validationModel.validateClassId(id);
    }
    catch(error){
        throw new InvalidInputError('ClassModel', 'getClass', `Invalid input: ${error.message}`);
    }

    // Get the Class details
    const getClassQuery = `SELECT Id, Name, HitDie FROM Class WHERE Id = ${id};`;
    let Class;
    try{
        [Class, columnData] = await connection.query(getClassQuery);
    }
    catch(error){
        throw new DatabaseError('ClassModel', 'getClass', `Failed to get the Class with id ${id} from the database: ${error}`);
    }
    
    // Check to make sure a Class was found
    if (Class.length == 0)
        throw new InvalidInputError('ClassModel', 'getClass', 'A Class with the provided id could not be found.')
    
    // Get the class Features
    const getClassFeaturesQuery = `SELECT Name, Description, Level FROM ClassFeature WHERE ClassId = ${id}`;
    let features;
    try{
        [features, columnData] = await connection.query(getClassFeaturesQuery);
    }
    catch(error){
        throw new DatabaseError('ClassModel', 'getClass', `Failed to get the class Features of the Class with id ${id} from the database: ${error}`)
    }

    // Add the features to the Class object
    Class.Features = features;

    return Class;
}

/**
 * Closes the connection to the database.
 */
 async function closeConnection(){
    try{
        connection.end()
    }
    catch(error){
        throw new DatabaseError('classModel', 'closeConnection',`Failed to close the connection: ${error}`);
    }
}
module.exports = { initialize, getAllClasses, getClass, closeConnection}
