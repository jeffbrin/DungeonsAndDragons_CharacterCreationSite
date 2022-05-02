const app = require('./app.js');
const port = 1339;
const spellModel = require('./models/spellModel');
const raceModel = require('./models/raceModel');
const characterModel = require('./models/characterModel');
const backgroundModel = require('./models/backgroundModel');
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
    try{
    await spellModel.initialize(dbName, false)
    await backgroundModel.initialize(dbName, false);
    await raceModel.initialize(dbName, false)
    await characterModel.initialize(dbName, false)
    }catch(error){
        throw error;
    }
    // Always run the server even with failed initialization
    finally{
        app.listen(port)
    }
}
