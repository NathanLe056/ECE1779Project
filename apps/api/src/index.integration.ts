
import express from 'express';
import { createWsServer, redisAdapter } from './websocket';

const app = express();
app.use(express.json());

app.get('/health/ws', (_req, res) => {
  const { wsManager } = require('./websocket');
  res.json({
    status: 'ok',
    rooms: wsManager.getRoomSizes(),
    totalConnections: wsManager.totalConnections(),
    redisConnected: redisAdapter.isConnected,
  });
});

const PORT = Number(process.env.PORT ?? 3000);

async function start(): Promise<void> {
  await redisAdapter.connect();

  const httpServer = app.listen(PORT, () => {
    console.log(`[API] HTTP server listening on port ${PORT}`);
  });

  createWsServer(httpServer);
}

process.on('SIGTERM', async () => {
  console.log('[API] SIGTERM received — shutting down');
  await redisAdapter.disconnect();
  process.exit(0);
});

start().catch((err) => {
  console.error('[API] Failed to start:', err);
  process.exit(1);
});
