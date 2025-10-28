import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { errorHandler } from './utils/errors';
import { initializeTriggers } from './queues/triggerQueue';

// Import routes
import authRoutes from './routes/authRoutes';
import apiKeyRoutes from './routes/apiKeyRoutes';
import triggerRoutes from './routes/triggerRoutes';
import mcpRoutes from './routes/mcpRoutes';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontend.url,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/triggers', triggerRoutes);

// MCP routes
app.use('/mcp', mcpRoutes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.port;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize triggers on startup
  await initializeTriggers();
});

