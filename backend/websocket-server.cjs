// Simple self-hosted WebSocket relay (CommonJS). Run with:
//   node websocket-server.cjs
// Requires: npm install ws

const WebSocket = require('ws');
const url = require('url');

const PORT = process.env.WS_PORT || 6001;
const server = new WebSocket.Server({ port: PORT }, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});

// Map<conversationId, Set<WebSocket>>
const rooms = new Map();

function joinRoom(conversationId, ws) {
  if (!rooms.has(conversationId)) rooms.set(conversationId, new Set());
  rooms.get(conversationId).add(ws);
}

function leaveRoom(conversationId, ws) {
  const set = rooms.get(conversationId);
  if (set) {
    set.delete(ws);
    if (!set.size) rooms.delete(conversationId);
  }
}

server.on('connection', (ws, req) => {
  const parsed = url.parse(req.url, true);
  const parts = (parsed.pathname || '').split('/').filter(Boolean);
  const conversationId = parts[1]; // expecting /conversation/{id}

  if (!conversationId) {
    ws.close(1008, 'Conversation required');
    return;
  }

  joinRoom(conversationId, ws);

  ws.on('message', (data) => {
    let payload = data.toString();
    try {
      payload = JSON.parse(payload);
    } catch (e) {
      // keep raw string
    }

    const set = rooms.get(conversationId);
    if (set) {
      for (const client of set) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(payload));
        }
      }
    }
  });

  ws.on('close', () => {
    leaveRoom(conversationId, ws);
  });
});
