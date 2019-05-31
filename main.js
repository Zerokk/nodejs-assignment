const MongoHelper = require("./src/MongoConnector").MongoHelper;
const NatsInterceptor = require("./src/NatsInterceptor").NatsInterceptor;
const env = require("./environment");
const log = require("./src/LogWrapper").log;
const fork = require('child_process').fork;


// 0. Prepare the log system
require("./src/LogWrapper").initializeLogger();
log("info", ">> Starting server...");

// 1. Get DB data to which we're connecting from the environment.js file and open a connection
// with the MongoDB server.
async function initConnection() {

    try {
        // Try to connect to Mongo server
        const mongo = new MongoHelper(env.MONGO_URL, env.MONGO_USER, env.MONGO_PW);
        const connection = await mongo.connect(env.DB_NAME);
        return connection;

    } catch (err) {
        log("error", ">> [CRITICAL ERROR] Main Script -> init() -- Unable to connect to MongoDB. Check this machine's connectivity to the server.");
        throw err;
    }
}

// If the connection was well set, go forward
initConnection().then(async (conn) => {
    const interceptor = new NatsInterceptor(env.VEHICLE_LIST, conn);
  //  interceptor.interceptSave();

    // Initialize the API in a child process
    const API_process = fork('./src/API.js');

}).catch(err => {
    log("error", ">> [ERROR] Main Script -> after initConnection() -- error log: ", err);
});