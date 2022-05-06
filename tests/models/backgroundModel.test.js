const backgroundModel = require('../../models/backgroundModel');
const fs = require('fs/promises')
const errorModel = require('../../models/errorModel')
const dbName = 'dnd_db_testing'
const backgroundsArray = []

// Get the backgrounds array
populateBackgroundsArrayFromJsonFile();

/**
 * Populates the backgroundsArray from the backgrounds json file
 */
async function populateBackgroundsArrayFromJsonFile(){
    
    backgroundData = JSON.parse(await fs.readFile('database-content-json/backgrounds.json'));
     // Loop through each background in the file
     
     for(let i = 0; i < backgroundData.length; i++){
        
        let backgroundObject = {Name: backgroundData[i].Name, Description: backgroundData[i].Description, Features: []}
        let features = backgroundData[i].Features;
         for (let j = 0; j < features.length; j++){
            backgroundObject.Features.push(features[j])
         }
         backgroundObject.Features.sort(compareFeatures)
         backgroundsArray.push(backgroundObject);
        }
}

/**
 * Compares two feature objects. Features are compared by their name in alphabetical order.
 * https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
 * @param {Object} a A feature to be compared with another.
 * @param {Object} b A second feature to be compared.
 * @returns -1 if a is less than b, 0 if they are the same, 1 if a is greater than b.
 */
function compareFeatures( a, b ) {
    if ( a.Name < b.Name ){
      return -1;
    }
    if ( a.Name > b.Name ){
      return 1;
    }
    return 0;
}

/**
 * Gets a random index for the backgrounds array.
 * @returns A number which can be used to index the backgrounds array.
 */
function getRandomIndex(){
    return Math.floor(Math.random() * backgroundsArray.length);
    
}

// Initialize the database before each test.
beforeEach(async () => {
    console.log("about to init")
    await backgroundModel.initialize(dbName, true);    
});

// Close the database connection after each test to prevent open handles error.
afterEach(async () => {
    await backgroundModel.closeConnection();
});

/**
 * Returns true if the backgrounds are equal, false if they are not.
 * @param {Object} backgroundOne The first background to compare.
 * @param {Object} backgroundTwo The second background to compare.
 * @param {boolean} featuresInclued Indicates whether the features of the background should be taken into account.
 */
function backgroundsEqual(backgroundOne, backgroundTwo, featuresIncluded){
    if (backgroundOne.Name != backgroundTwo.Name)
        return false;
    if(backgroundOne.Description != backgroundTwo.Description)
        return false;
    
    if(featuresIncluded){
        for(let i = 0; i < backgroundOne.Features.length; i++){
            if (backgroundOne.Features[i].Name != backgroundTwo.Features[i].Name)
                return false;
            if (backgroundOne.Features[i].Description != backgroundTwo.Features[i].Description)
                return false;
        }
    }

    return true;
}


test('getAllBackgrounds - Success', async () =>{

    const allBackgrounds = await backgroundModel.getAllBackgrounds();

    expect(allBackgrounds.length).toBe(backgroundsArray.length);

    for(let i = 0; i < allBackgrounds.length; i++){
        expect(backgroundsEqual(allBackgrounds[i], backgroundsArray[i], false)).toBe(true);
    }
    
})

test('getAllBackgrounds - Fail - Closed Database Conneciton', async () =>{

    await backgroundModel.closeConnection();
    await expect(backgroundModel.getAllBackgrounds()).rejects.toThrow(errorModel.DatabaseError);
    
})

test('getBackground - Success', async () =>{

    const index = getRandomIndex();
    const randomBackgroundFromDB = await backgroundModel.getBackground(index + 1);
    const randomBackground = backgroundsArray[index]

    // Backgrounds should be the same, with the same features
    expect(backgroundsEqual(randomBackground, randomBackgroundFromDB, true)).toBe(true);
    
})

test('getBackground - Fail - Invalid ID (Not Positive)', async () =>{

    await expect(backgroundModel.getBackground(0)).rejects.toThrow(errorModel.InvalidInputError);
    
})

test('getBackground - Fail - Invalid ID (Is String)', async () =>{

    await expect(backgroundModel.getBackground("Hello")).rejects.toThrow(errorModel.InvalidInputError);
    
})

test('getBackground - Fail - Invalid ID (Decimal Value)', async () =>{

    await expect(backgroundModel.getBackground(10.4)).rejects.toThrow(errorModel.InvalidInputError);
    
})

test('getBackground - Fail - Closed Database Connection', async () =>{

    await backgroundModel.closeConnection();
    await expect(backgroundModel.getBackground(5)).rejects.toThrow(errorModel.DatabaseError);
    
})