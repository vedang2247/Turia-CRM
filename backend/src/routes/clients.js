const express = require('express');
const { createCrmControllers } = require('../controllers/crmController');

function clientRoutes(db) {
  const router = express.Router();
  const c = createCrmControllers(db).clients;

  router.get('/', c.list);
  router.post('/', c.create);
  router.get('/match', c.match);
  router.get('/:id', c.get);

  return router;
}

module.exports = { clientRoutes };
