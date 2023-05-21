const express = require('express');
const app = express();
const needle = require('needle');
const dotenv = require('dotenv');
dotenv.config();

// Environment variable used Bearer Token
const TOKEN = process.env.TWITTER_BEARER_TOKEN;

// Function to get user details with username
async function getUserDetails(username) {
  const apiUrl = `https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics,profile_image_url`;
  const response = await needle('get', apiUrl, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  if (response.statusCode === 200) {
    const userObj = response.body.data;
    console.log(`Username: ${userObj.username}`);
    console.log(`Profile Image URL: ${userObj.profile_image_url}`);
    console.log(`Followers: ${userObj.public_metrics.followers_count}`);
    console.log(`Followings: ${userObj.public_metrics.following_count}`);
  } else {
    console.error(response.body);
  }
}

// Main function 
// Here declare the values you want to fetch
async function main() {
  try {
    await getUserDetails("yeiterilsosing");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  // Start the server
  app.listen(3000, () => {
    console.log('Server started on port 3000');
  });
}

main();