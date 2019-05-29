const winston = require("winston");
const winstonRotator = require('winston-daily-rotate-file');

let logger; 


// This function initializes the Winston library so it can log two types of files: the error file which only contains errors, and 
// the combined logs file, which contains also the info logs.

// For the sake of testing, a few errors have been forced to see them in the logs.
function initializeLogger() {
    logger = winston.createLogger({
        level: 'info',
        format: winston.format.simple(),
        defaultMeta: { service: 'user-service' },
        transports: [
            new winston.transports.File({ filename: 'error.log', level: 'error' }),
            new winston.transports.File({ filename: 'combined-logs.log', level: 'info' }),
            new winston.transports.File({ filename: 'verbose.log', level: 'verbose' })
        ]
    });

    if (process.env.NODE_ENV !== 'production') {
        logger.add(new winston.transports.Console({
            format: winston.format.simple()
        }));
    }
}

function log(type, msg) {
    logger ? logger.log(type, msg) : console.log("Call the function 'initializeLogger()' first!");
}



exports.initializeLogger = initializeLogger;
exports.log = log;
