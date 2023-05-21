const tweetId = '1635321021346746368'; // Replace with the ID of the tweet you want to get the liking users for
const bearerToken = 'AAAAAAAAAAAAAAAAAAAAAF3ZnAEAAAAAMJu2f5VD%2FQH7qkGPD08ETSAnp7w%3Dj5hvHyMFsfkostyZ0OH6ej1UUnTS6UOBfIEdHuNkZ5JMCBlQUn'; // Replace with your Twitter API Bearer Token

fetch(`https://api.twitter.com/2/tweets/${tweetId}/liking_users`, {
  headers: {
    Authorization: `Bearer ${bearerToken}`
  }
})
.then(response => response.json())
.then(data => {
  console.log(data);
})
.catch(error => {
  console.error(error);
});
