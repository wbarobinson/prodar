// const os = require('os');
// const path = require('path');

//require('dotenv').config({path: path.resolve(os.homedir(), '.env.twitter')});
const PLOTLY_API= "1QIeQ64d1ovLY5OggTdv"
const PLOTLY_USER= "tony-goss"

const util = require('util');

var plotly = require('plotly')(PLOTLY_USER,PLOTLY_API)
var fs = require('fs');

const l_util = require('./local_utils.js')

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile) 


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

/*
let promiseTo64 = function(fileLocation) {
		readFileContent('./res.png') 
		// If promise resolved and datas are read  
		.then(buff => { 
		  const contents = buff.toString('base64');
		  console.log(`Length of the file :\n${buff.length}`); 
		}); 
}
*/

async function write64 (pngLocation) {
	const base64Location = 'png_64';
	const buff = await readFile(pngLocation);
	const contents = await buff.toString('base64');
	await writeFile(base64Location,contents);
	return base64Location;
}

async function buildPlot (fileLocation,cleanedCoords) {

  const mapConfig = await makePlot(cleanedCoords);

	const imageLoc = await promiseWritePlot(mapConfig,fileLocation);

	const file64 = await write64(fileLocation);
	return file64;
}

module.exports = {
	buildPlot
}    
// Will need to calculate center


async function temp () {
	const res = await buildPlot('./res.png',[[-73.623,45.54],[-73.624,45.538]])

	console.log("end of temp ",res);
}

temp();
