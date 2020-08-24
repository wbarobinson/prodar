// const os = require('os');
// const path = require('path');

//require('dotenv').config({path: path.resolve(os.homedir(), '.env.twitter')});
const PLOTLY_API= "1QIeQ64d1ovLY5OggTdv"
const PLOTLY_USER= "tony-goss"

const util = require('util');

var plotly = require('plotly')(PLOTLY_USER,PLOTLY_API)
var fs = require('fs');


const l_util = require('./local_utils.js');

// const test1 = require('./test.js')

// test1.test();

// clean_coords is a list of lat/long pairs
function makePlot(clean_coords) {
	console.log("clean coords ", clean_coords);
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

	var mapConfig = {};
	mapConfig["figure"] = figure;
	mapConfig["imgOpts"] = imgOpts;

	return mapConfig;
}

//const promiseWritePlot = util.promisify(plotly.getImage);
// Writes image to file on resolve
let promiseWritePlot = function(mapConfig,fileLocation) {
  return new Promise((resolve, reject) => {
    plotly.getImage(mapConfig.figure, mapConfig.imgOpts, (err, imageStream) => {
      if (err) reject(err)
      else {
      	const fileStream = fs.createWriteStream('./res.png')
      	imageStream.pipe(fileStream);
      	resolve('./res.png');
      } 
    });
  })
}



let promiseTo64 = function(fileLocation) {
  return new Promise((resolve, reject) => {
		fs.readFile(fileLocation, (err, data) => { 
		    if (err) reject(err);
			// When image is read (as buffer), convert to base64
		    var base64 = data.toString('base64'); 
			// Write to file
			console.log(base64)
			fs.writeFile("png_64", base64, (err) => { 
			  if (err) reject(err); 
			  resolve('png_64');
			}); 
		});
  });
}

async function buildPlot (fileLocation,cleanedCoords) {

  	const mapConfig = makePlot(cleanedCoords);

	const imageLoc = await promiseWritePlot(mapConfig,fileLocation);

	const file64 = await promiseTo64(imageLoc);
	return file64;
}

async function temp () {
	const res = await buildPlot('./res.png',[[-73.623,45.54],[-73.624,45.538]])
	console.log(res);
}

temp();



//console.log(buildPlot('./res.png',[[-73.623,45.54],[-73.624,45.538]]))


module.exports = {
	buildPlot
}    
// Will need to calculate center


