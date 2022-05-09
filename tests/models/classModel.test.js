const classModel = require('../../models/classModel');
const fs = require('fs/promises')
const errorModel = require('../../models/errorModel')
const dbName = 'dnd_db_testing'
const classesArray = [];

// Get the classes array
populateClassesArrayFromJsonFile();

/**
 * Populates the classesArray from the classes json file
 */
async function populateClassesArrayFromJsonFile(){
    const ClassData = JSON.parse(await fs.readFile('database-content-json/classes.json'));
    // Loop through each Class in the file
    let ClassId = 1;
    for (Class in ClassData) {
        classFeatures = ClassData[Class]["Class Features"];
        let HitDie = ClassData[Class]["Class Features"]["Hit Points"].content[0].split(' ')[2];
        // Get the list of class Features for this Class
        classObject = {"Name": Class, "Hitdie": HitDie}

        // classObject.Traits.sort(compareTraits)
        classesArray.push(classObject);
        
        ClassId++;
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
 * Gets a random index for the classes array.
 * @returns A number which can be used to index the classes array.
 */
function getRandomIndex(){
    return Math.floor(Math.random() * classesArray.length);
    
}

// Initialize the database before each test.
beforeEach(async () => {
    await classModel.initialize(dbName, true);    
});

// Close the database connection after each test to prevent open handles error.
afterEach(async () => {
    await classModel.closeConnection();
});

/**
 * Returns true if the classes are equal, false if they are not.
 * @param {Object} classOne The first class to compare.
 * @param {Object} classTwo The second class to compare.
 * @param {boolean} traitsInclued Indicates whether the traits of the class should be taken into account.
 */
function classesEqual(classOne, classTwo, traitsInclued){
    if (classOne.Name != classTwo.Name)
        return false;
    if(classOne.Description != classTwo.Description)
        return false;

    return true;
}


test('getAllClasses - Success', async () =>{

    const allClasses = await classModel.getAllClasses();

    expect(allClasses.length).toBe(classesArray.length);

    for(let i = 0; i < allClasses.length; i++){
        expect(classesEqual(allClasses[i], classesArray[i], false)).toBe(true);
    }
    
})

test('getAllClasses - Fail - Closed Database Conneciton', async () =>{

    await classModel.closeConnection();
    await expect(classModel.getAllClasses()).rejects.toThrow(errorModel.DatabaseError);
    
})

test('getClass - Success', async () =>{

    const index = getRandomIndex();
    const randomClassFromDB = await classModel.getClass(index + 1);
    const randomClass = classesArray[index]

    // Classes should be the same, with the same traits
    expect(classesEqual(randomClass, randomClassFromDB[0], true)).toBe(true);
    
})

test('getClass - Fail - Invalid ID (Not Positive)', async () =>{

    await expect(classModel.getClass(0)).rejects.toThrow(errorModel.InvalidInputError);
    
})

test('getClass - Fail - Invalid ID (Is String)', async () =>{

    await expect(classModel.getClass("Hello")).rejects.toThrow(errorModel.InvalidInputError);
    
})

test('getClass - Fail - Invalid ID (Decimal Value)', async () =>{

    await expect(classModel.getClass(10.4)).rejects.toThrow(errorModel.InvalidInputError);
    
})

test('getClass - Fail - Closed Database Connection', async () =>{

    await classModel.closeConnection();
    await expect(classModel.getClass(5)).rejects.toThrow(errorModel.DatabaseError);
    
})