const os = require('os');
const path = require('path');

require('dotenv').config({path: path.resolve(os.homedir(), '.env.twitter')});

const util = require('util');

var plotly = require('plotly')(process.env.PLOTLY_USER,process.env.PLOTLY_API)
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
let promiseWritePlot = function(mapConfig,pngLocation) {
  return new Promise((resolve, reject) => {
    plotly.getImage(mapConfig.figure, mapConfig.imgOpts, (err, imageStream) => {
      if (err) reject(err)
      else {
	      	const fileStream = fs.createWriteStream(pngLocation)
	      	imageStream.pipe(fileStream);
	      	fileStream.on('finish', () => {
	  				console.log('All writes are now complete.');
						readFile(pngLocation).then(function (data) {
							console.log(`Length of the file1: ${data.length}`);
							resolve(data);
						});
					});
      } 
    });
  })
}


async function write64 (pngLocation) {
	const base64Location = './png_64';
	const buff = await readFile(pngLocation);
	const contents = buff.toString('base64');
	console.log(`Length of the file2 - confirm: ${buff.length}`);
	await writeFile(base64Location,contents);
	//console.log(`Length 2 of the file :\n${buff.length}`);
	return base64Location;
}

async function buildPlot (pngLocation,cleanedCoords) {

  const mapConfig = await makePlot(cleanedCoords);

	const imageLoc = await promiseWritePlot(mapConfig,pngLocation);

	const file64 = await write64(pngLocation);
	return file64;
}

module.exports = {
	buildPlot
}    
// Will need to calculate center


async function temp () {
	console.log(process.env);
	const res = await buildPlot('./res.png',[[-73.623,45.54],[-73.624,45.538]])
	// await write64('./res.png');
	console.log("end of temp ", res);
}

// temp();
