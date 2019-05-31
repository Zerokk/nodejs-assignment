// Project imports
const MongoHelper = require('./MongoConnector').MongoHelper;
const VehicleDataDAO = require('./VehicleDataDAO').VehicleDataDAO;
const env = require('../environment');
const initializeLogger = require('./LogWrapper').initializeLogger;
const log = require('./LogWrapper').log;
const NatsInterceptor = require('./NatsInterceptor').NatsInterceptor;


// API-related imports 
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const router = express.Router();
const http = require('http').Server(app);
const io = require('socket.io')(http);


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

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/webapp/index.html');
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
                if (dao.validate(registry)) {
                    const result = dao.saveForVehicle(vehicleName, registry);
                    res.send(result);
                } else {
                    res.send(false);
                }
            });

        router.route('/vehicle_data/:vehicle_id')
            // Get registries for a given single vehicle
            .get(async (req, res) => {
                const vehicleName = req.params.vehicleName;
                const result = await dao.getForVehicle(vehicleName, false);
                res.send(result);
            })
            // Update a registry
            .put(async (req, res) => {
                const vehicleName = req.body.vehicleName;
                const registryId = req.body.registryId;
                const data = req.body.newData;
                const result = await dao.updateRegistryForVehicle(vehicleName, registryId, data);
                res.send(result);



            })
            // Delete a registry
            .delete(async (req, res) => {
                const vehicleName = req.params.vehicleName;
                const registryId = req.params.registryId;
                const result = await dao.removeRegistryForVehicle(vehicleName, registryId);
                res.send(result);
            });


        // Also define Websocket
        try {
            const natsInterceptor = new NatsInterceptor(env.VEHICLE_LIST, connection)
            io.on("connection", (socket) =>
                natsInterceptor.interceptEmit(socket)
            );
        } catch (err) {
            console.log("ERROR: ", err);
        }

        // Open the API to the external network
        app.use("/api", router);
        http.listen(port);
    });




