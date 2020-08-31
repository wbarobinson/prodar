var fs  = require('fs')

// Function to alter hashtag to %23 because URLs do not like #'s
async function cleanHashtag(user_string) {
	if (user_string[0] == '#') {
		return '%23' + user_string.substring(1)
	}
	else {
		return user_string
	}
}

module.exports = {
	cleanHashtag
}