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
    json: true
  });

  if (response.statusCode !== 201) {
    throw new Error(JSON.stringify(response.body));
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
    
    await checkMediaUrl(json, tweetId);
    
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

      tweetCount++;
      
      const filename = `${tweetCount}.json`;

      const filePath = path.join(__dirname, 'pulltweets', filename);
      
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
      
    } catch (error) {
      console.error(`Error writing JSON file: ${error}`);
    }
  } catch (error) {
    console.error(`Error parsing JSON: ${error}`);
  }
});

async function checkMediaUrl(json, tweetId) {
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

async function main() {
  let currentRules;

  try {

    currentRules = await getAllRules();
    
    await deleteAllRules(currentRules);

    const usernamesJson = fs.readFileSync(path.join(__dirname, 'rules.json'));
    
    const usernamesData = JSON.parse(usernamesJson);
    
    const usernamesRules = usernamesData.usernames.map(username => ({ value: `from:${username}` }));
    
    const dogePoundRules = [
      { value: 'Dogepound -is:retweet -is:reply' },
      { value: 'Doge Pound -is:retweet -is:reply' },
      { value: 'The Doge Pound -is:retweet -is:reply' },
      { value: '@thedogepoundnft -is:retweet -is:reply' },
      { value: 'TheDogePound -is:retweet -is:reply' },
      {value: 'Doge -is: retweet -is:reply'}
    ];
    
    await setRules([...usernamesRules, ...dogePoundRules]);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
  
  app.use('/pulltweets', express.static(path.join(__dirname, 'pulltweets')));
  
  app.listen(8080, () => {
    console.log('Server started on port 8080');
  });
}

main();