const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

let users = {};

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // index.html, script.js, style.css

// Update device info (called by client)
app.post('/api/update-device', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  users[ip] = {
    device: req.body.device || 'Unknown Device',
    lastSeen: Date.now(),
    online: true
  };
  res.sendStatus(200);
});

// Get online users (for admin view)
app.get('/api/online-users', (req, res) => {
  const now = Date.now();
  const onlineUsers = Object.values(users).filter(u => now - u.lastSeen < 60000).map(u => ({
    device: u.device,
    online: true
  }));
  res.json(onlineUsers);
});

// Clear offline after 1 min
setInterval(() => {
  const now = Date.now();
  for (let ip in users) {
    if (now - users[ip].lastSeen > 60000) {
      users[ip].online = false;
    }
  }
}, 30000);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
