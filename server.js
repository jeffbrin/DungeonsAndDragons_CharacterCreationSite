const app = require('./app.js');
const port = 1339;
const spellModel = require('./models/spellModel');
const raceModel = require('./models/raceModel');
const characterModel = require('./models/characterModel');
const userModel = require('./models/userModel');
const logger = require('./logger.js');

let dbName = process.argv[2];
if (!dbName) {
    dbName = 'dnd_db';
} 


startup()
.catch(error => {
    console.error(error.message);
    logger.error(error);
});

async function startup(){
    await userModel.initialize(dbName, false)
    await spellModel.initialize(dbName, false)
    await raceModel.initialize(dbName, false)
    await characterModel.initialize(dbName, false)
    app.listen(port)
}
