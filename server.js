const app = require('./app.js');
const port = 1339;
const model = require('./models/spellModel.js');

let dbName = process.argv[2];
if (!dbName) {
    dbName = 'dnd_db';
} model.initialize(dbName, false)
    .then(
        app.listen(port) // Run the server
    );
