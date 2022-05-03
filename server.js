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
.then(() => raceModel.initialize(dbName, false))
.then( async () => {
    await characterStatisticsModel.initialize(dbName);
    await characterStatisticsModel.dropTables();
    await characterStatisticsModel.createTables();
})
.then( () => characterModel.initialize(dbName, false))
.then( async () => await characterModel.addCharacter(1,1, 'sam',22,1,1,1,1,[0,0,0,0,0,0],[1,3],2,1))
.then( () => app.listen(port))
.catch(error => {
    console.error(error.message);
    logger.error(error);
});
