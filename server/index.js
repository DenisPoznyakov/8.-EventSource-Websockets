const WebSocket = require('ws');
const http = require('http');

// Создаем HTTP-сервер
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running');
});

// Создаем WebSocket-сервер
const wss = new WebSocket.Server({ server });

const users = new Map();

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'register') {
      const { name } = data;
      if (users.has(name)) {
        ws.send(JSON.stringify({ type: 'error', message: 'Nickname is already taken' }));
        ws.close();
        return;
      }
      users.set(name, ws);
      broadcast({ type: 'user-connected', users: Array.from(users.keys()) });
    }

    if (data.type === 'send') {
      const sender = Array.from(users.entries()).find(([_, sock]) => sock === ws)?.[0];
      if (sender) {
        broadcast({ type: 'message', message: data.message, user: { name: sender } });
      }
    }
  });

  ws.on('close', () => {
    const disconnectedUser = Array.from(users.entries()).find(([_, sock]) => sock === ws)?.[0];
    if (disconnectedUser) {
      users.delete(disconnectedUser);
      broadcast({ type: 'user-disconnected', users: Array.from(users.keys()) });
    }
    console.log('Client disconnected');
  });
});

function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Слушаем порт
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});