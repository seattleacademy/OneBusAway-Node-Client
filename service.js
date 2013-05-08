// Dependencies
var rest = require('restler');
var mongo = require('mongodb');
var config = require('./config');

// Constants
var OBA_API_URL = 'http://api.onebusaway.org/api/where/';
var OBA_KEY = 'key=TEST';
var OBA_URL_FACTORY = {
    /**
     * @return {string}
     */
    arrivalsAndDepartures: function(stopId) {
        return OBA_API_URL + 'arrivals-and-departures-for-stop/' + stopId + '.json?' + OBA_KEY;
    }
};
var OPTIONS = {
		parser: rest.parsers.json
};
var DB = new mongo.Db(config.databaseName, new mongo.Server(config.databaseHost, config.databasePort));
DB.open(function(err, db) {console.log(err); });

var THREAD_POOL = [];

// Core logic
config.stopIds.forEach(function(stopId) {
    var thread = setInterval(function() {
        rest.get(OBA_URL_FACTORY.arrivalsAndDepartures(stopId), OPTIONS).on('complete', function(data) {
            DB.collection('stops', function(err, collection) {
                collection.insert(data, {safe: true}, function(err, records) {
                    console.log(err);
                    console.log(JSON.stringify(records));
                });
            });
        });
    }, config.refreshInterval);

    THREAD_POOL.push(thread);
});



