const express = require('express');
const { createCrmControllers } = require('../controllers/crmController');

function chatRoutes(db) {
  const router = express.Router();
  const c = createCrmControllers(db).chats;

  router.get('/status', c.getStatus);
  router.patch('/status', c.setStatus);

  return router;
}

module.exports = { chatRoutes };
