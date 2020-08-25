const { Autohook, setWebhook, validateWebhook, WebhookURIError, RateLimitError } = require('twitter-autohook');
const util = require('util');
const request = require('request');
const axios = require('axios');
const plot = require('./plot.js');
const l_util = require('./local_utils.js');
const fs = require('fs');
var FormData = require('form-data');


const post = util.promisify(request.post);


const oAuthConfig = {
  token: process.env.TWITTER_ACCESS_TOKEN,
  token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
};

const botId = process.env.BOT_ID;
const errorMsg = "No results returned";
const errorGeo = "No geo results";
const pngLocation = './res.png'


async function cleanCoords(rawCoords) {
  console.log("raw Coords", rawCoords);
  var clean_coords = [];
  rawCoords.forEach(function(item,index) {
    clean_coords.push(item.geo.bbox.slice(0,2))
  });
  return clean_coords
}

//UPLOAD FILE AND GET MEDIA ID
async function getMediaId(base64Location) {
  var data = new FormData();
  data.append('media_data', fs.createReadStream(base64Location));

  var config = {
    method: 'post',
    url: 'https://upload.twitter.com/1.1/media/upload.json',
    headers: { 
      'Authorization': `OAuth oauth_consumer_key=${oAuthConfig.consumer_key},oauth_token=${oAuthConfig.token},oauth_signature_method="HMAC-SHA1",oauth_timestamp="1598333093",oauth_nonce="MDtu575iz2J",oauth_version="1.0",oauth_signature="FrA5543kyHi1LS90UpemSkZbS6Q%3D"`, 
      'Cookie': 'personalization_id="v1_xQuSglKogja1ug6Y/z6g1w=="; guest_id=v1%3A159804361564129710; lang=en', 
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
      'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAADbmGwEAAAAAqsWLSbK9fvMSulMl391sVSZmF1I%3D0KTlIfyCwjQ3UIwqoKNZDpAj0O36PmOqtfZO2oiUij8Ap7NliF', 
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

async function buildErrorConfig(message,senderScreenName,error_msg) {
  const requestConfig = {
    url: 'https://api.twitter.com/1.1/direct_messages/events/new.json',
    oauth: oAuthConfig,
    json: {
      event: {
        type: 'message_create',
        message_create: {
          target: {
            recipient_id: message.message_create.sender_id,
          },
          message_data: {
            text: `Hi @${senderScreenName}! ${error_msg} :(`,
          },
        },
      },
    },
  };
  //console.log(requestConfig.json.event.message_create.message_data);
  return requestConfig;
}

async function buildConfig(message,senderScreenName,media_id) {
  const requestConfig = {
    url: 'https://api.twitter.com/1.1/direct_messages/events/new.json',
    oauth: oAuthConfig,
    json: {
      event: {
        type: 'message_create',
        message_create: {
          target: {
            recipient_id: message.message_create.sender_id,
          },
          message_data: {
            text: `Hi @${senderScreenName}! Here are your coordinates ^ 👋`,
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
  }

  // Messages are wrapped in an array, so we'll extract the first element
  const message = event.direct_message_events.shift();

  if (message.message_create.sender_id === botId) {
    return;
  }
  // We check that the message is valid
  if (typeof message === 'undefined' || typeof message.message_create === 'undefined') {
    return;
  }
 
  // We filter out message you send, to avoid an infinite loop
  if (message.message_create.sender_id === message.message_create.target.recipient_id) {
    return;
  }

  // Prepare and send the message reply
  const senderScreenName = event.users[message.message_create.sender_id].screen_name;

  // Get user query
  var hashtag2 = message.message_create.message_data.text;
  // Call input validation function to alter hashtag to %23
  cleanHashtag = await l_util.cleanHashtag(hashtag2);
  
  
  try {

    // getCoords returns raw_coordinates or error message
    const raw_coords = await getCoords(cleanHashtag);

    if (raw_coords == errorMsg || raw_coords == errorGeo) {
      const errorConfig = await buildErrorConfig(message,senderScreenName,raw_coords);
      await post(errorConfig);
    }
    else {
      // getPlaces cleans the data, returns it
      const cleanedCoords = await cleanCoords(raw_coords);
      const base64Location = await plot.buildPlot(pngLocation,cleanedCoords)
      const mediaId = await getMediaId(base64Location);
      // console.log("returning info from getCoords\n",coords)
      const requestConfig = await buildConfig(message,senderScreenName,mediaId)
      //console.log(requestConfig);
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