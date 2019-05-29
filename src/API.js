// Project imports
const MongoHelper = require('./MongoConnector').MongoHelper;
const VehicleDataDAO = require('./VehicleDataDAO').VehicleDataDAO;
const env = require('../environment');
const initializeLogger = require('./LogWrapper').initializeLogger;
const log = require('./LogWrapper').log;


// API-related imports 
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const router = express.Router();

// Express config
const port = process.env.PORT || 8080;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Log all requests
initializeLogger();
router.use((req, res, next) => {
    log('verbose', `>> Request from ${req.ip} to url ${req.url}.`);
    next(); // make sure we go to the next routes and don't stop here
});

// Connect to Mongo an instantiate the DAO
const mongo = new MongoHelper(env.MONGO_URL, env.MONGO_USER, env.MONGO_PW);
mongo.connect(env.DB_NAME)
    .then(connection => {
        const dao = new VehicleDataDAO(connection);
        router.route('/vehicle_data')
            // Get all
            .get(async (req, res) => {
                const result = await dao.getAll();
                res.send(result);
            })
            // Save one registry
            .post(async (req, res) => {
                const vehicleName = req.body.vehicleName;
                const registry = req.body.registry;
                dao.validate(registry)
                    ? dao.saveForVehicle(vehicleName, registry)
                    : res.send("Wrong data format");
            });

        router.route('/vehicle_data/:vehicle_id')
            // Get registries for a given single vehicle
            .get(async (req, res) => {
                const vehicleName = req.params.vehicleName;
                return await dao.getForVehicle(vehicleName);
            })
            // Update a registry
            .put(async (req, res) => {

            });

        // Open the API to the external network
        app.use("/api", router);
        app.listen(port);
    });




