const app = require('./app.js');
const port = 1339;
const spellModel = require('./models/spellModel');
const raceModel = require('./models/raceModel');
const characterModel = require('./models/characterModel');
const characterStatisticsModel = require('./models/characterStatisticsModel');
const logger = require('./logger.js');

let dbName = process.argv[2];
if (!dbName) {
    dbName = 'dnd_db';
} 


spellModel.initialize(dbName, false)
.then(raceModel.initialize(dbName, false))
.then(characterModel.initialize(dbName, false))
.then( async () => {
    await characterStatisticsModel.initialize(dbName);
    await characterStatisticsModel.dropTables();
    await characterStatisticsModel.createTables();
})
.then(app.listen(port))
.catch(error => {
    console.error(error.message);
    logger.error(error);
});
