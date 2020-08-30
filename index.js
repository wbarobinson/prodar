const { Autohook, setWebhook, validateWebhook, WebhookURIError, RateLimitError } = require('twitter-autohook');
const util = require('util');
const request = require('request');
const axios = require('axios');
const plot = require('./plot.js');
const l_util = require('./local_utils.js');
const fs = require('fs');
const crypto = require('crypto');
var oauthSignature = require('oauth-signature');
var FormData = require('form-data');


const post = util.promisify(request.post);
const bearerToken = process.env.TWITTER_BEARER_TOKEN;

const oAuthConfig = {
  token: process.env.TWITTER_ACCESS_TOKEN,
  token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
};

const botId = process.env.BOT_ID;
const errorMsg = "No results returned";
const errorGeo = "No geo result";
const pngLocation = './res.png'


async function cleanCoords(rawCoords) {
  console.log("raw Coords", rawCoords);
  var clean_coords = [];
  rawCoords.forEach(function(item,index) {
    clean_coords.push(item.geo.bbox.slice(0,2))
  });
  return clean_coords
}

//WORKING ON DYNAMIC REQUESTS
// create nonce
//let nonce = crypto.randomBytes(16).toString('base64');
//let nonce = 'uRMeg91tEFl';
// FIX THIS CODE TO BE MORE DYNAMIC AND PRETTY
let timestamp = Date.now().toString().slice(0,10);
console.log(timestamp);

//UPLOAD FILE AND GET MEDIA ID
async function getMediaId(base64Location) {
  var data = new FormData();
  data.append('media_data', fs.createReadStream(base64Location));
    //Testing to get same signature
    let signature = oauthSignature.generate(
      'POST', 
      'https://upload.twitter.com/1.1/media/upload.json', 
      {
      oauth_consumer_key : "3TKYD9w8H5lRdyn69X8DoscqI",
      oauth_token : "1297582273013768197-WcS1u2MASXTuOA3dyveaBtC4E8Fnip",
      oauth_signature_method : 'HMAC-SHA1',
      oauth_timestamp : timestamp,
      oauth_nonce : "uRMeg91tEFl",
      oauth_version : "1.0"
      }, 
      oAuthConfig.consumer_secret,
      oAuthConfig.token_secret);

  // FROM POSTMAN
  var config = {
    method: 'post',
    url: 'https://upload.twitter.com/1.1/media/upload.json',
    headers: { 
      'Authorization': `OAuth oauth_consumer_key="3TKYD9w8H5lRdyn69X8DoscqI",oauth_token="1297582273013768197-WcS1u2MASXTuOA3dyveaBtC4E8Fnip",oauth_signature_method="HMAC-SHA1",oauth_timestamp="${timestamp}",oauth_nonce="uRMeg91tEFl",oauth_version="1.0",oauth_signature="${signature}"`, 
      'Cookie': 'personalization_id="v1_5lhFvw9qvMPnaFzOpi7UwA=="; guest_id=v1%3A159804355865560354; lang=en', 
      ...data.getHeaders()
    },
    data : data
  };
  


  try {
    const response = await axios(config)
    return response.data.media_id_string;
  }
  catch (error) {
    console.log('media ID error :(', error);
  }
}

// Uses Bearer token btw
async function getCoords(hashtag) {
  var config = {
    method: 'get',
    url:`https://api.twitter.com/2/tweets/search/recent?expansions=geo.place_id,author_id&place.fields=geo&user.fields=username&query=${hashtag}&max_results=100`,

    headers: { 
      'Authorization': `Bearer ${bearerToken}`, 
      'Cookie': 'personalization_id="v1_xQuSglKogja1ug6Y/z6g1w=="; guest_id=v1%3A159804361564129710'
    }
  };

  // Types of edge cases:
  // 1. No data from twitter search
  // 2. No geo data
  try {
    const response = await axios(config);

    if(response.data.meta.result_count == '0') {
      return errorMsg;
    }      
    const places = response.data.includes.places
    // default
    if (places) {
      return places
    }
    else {
      return errorGeo; 
    }
  } catch (error) {
    console.error('axios error', error);
  }
}

