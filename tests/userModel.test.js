const userModel = require('../models/userModel');
const dbName = 'dnd_db_testing'


// Initialize the database before each test.
beforeEach(async () => {
    await userModel.initialize(dbName, true);    
});

// Close the database connection after each test to prevent open handles error.
afterEach(async () => {
    await userModel.closeConnection();
});


test('addUser - Success - Returns session id', async () => {
    console.log('YES');
})