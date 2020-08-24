const plot = require('./plot.js');

async function temp () {
	const res = await plot.buildPlot('./res.png',[[-73.623,45.54],[-73.624,45.538]])

	console.log("end of temp ",res);
}

temp();