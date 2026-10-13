const express = require('express');
const { createCrmControllers } = require('../controllers/crmController');

function teamRoutes(db) {
  const router = express.Router();
  const c = createCrmControllers(db).team;

  router.get('/', c.list);

  return router;
}

module.exports = { teamRoutes };
