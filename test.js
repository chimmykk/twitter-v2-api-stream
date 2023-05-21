const express = require('express');
const app = express();
const needle = require('needle');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

app.use(cors());

const TOKEN ='AAAAAAAAAAAAAAAAAAAAAHJ9nAEAAAAAomau5hMP8%2Fus0oP2sfkqReBJTmw%3DUGiJFDfts0IQh55KvVDxsnKUEo1uibQ4aQyslLeUKPjvp94pL2';

const streamURL =
  'https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics,created_at&expansions=author_id&user.fields=username,name,profile_image_url';
const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';

async function getAllRules() {
  const response = await needle('get', rulesURL, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  if (response.statusCode !== 200) {
    throw new Error(response.body);
  }

  return response.body;
}

async function deleteAllRules(rules) {
  if (!Array.isArray(rules.data)) {
    return null;
  }

  const ids = rules.data.map((rule) => rule.id);
  const data = {
    delete: {
      ids: ids,
    },
  };

  const response = await needle('post', rulesURL, data, {
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  if (response.statusCode !== 200) {
    throw new Error(response.body);
  }

  return response.body;
}

async function setRules(rules) {
  const data = {
    add: rules,
  };

  const response = await needle('post', rulesURL, data, {
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  if (response.statusCode !== 201) {
    throw new Error(response.body);
  }

  return response.body;
}

let tweetCount = 0;

const stream = needle.get(streamURL, {
  headers: {
    Authorization: `Bearer ${TOKEN}`,
  },
});

stream.on('data', async (data) => {
  try {
    const json = JSON.parse(data);
    const tweetText = json.data.text;
    const tweetId = json.data.id;
    console.log(`Tweet ID: ${tweetId}`);
    console.log(`Tweet Text: ${tweetText}`);
    await checkMediaUrl(tweetId);
    
    try {
      const apiUrl = `https://api.twitter.com/2/tweets?ids=${tweetId}&expansions=attachments.media_keys&media.fields=media_key,type,url,preview_image_url`;
      const response = await needle('get', apiUrl, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      
      if (
        response.statusCode === 200 &&
        response.body.data[0].attachments &&
        response.body.includes.media
      ) {
        const mediaObj = response.body.includes.media.find(
          (media) => media.type === 'photo' || media.type === 'animated_gif'
        );
        
        if (mediaObj && mediaObj.url) {
          console.log('Media URL found:', mediaObj.url);
          json.media_url = mediaObj.url;
        }
      }

      // Check for likes and comments
      const updatedMetrics = response.body.data[0].public_metrics;
      if (updatedMetrics.likes !== json.data.public_metrics.likes ||
          updatedMetrics.retweet_count !== json.data.public_metrics.retweet_count ||
          updatedMetrics.reply_count !== json.data.public_metrics.reply_count) {

        // Update JSON file with new metrics
        json.data.public_metrics = updatedMetrics;
        const filename = `${tweetId}.json`;
        const filePath = path.join(__dirname, 'pulltweets', filename);
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
      }

      tweetCount++;
      const filename = `${tweetId}.json`;
      const filePath = path.join(__dirname, 'pulltweets', filename);
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
      
    } catch (error) {
      console.error(`Error writing JSON file: ${error}`);
    }
  } catch (error) {
    console.error(`Error parsing JSON: ${error}`);
  }
});

async function checkMediaUrl(tweetId) {
  try {
    const apiUrl = `https://api.twitter.com/2/tweets?ids=${tweetId}&expansions=attachments.media_keys&media.fields=media_key,type,url,preview_image_url`;
    const response = await needle('get', apiUrl, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    if (
      response.statusCode === 200 &&
      response.body.data[0].attachments &&
      response.body.includes.media
    ) {
      const mediaObj = response.body.includes.media.find(
        (media) => media.type === 'photo' || media.type === 'animated_gif'
      );

      if (mediaObj && mediaObj.url) {
        console.log('Media URL found:', mediaObj.url);
        
        json.media_url = mediaObj.url;
        
      } else {
        console.log('No media URL found.');
        
        json.media_url = '';
        
      }
      
    } else {
      
       json.media_url = '';
       
       console.log('No media URL found.');
       
    }
    
  } catch (error) {
    console.error(`Error checking media URL: ${error}`);
  }
}

async function updateMetrics() {
  try {
    const filePath = path.join(__dirname, 'pulltweets');
    fs.readdirSync(filePath).forEach(async (file) => {
      const content = fs.readFileSync(path.join(filePath, file));
      const json = JSON.parse(content);
      const tweetId = json.data.id;
      
      try {
        const apiUrl = `https://api.twitter.com/2/tweets?ids=${tweetId}&expansions=attachments.media_keys&media.fields=media_key,type,url,preview_image_url&tweet.fields=public_metrics`;
        const response = await needle('get', apiUrl, {
          headers: { Authorization: `Bearer ${TOKEN}` },
        });
        
        // Check for likes and comments
        const updatedMetrics = response.body.data[0].public_metrics;
        if (updatedMetrics.likes !== json.data.public_metrics.likes ||
            updatedMetrics.retweet_count !== json.data.public_metrics.retweet_count ||
            updatedMetrics.reply_count !== json.data.public_metrics.reply_count) {

          // Update JSON file with new metrics
          json.data.public_metrics = updatedMetrics;
          fs.writeFileSync(path.join(filePath, file), JSON.stringify(json, null, 2));
          
          console.log(`Updated metrics for tweet ID ${tweetId}`);
          
        }
        
      } catch (error) {
        console.error(`Error updating metrics for tweet ID ${tweetId}: ${error}`);
      }
    });
    
  } catch (error) {
    console.error(`Error reading pulltweets folder: ${error}`);
  }
}

async function main() {
  let currentRules;

  try {
    currentRules = await getAllRules();
    await deleteAllRules(currentRules);

    const rules = [
      { value: 'Dogepound -is:retweet -is:reply' },
      { value: 'Doge Pound -is:retweet -is:reply' },
      { value: 'The Doge Pound -is:retweet -is:reply' },
      { value: '@thedogepoundnft -is:retweet -is:reply' },
      { value: 'TheDogePound -is:retweet -is:reply' }
    ];
    await setRules(rules);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
  setInterval(updateMetrics, 60000); // Check every min

  app.use('/pulltweets', express.static(path.join(__dirname, 'pulltweets')));

  app.get('/tweets', (req, res) => {
    const tweetIds = [];
    const filePath = path.join(__dirname, 'pulltweets');
    fs.readdirSync(filePath).forEach((file) => {
      const content = fs.readFileSync(path.join(filePath, file));
      const json = JSON.parse(content);
      tweetIds.push(json.data.id);
    });
    res.json({ tweetIds });
  });

  app.listen(8081, () => {
    console.log('Server started on port 8080');
  });
}

main();