const https = require('https');

const req = https.request('https://localhost:9200/_cluster/reroute?retry_failed=true', {
  method: 'POST',
  auth: 'admin:Admin@12345',
  headers: {
    'Content-Type': 'application/json'
  },
  rejectUnauthorized: false
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', console.error);
req.end();
