const app = require('./app.js');
const port = 1339;
const spellModel = require('./models/spellModel');
const raceModel = require('./models/raceModel');
const classModel = require('./models/classModel');
const characterModel = require('./models/characterModel');
const backgroundModel = require('./models/backgroundModel');
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

async function startup() {
    try {
        await userModel.initialize(dbName, true);
        await spellModel.initialize(dbName, false)
        await backgroundModel.initialize(dbName, false);
        await raceModel.initialize(dbName, false);
        await classModel.initialize(dbName, false);
        await characterModel.initialize(dbName, false);
        await userModel.addUser('anderson', 'Anderson514');
        await characterModel.addCharacter(1, 1, 'sam', 22, 1, 1, 1, 1, [0, 0, 0, 0, 0, 0], [1, 3], 2, 1);
    } catch (error) {
        throw error;
    }
    // Always run the server even with failed initialization
    finally {
        app.listen(port);
    }
}
