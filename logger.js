const pino = require("pino");
const fs = require('fs');

// Create the output folder if it doesn't exist
const directory = 'logs';
if (!fs.existsSync(directory))
    fs.mkdirSync(directory);

// Create the logger
const logger = pino({
    level: 'error',
    destination: 'pino-pretty',
    options: {
        colorize: true
    }
}, pino.destination(`${ directory }/server-log.log`)
);

// Maybe used later for different loggers for testing and prod
// /**
//  * Creates a logger from the values passed.
//  * @param {String} level The level of logging (error, info, ...).
//  * @param {String} file The name of the file for logging.
//  * @returns The logger with the specified values.
//  */
// function initialize( file = 'server-log', level = 'info'){
//     return pino({level: level}, pino.destination(file));
// }

module.exports = logger;