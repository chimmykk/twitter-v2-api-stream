const Twit = require('twit');

// Authenticate and authorize your API client
const consumer_key = "your_consumer_key";
const consumer_secret = "your_consumer_secret";
const access_token = "your_access_token";
const access_token_secret = "your_access_token_secret";

const T = new Twit({
  consumer_key: consumer_key,
  consumer_secret: consumer_secret,
  access_token: access_token,
  access_token_secret: access_token_secret
});

// Define the tweet status id to like
const status_id = "1234567890123456789";

// Use the `favorites/create` endpoint to like the tweet
T.post('favorites/create', {id: status_id}, function(err, data, response) {
  if (err) {
    console.log(err);
  } else {
    console.log('Liked the tweet with id:', status_id);
  }
});
