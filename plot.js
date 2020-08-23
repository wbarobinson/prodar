// const os = require('os');
// const path = require('path');

//require('dotenv').config({path: path.resolve(os.homedir(), '.env.twitter')});
const PLOTLY_API= "1QIeQ64d1ovLY5OggTdv"
const PLOTLY_USER= "tony-goss"

var plotly = require('plotly')(PLOTLY_USER,PLOTLY_API)
var fs = require('fs');

const util = require('util');

// const test1 = require('./test.js')

// test1.test();

// clean_coords is a list of lat/long pairs
async function makePlot(clean_coords) {
	lats = [];
	longs = [];
	total_long = 0;
	total_lat = 0;

	// Split place array into lat/long and sum for centroid
	clean_coords.forEach(function (coord,index) {
		longs.push(coord[0]);
		lats.push(coord[1]);
		total_long += coord[0];
		total_lat += coord[1];
	});

	avg_long = total_long / clean_coords.length;
	avg_lat = total_lat / clean_coords.length;
	var avg_center = {lat: avg_lat, lon: avg_long}
	console.log("Avg Center: ",avg_center)

	// Build map viz
	var data = [{
	 	type:'scattermapbox',
	 	lat:lats,
	  	lon:longs,
	  	mode:'markers',
	  	marker: {
	    	size:10
	  	}
	}]

	var layout = {
	  autosize: true,
	  hovermode:'closest',
	  mapbox: {
	    bearing:0,
	    center: avg_center,
	    pitch:0,
	    zoom:8
	  },
	}

	var figure = { 'data': data, 'layout': layout };

	var imgOpts = {
	    format: 'png',
	    width: 500,
	    height: 500
	};

	// Write map viz to file 'res.png'
	plotly.getImage(figure, imgOpts, function (error, imageStream) {
	    if (error) return console.log (error);
	    
	    var fileStream = fs.createWriteStream('res.png');
	    imageStream.pipe(fileStream);
	});
}

// Sample function call:
// makePlot([[-73.623,45.54],[-73.624,45.538]])


// var data = [{x:[0,1,2], y:[3,2,1], type: 'bar'}];
// var layout = {fileopt : "overwrite", filename : "simple-node-example"};

// plotly.plot(data, layout, function (err, msg) {
// 	if (err) return console.log(err);
// 	console.log(msg);
// });


// getStuff();

// Can't use `await` outside of an async function so you need to chain
// with then()
// getStuff().then(data => {
//   console.log(data);
// })

module.exports = {
	makePlot
}    
// Will need to calculate center


