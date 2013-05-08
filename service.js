// Dependencies
var rest = require('restler');
var mongo = require('mongodb');
var config = require('./config');
var express = require('express');

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
var DB;

mongo.Db.connect(
    process.env.MONGOLAB_URI ||
    process.env.MONGOLAB_URL ||
    'mongodb://' + config.databaseHost + '/' + config.databaseName,
    function(err, db) {
        if(err) console.error(err);
        DB = db;
    }
);

var THREAD_POOL = [];

// Core logic
config.stopIds.forEach(function(stopId) {
    var thread = setInterval(function() {
        rest.get(OBA_URL_FACTORY.arrivalsAndDepartures(stopId), OPTIONS).on('complete', function(data) {
            DB.collection('stops', function(err, collection) {
                collection.insert(data, {safe: true}, function(err, records) {
                    if(!err) {
                        console.log("Successfully inserted records.");
                    }
                });
            });
        });
    }, config.refreshInterval);

    THREAD_POOL.push(thread);
});

// Client
var app = express();
app.get('/', function(req, res) {
    DB.collection('stops', function(err, collection) {
        collection.find({}, {currentTime: 1, 'data.arrivalsAndDepartures': 1}).toArray(function(err, items) {
            res.send(constructDeltaArray(items));
        });
    });
});

var constructDeltaArray = function(array) {
    var normalized = {};
    array.forEach(function(element) {
        var deltas = [];
        element.data.arrivalsAndDepartures.forEach(function(arrivalAndDeparture){
            if (arrivalAndDeparture.scheduledArrivalTime != arrivalAndDeparture.predictedArrivalTime) {
                deltas.push(
                    Math.abs(arrivalAndDeparture.scheduledArrivalTime - arrivalAndDeparture.predictedArrivalTime) / 1000
                );
            }
        });
        normalized[element.currentTime] = deltas;
    });
    return normalized;
};

app.listen(process.env.PORT || config.client.port);



