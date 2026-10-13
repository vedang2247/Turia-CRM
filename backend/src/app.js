// Builds the Express app. It receives the database as an argument
// ("dependency injection") so tests can inject a temporary database.
const express = require('express');
const cors = require('cors');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { agentRoutes } = require('./routes/agents');
const { historyRoutes } = require('./routes/history');
const { definitionRoutes } = require('./routes/definitions');
const { clientRoutes } = require('./routes/clients');
const { teamRoutes } = require('./routes/team');
const { templateRoutes } = require('./routes/templates');
const { chatRoutes } = require('./routes/chats');
const { taskRoutes } = require('./routes/tasks');
const { initCrmSchema } = require('./db/database');

function createApp({ db, corsOrigins = ['http://localhost:3000'] }) {
  // Ensure CRM schema is ready idempotently for any database passed to the app
  if (db) initCrmSchema(db);

  const app = express();
  app.disable('x-powered-by');

  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: '100kb' }));

  // GET /api/health - proves the server is up AND the database answers.
  app.get('/api/health', (req, res) => {
    try {
      db.prepare('SELECT 1').get();
      res.json({
        success: true,
        data: { status: 'ok', database: 'connected', time: new Date().toISOString() },
      });
    } catch (err) {
      res.status(503).json({
        success: false,
        error: { code: 'DB_UNAVAILABLE', message: 'Database is not reachable.' },
      });
    }
  });

  app.use('/api/agent-definitions', definitionRoutes());
  app.use('/api/agents', agentRoutes(db));
  app.use('/api/history', historyRoutes(db));

  // CRM routes
  app.use('/api/clients', clientRoutes(db));
  app.use('/api/team', teamRoutes(db));
  app.use('/api/templates', templateRoutes(db));
  app.use('/api/chats', chatRoutes(db));
  app.use('/api/tasks', taskRoutes(db));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
