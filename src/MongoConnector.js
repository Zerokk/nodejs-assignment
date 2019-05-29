const MongoClient = require('mongodb').MongoClient;


class MongoHelper {

    constructor(url, user, pw) {
        this.MONGO_URL = url;
        this.MONGO_USER = user;
        this.MONGO_PW = pw;
        this.connection = null;
        this.connOptions = {
            useNewUrlParser: true,
            reconnectTries: 80,
            reconnectInterval: 750,
            poolSize: 10,
            bufferMaxEntries: 0
        }
    }



    async connect(dbName) {
        console.log("Trying to connect to Mongo database :", dbName);
        try {
            const connString = `mongodb://${this.MONGO_USER}:${this.MONGO_PW}@${this.MONGO_URL}:27017/${dbName}`;
            console.log(connString)
            const conn = await MongoClient.connect(connString, this.options);
            return conn;
        } catch (err) {
            console.log(">> [ERROR] MongoHelper -> connect() -- error msg: ", err);
            throw err;
        }

    }


}


exports.MongoHelper = MongoHelper;