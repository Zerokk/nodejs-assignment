const log = require('./LogWrapper').log;



// This class will handle all the logic related to saving VehicleData objects
class VehicleDataDAO {

    constructor(mongoConnection) {
        this.mongoConnection = mongoConnection;
    }



    // Returns all the data for a given vehicle name (which is a collection).
    async getForVehicle(vehicleName, limit) {
        try {
            const query = this.mongoConnection
                .db("storage")
                .collection(vehicleName)
                .find()
                .sort({"time": 1})
                
            return limit ? await query.limit(50).toArray() : await query.toArray();;
        } catch (err) {
            log("error", ">> ERROR [VehicleDataDAO] -> getForVehicle() -- mongo error message: ", err)
            return false;
        }
    }

    // Reads all collections, as every one is a vehicle, and returns them as an array of vehicle names and their stored values
    async getAll() {
        const collections = await this.mongoConnection
            .db("storage")
            .listCollections()
            .toArray();

        const vehiclesNames = collections.map(col => col.name);
        return await Promise.all(vehiclesNames.map(async (name) => {
            const data = await this.getForVehicle(name, true);
            return {
                vehicleName: name,
                data: data
            }
        }));


    }

    async saveForVehicle(vehicleName, data) {
        try {
            await this.mongoConnection
                .db("storage")
                .collection(vehicleName)
                .insertOne(data);
            return true;
        } catch (err) {
            log("error", ">> ERROR [VehicleDataDAO] -> saveForVehicle() -- mongo error message: ", err)
            return false;
        }

    }

    async updateRegistryForVehicle(vehicleName, registryId, data) {
        try {
            console.log("vehicleName ", vehicleName);
            console.log("registryId", registryId);
            await this.mongoConnection
                .db("storage")
                .collection(vehicleName)
                .updateOne({ "_id": registryId },  { $set: {
                    time: data.time,
                    energy: data.energy,
                    gps: data.gps,
                    odo: data.odo,
                    speed: data.speed
                }});
            return true;
        } catch (err) {
            log("error", ">> ERROR [VehicleDataDAO] -> updateRegistryForVehicle() -- mongo error message: ", err)
            return false;
        }

    }

    async removeRegistryForVehicle(vehicleName, registryId) {
        try {

            await this.mongoConnection
                .db("storage")
                .collection(vehicleName)
                .remove({ _id: registryId });
            return true;
        } catch (err) {
            log("error", ">> ERROR [VehicleDataDAO] -> removeRegistryForVehicle() -- mongo error message: ", err)
            return false;
        }

    }

    // Very arcaic and oversimplified method for validating an externally incoming registry of vehicle's activity.
    validate(registry) {
        if (
            !isNaN(registry.time) &&
            registry.gps.indexOf("|") != -1 &&
            !isNaN(registry.odo) &&
            !isNaN(registry.speed) &&
            !isNaN(registry.soc)) {
            return true;
        } else {
            return false;
        }
    }



}

exports.VehicleDataDAO = VehicleDataDAO;