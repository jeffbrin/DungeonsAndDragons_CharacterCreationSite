const app = require('./app.js');
const port = process.env.port || 8888;
const spellModel = require('./models/spellModel');
const raceModel = require('./models/raceModel');
const classModel = require('./models/classModel');
const characterModel = require('./models/characterModel');
const userModel = require('./models/userModel');
// const characterStatisticsModel = require('./models/characterStatisticsModel');
const backgroundModel = require('./models/backgroundModel');
const logger = require('./logger.js');

let dbName = process.argv[2];
if (!dbName)
{
    dbName = 'dnd_db';
}


startup()
    .catch(error =>
    {
        console.error(error.message);
        logger.error(error);
});


async function startup()
{
    try
    {
        await userModel.initialize(dbName, false);
        await backgroundModel.initialize(dbName, false);
        await raceModel.initialize(dbName, false);
        await classModel.initialize(dbName, false);
        await spellModel.initialize(dbName, false);
        await characterModel.initialize(dbName, false);
    } catch (error)
    {
        throw error;
    }
    // Always run the server even with failed initialization
    finally
    {
        app.listen(port);
    }
}
