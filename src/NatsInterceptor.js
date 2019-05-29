const NATS = require("nats");
const VehicleDataDAO = require("./VehicleDataDAO").VehicleDataDAO;
const log = require('./LogWrapper').log;


// This class is designed to intercept the NATS stream and save the data in MongoDB
class NatsInterceptor {

    constructor(vehicles, mongoConnection, options) {
        this.PREFIX = "vehicle.";
        this.vehicles = vehicles;
        this.mongoConnection = mongoConnection;
        this.erroredRequests = [];  // Errored requests will be saved here
        this.savingErroredRequests = false;
        this.nats = null;
        this.dao = null;
        this.correctRequests = 0;  // Just for testing purposes
    }



    // Sets all the subscriptions for every given vehicle, and attaches them to the handler.
    start() {
        this.nats = NATS.connect({ json: true });
        this.dao = new VehicleDataDAO(this.mongoConnection);;

        try {
            this.vehicles.forEach(vehicleName => {
                const id = this.nats.subscribe(this.PREFIX + vehicleName,
                    (data) => this.handler(vehicleName, data)
                );
                log('info', `>> [NatsInterceptor] -> start() -- Subscribed to ${vehicleName} with id ${id}`)
            });
        }catch(err){
            log('error', '>> ERROR [NatsInterceptor] -> start() -- Could not connect to NATS; check NATS connection.`')
        }
    }



    // The handler not only tries to save every object, but also takes in account if the data is being correctly saved
    // and tries to retry the errored requests in the case they don't.
    async handler(vehicleName, data) {
        const result = await this.dao.saveForVehicle(vehicleName, data);

        if (!result) {
            // If the registry couldn't be stored, save it in the errored requests array.
            this.erroredRequests.push({ vehicleName: vehicleName, data: data });
            if (!this.savingErroredRequests) {
                // If the retry protocol isn't already working, start it
                this.savingErroredRequests = true;
                this.retryErroredRequests();
                log('error', `>> ERROR [NatsInterceptor] -> handler() -- A registry has failed being saved. Retry protocol activated.`);
            }
        } else {
            // Just for testing purposes
            this.correctRequests++;
            if (this.correctRequests % 50 == 0) {
                log("info", ">> Saved " + this.correctRequests + " requests.")
            }
        }
    }


    // This method will try to save all errored requests until the array holding them has been emptied.
    retryErroredRequests() {
        let interval = setInterval(() => {
            this.erroredRequests.forEach((req, i, arr) => {
                // Check whether the saving method is actually working
                if (this.dao.saveForVehicle(req.vehicleName, req.data)) {
                    arr.splice(i, 1);
                    // If finished, clear interval
                    if (arr.length == 0) {
                        this.savingErroredRequests = false;
                        log('info', `>> INFO [NatsInterceptor] -> retryErroredRequests() -- All stranded registries have been correctly saved; shutting down retry protocol.`);
                        clearInterval(interval);
                    }
                }
            });
        }, 750)
    }

}

exports.NatsInterceptor = NatsInterceptor;