async function buildErrorConfig(senderId,error_msg) {
  const requestConfig = {
    url: 'https://api.twitter.com/1.1/direct_messages/events/new.json',
    oauth: oAuthConfig,
    json: {
      event: {
        type: 'message_create',
        message_create: {
          target: {
            recipient_id: senderId,
          },
          message_data: {
            text: `${error_msg} :(`,
          },
        },
      },
    },
  };
  //console.log(requestConfig.json.event.message_create.message_data);
  return requestConfig;
}

async function buildConfig(senderId, media_id) {
  const requestConfig = {
    url: 'https://api.twitter.com/1.1/direct_messages/events/new.json',
    oauth: oAuthConfig,
    json: {
      event: {
        type: 'message_create',
        message_create: {
          target: {
            recipient_id: senderId,
          },
          message_data: {
            text: `Here are your coordinates ^ 👋`,
            attachment: {
              type: "media", 
              media: {
                "id": media_id
              }
            },
          },
        },
      },
    },
  };
  //console.log(requestConfig.json.event.message_create.message_data);
  return requestConfig;
}

async function mainLogic(event) {
  // We check that the message is a direct message
  if (!event.direct_message_events) {
    return;
  };

  // Messages are wrapped in an array, so we'll extract the first element
  const message = event.direct_message_events.shift();

  // We filter out message you send, to avoid an infinite loop
  if (message.message_create.sender_id === botId) {
    return;
  };

  // We check that the message is valid
  if (typeof message === 'undefined' || typeof message.message_create === 'undefined') {
    return;
  };

  // We filter out message you send, to avoid an infinite loop (PROBABLY REDUNDANT BUT WE DO NOT WANT TO CHANCE IT YET)
  if (message.message_create.sender_id === message.message_create.target.recipient_id) {
    return;
  };

  // Get the ID of the person DMing the bot, so we know who to later send the response to.
  const senderId = message.message_create.sender_id;

  // Get get DM's text to then use it as a parameter for the Tweet Search
  var hashtag = message.message_create.message_data.text;

  // Call input validation function to alter hashtag to %23, because URLs do not like #'s
  cleanHashtag = await l_util.cleanHashtag(hashtag);

  try {

    // getCoords returns raw_coordinates or error message
    const raw_coords = await getCoords(cleanHashtag);

    // Handle the errors
    if (raw_coords == errorMsg || raw_coords == errorGeo) {
      const errorConfig = await buildErrorConfig(senderId,raw_coords);
      await post(errorConfig);
    }
    else {
      // cleanCoords makes the data returned by getCoords readable by buildPlot
      const cleanedCoords = await cleanCoords(raw_coords);
      // buildPlot creates the image was are going to send to the DMer and returns its file location
      const base64Location = await plot.buildPlot(pngLocation,cleanedCoords)
      // getMediaId sends the image to Twitter, which returns a Media Id pointing to the image on their servers
      const mediaId = await getMediaId(base64Location);
      // buildConfig builds the API request to Twitter to DM the DMer the Media Id of the file
      const requestConfig = await buildConfig(senderId,mediaId)
      // Now we send the API request.
      await post(requestConfig);
    }

  } catch (err) {
    console.log('we threw an error', err);
  }
}

(async start => {
  try {
    const webhook = new Autohook();

    // Calls mainlogic on any event
    webhook.on('event', async event => {
      if (event.direct_message_events) {
        await mainLogic(event);
      }
    });
    // Removes existing webhooks
    await webhook.removeWebhooks();
    
    // Starts a server and adds a new webhook
    await webhook.start();
    
    // Subscribes to your own user's activity
    await webhook.subscribe({oauth_token: process.env.TWITTER_ACCESS_TOKEN, oauth_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET});  
  } catch (e) {
    // Display the error and quit
    console.error(e);
    process.exit(1);
  }
})();  




// UNUSED AUXILIARY FUNCTIONS

// Filter tweets for geo only

// Use this function if you want tweet content in addition to geo


// async function filterData(tweet_array) {
//   function filter_geo(tweet_object, index, arr) {
//     // Returns true or false
//     return Object.keys(tweet_object).includes('geo');
//   }
//   // Subset of tweet array where object keys includes geo
//   // Can be empty []
//   geo_array = tweet_array.filter(filter_geo);

//   return geo_array;
// }

// TODO FEATURES:
/* 
- Catch 404 error and call node index.js again
- make bot account
- Bot ID in env variables
*/