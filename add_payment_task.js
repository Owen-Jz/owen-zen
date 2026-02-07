const fetch = require('node:https').request;

const task = {
  title: "Set up payment methods for remote work",
  status: "pinned",
  priority: "high",
  subtasks: [
    { title: "Open Wise account (primary - wise.com)", completed: false },
    { title: "Get Barter virtual dollar card (Flutterwave)", completed: false },
    { title: "Verify Nigerian bank has dollar account", completed: false },
    { title: "Create Payoneer account (backup)", completed: false },
    { title: "Download Chipper Cash app", completed: false },
    { title: "Research Stripe Atlas (if monthly >$2k)", completed: false },
    { title: "Set up Binance P2P (emergency backup)", completed: false }
  ]
};

const data = JSON.stringify(task);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/tasks',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = fetch(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('✅ Task added to Pin for Later:', JSON.parse(body));
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
  console.log('Note: Make sure owen-zen dev server is running on port 3000');
});

req.write(data);
req.end();
