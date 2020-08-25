var fs  = require('fs')


async function cleanHashtag(user_string) {
	if (user_string[0] == '#') {
		return '%23' + user_string.substring(1)
	}
	else {
		return user_string
	}
}

// Write a png to base64
async function writebase64(file) {
	async function base64_encode(file) {
	    // Read image from file
		fs.readFile(file, function(err, data){ 
		    if (err) console.log(file, " doesn't exist");

		    // When image is read (as buffer), convert to base64
		    const base64 = data.toString('base64'); 

		    // Write to file
			fs.writeFile("png_64", base64, (err) => { 
			  if (err) console.log(err); 
			  console.log('wrote png to 64')
			}); 
		});
	}

	await base64_encode(file);
}




module.exports = {
	cleanHashtag, writebase64
}