const app = require('./app.js');
const port = 1339;
const spellModel = require('./models/spellModel');
const raceModel = require('./models/raceModel');
const classModel = require('./models/classModel');
const characterModel = require('./models/characterModel');
const userModel = require('./models/userModel');
// const characterStatisticsModel = require('./models/characterStatisticsModel');
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


async function startup() {
    try {
        await userModel.initialize(dbName, false);
        await backgroundModel.initialize(dbName, false);
        await raceModel.initialize(dbName, false);
        await classModel.initialize(dbName, false);
        await spellModel.initialize(dbName, false);
        await characterModel.initialize(dbName, false);
        try{
        await userModel.addUser('JeffBrin', 'SnoopDogg123');
        await characterModel.addCharacter(3, 1, 'sam', 55, 2, 2, 2, 2, [1, 2, 3, 4, 5, 6], [1, 2], 3, 1, 25);
        let character = await characterModel.getCharacter(1);
        console.log(character);
        await characterModel.addCharacter(1, 2, "bob", 10, 3, 3, 1, 4, [16, 9, 5, 4, 8, 9], [2], 4, 1, 7);
        let character2 = await characterModel.getCharacter(1);
        console.log(character2)
        await characterModel.addCharacter(4, 5, "jeffrey", 10, 3, 3, 1, 4, [16, 9, 5, 4, 8, 9], [2], 4, 1, 7);
        await characterModel.addCharacter(6, 3, "chase", 10, 3, 3, 1, 4, [16, 9, 5, 4, 8, 9], [2], 4, 1, 7);
        await characterModel.addCharacter(1, 4, "Emperor Ligma", 10, 3, 3, 1, 4, [16, 9, 5, 4, 8, 9], [2], 4, 1, 7);
        }
        catch(error){

        }

        // Adding test spells
        const spell = await spellModel.addSpellFromValues(1, 1, 2, 'DescRIptin', 'Jahfroys Spell', '1 action', true, true, true, 'bat guano', 'instantaneous', '1d10', '60 feet', false, false, [1, 2])
        console.log(await spellModel.getSpellsWithSpecifications(1, 1, 1, null, null, null, null, null, null, null, null, null, null));

        const updatedSpell = await spellModel.updateSpellById(spell.Id, 2, 8, 5, 'New DESCRIPTION', null, '1 year', false, false, false, null, null, '1d100', '1 universe', true, true, [1, 2, 3, 4, 5, 6]);
        console.log(updatedSpell);
    } catch (error) {
        throw error;
    }
    // Always run the server even with failed initialization
    finally {
        app.listen(port);
    }
}
