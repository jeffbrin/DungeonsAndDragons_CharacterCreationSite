const pino = require("pino");
const logger = pino({
    level: 'info',
    destination: 'pino-pretty',
    options: {
        colorize: true
    }
}, pino.destination('logs/server-log')
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

module.exports = logger