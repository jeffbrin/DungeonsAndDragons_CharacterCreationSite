const raceModel = require('../models/raceModel');
const fs = require('fs/promises')
const errorModel = require('../models/errorModel')
const dbName = 'dnd_db_testing'
const racesArray = []

// Get the races array
populateRacesArrayFromJsonFile();

/**
 * Populates the racesArray from the races json file
 */
async function populateRacesArrayFromJsonFile(){
    const fileContent = JSON.parse(await fs.readFile('database-content-json/races.json'));

    for (race in fileContent.Races)
    {
        raceObject = {Name: race, Description: fileContent.Races[race][race + ' Traits'].content[0], Traits: fileContent.Races[race][race + ' Traits'].content.splice(1)}
        for(let i = 0; i < raceObject.Traits.length; i++){
            a  = raceObject.Traits[i].split(/^\*\*\*/)[1].split(/\*\*\* /);
            raceObject.Traits[i] = {Name: a[0], Description: a[1]}
        }
        raceObject.Traits.sort(compareTraits)
        racesArray.push(raceObject);
    }
}

/**
 * Compares two trait objects. Traits are compared by their name in alphabetical order.
 * https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
 * @param {Object} a A trait to be compared with another.
 * @param {Object} b A second trait to be compared.
 * @returns -1 if a is less than b, 0 if they are the same, 1 if a is greater than b.
 */
function compareTraits( a, b ) {
    if ( a.Name < b.Name ){
      return -1;
    }
    if ( a.Name > b.Name ){
      return 1;
    }
    return 0;
}

/**
 * Gets a random index for the races array.
 * @returns A number which can be used to index the races array.
 */
function getRandomIndex(){
    return Math.floor(Math.random() * racesArray.length);
    
}

// Initialize the database before each test.
beforeEach(async () => {
    await raceModel.initialize(dbName, true);    
});

// Close the database connection after each test to prevent open handles error.
afterEach(async () => {
    await raceModel.closeConnection();
});

/**
 * Returns true if the races are equal, false if they are not.
 * @param {Object} raceOne The first race to compare.
 * @param {Object} raceTwo The second race to compare.
 * @param {boolean} traitsInclued Indicates whether the traits of the race should be taken into account.
 */
function racesEqual(raceOne, raceTwo, traitsInclued){
    if (raceOne.Name != raceTwo.Name)
        return false;
    if(raceOne.Description != raceTwo.Description)
        return false;
    
    if(traitsInclued){
        for(let i = 0; i < raceOne.Traits.length; i++){
            if (raceOne.Traits[i].Name != raceTwo.Traits[i].Name)
                return false;
            if (raceOne.Traits[i].Description != raceTwo.Traits[i].Description)
                return false;
        }
    }

    return true;
}


test('getAllRaces - Success', async () =>{

    const allRaces = await raceModel.getAllRaces();

    expect(allRaces.length).toBe(racesArray.length);

    for(let i = 0; i < allRaces.length; i++){
        expect(racesEqual(allRaces[i], racesArray[i], false)).toBe(true);
    }
    
})

test('getAllRaces - Fail - Closed Database Conneciton', async () =>{

    await raceModel.closeConnection();
    await expect(raceModel.getAllRaces()).rejects.toThrow(errorModel.DatabaseError);
    
})

test('getRace - Success', async () =>{

    const index = getRandomIndex();
    const randomRaceFromDB = await raceModel.getRace(index + 1);
    const randomRace = racesArray[index]

    // Races should be the same, with the same traits
    expect(racesEqual(randomRace, randomRaceFromDB, true)).toBe(true);
    
})

test('getRace - Fail - Invalid ID (Not Positive)', async () =>{

    await expect(raceModel.getRace(0)).rejects.toThrow(errorModel.InvalidInputError);
    
})

test('getRace - Fail - Invalid ID (Is String)', async () =>{

    await expect(raceModel.getRace("Hello")).rejects.toThrow(errorModel.InvalidInputError);
    
})

test('getRace - Fail - Invalid ID (Decimal Value)', async () =>{

    await expect(raceModel.getRace(10.4)).rejects.toThrow(errorModel.InvalidInputError);
    
})

test('getRace - Fail - Closed Database Connection', async () =>{

    await raceModel.closeConnection();
    await expect(raceModel.getRace(5)).rejects.toThrow(errorModel.DatabaseError);
    
})