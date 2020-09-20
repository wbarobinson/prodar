
# Prodar: A Twitter bot for protestors

### [DEMO](https://www.youtube.com/watch?v=a_MKGr6oDeY&feature=emb_logo)

Direct Messages to this twitter bot as used as a "search term" against recent tweets.
The bot will return a map of the coordinates of the tweets matching the "search term".

This tool is designed to help protestors organize, by allowing for a decentralized relay of information.

During a protest, protestors are encouraged to tweet a protest hashtag with geolocation.

These protestors and protest organizers can then DM the bot to get all the geolocations of the protest hashtag in map format.

This can help everyone better organize safely.


### To use this bot:

Send a direct message to [Prodar2020](https://twitter.com/2020prodar) with your query.

Toy example: dm '#hftprodar' to see a sample.

### To make your own bot with this code

1. Follow these [these instructions](env_template.txt) to set your environment variables

$ git clone https://github.com/wbarobinson/prodar.git

$ cd prodar

$ npm install

$ node index.js
