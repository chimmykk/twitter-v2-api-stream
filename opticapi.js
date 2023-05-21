const fetch = require('node-fetch');

const url = 'https://api.optic.xyz/v1/reference/https://dl.openseauserdata.com/cache/originImage/files/21320336820332a3da8bffa883a22849.png';
const options = {method: 'GET', headers: {accept: 'application/json'}};

fetch(url, options)
  .then(res => res.json())
  .then(json => console.log(json))
  .catch(err => console.error('error:' + err));