const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

let users = {};

app.use(cors());
app.use(bodyParser.json());

// ✅ public folder ထဲက static files serve
app.use(express.static('public'));

// ✅ "/" route မှာ index.html ကိုပေး (Render "Cannot GET /" ဖြေရှင်း)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Update device info
app.post('/api/update-device', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  users[ip] = {
    device: req.body.device || 'Unknown Device',
    lastSeen: Date.now(),
    online: true
  };
  res.sendStatus(200);
});

// ✅ Get online users
app.get('/api/online-users', (req, res) => {
  const now = Date.now();
  const onlineUsers = Object.values(users).filter(u => now - u.lastSeen < 60000).map(u => ({
    device: u.device,
    online: true
  }));
  res.json(onlineUsers);
});

// ✅ Auto mark users offline
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
