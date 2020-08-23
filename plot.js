const os = require('os');
const path = require('path');

require('dotenv').config({path: path.resolve(os.homedir(), '.env.twitter')});


var plotly = require('plotly')(process.env.PLOTLY_USER, process.env.PLOTLY_API)
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
	    zoom:5
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
// makePlot([['35','-110'],['35.5','-110.5']])

console.log(process.env);
console.log(os.homedir())
// Convert fs.readFile into Promise version of same    
// const readFile = util.promisify(fs.readFile);

// async function getStuff() {
//   let data = await readFile('res.png');
//   console.log(data)
// }

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


