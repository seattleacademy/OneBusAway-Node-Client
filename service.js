var rest = require('restler');
var sys = require('util');
var mongo = require('mongodb');

var options = {
		parser: rest.parsers.json
};

rest.get('http://api.onebusaway.org/api/where/arrivals-and-departures-for-stop/1_68005.json?key=TEST', options).on('complete', function(data) {
	

});

