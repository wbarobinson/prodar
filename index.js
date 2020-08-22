const { Autohook, setWebhook, validateWebhook, WebhookURIError, RateLimitError } = require('twitter-autohook');
const util = require('util');
const request = require('request');
const { get } = require('http');

const post = util.promisify(request.post);


const botId = "24737459"

const oAuthConfig = {
  token: process.env.TWITTER_ACCESS_TOKEN,
  token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
};

var repBod = "building";

async function getCoords(hashtag) {
  var options = {
    'method': 'GET',
    'url': `https://api.twitter.com/2/tweets/search/recent?expansions=geo.place_id,author_id&place.fields=geo&user.fields=username&query=${hashtag}&max_results=10`,
    'headers': {
      'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAADbmGwEAAAAAqsWLSbK9fvMSulMl391sVSZmF1I%3D0KTlIfyCwjQ3UIwqoKNZDpAj0O36PmOqtfZO2oiUij8Ap7NliF',
      'Cookie': 'personalization_id="v1_5lhFvw9qvMPnaFzOpi7UwA=="; guest_id=v1%3A159804355865560354'
    }
  };
  await request(options, function (error, response) {
    if (error) throw new Error(error);
    repBod = JSON.stringify(JSON.parse(response.body).data[0]);
    console.log("repBod1\n", repBod);
    return repBod;
  });
}

async function sayHi(event) {
   // We check that the message is a direct message
   if (!event.direct_message_events) {
    return;
  }

  //const hashtag = "building"

  // Messages are wrapped in an array, so we'll extract the first element
  const message = event.direct_message_events.shift();

  // We grab the message contents from the tweet
  let hashtag2 = await JSON.stringify(message.message_create.message_data.text);
  console.log("hashtag2\n", hashtag2);

  // We check that the message is valid
  if (typeof message === 'undefined' || typeof message.message_create === 'undefined') {
    return;
  }

  //We check that we aren't including the bot's texts...  
  if (message.message_create.sender_id === botId) {
    return;
  }
  // We filter out message you send, to avoid an infinite loop
  if (message.message_create.sender_id === message.message_create.target.recipient_id) {
    return;
  }

  // Prepare and send the message reply
  const senderScreenName = event.users[message.message_create.sender_id].screen_name;

  await getCoords(hashtag2)

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
            text: `Hi @${senderScreenName}! ${repBod} 👋`,
          },
        },
      },
    },
  };

  //console.log("reqConfig\n",requestConfig.json.event.message_create.message_data);
  //await console.log("repBod2\n", repBod);
  console.log("repBod2\n", repBod);
  post(requestConfig);
}

(async start => {
  try {
    const webhook = new Autohook();
    webhook.on('event', async event => {
      if (event.direct_message_events) {
        await sayHi(event);
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
