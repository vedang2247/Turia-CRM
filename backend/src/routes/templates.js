const express = require('express');
const { createCrmControllers } = require('../controllers/crmController');

function templateRoutes(db) {
  const router = express.Router();
  const c = createCrmControllers(db).templates;

  router.get('/', c.list);
  router.post('/', c.create);
  router.get('/:id', c.get);
  router.patch('/:id', c.update);
  router.put('/:id', c.update);
  router.delete('/:id', c.delete);

  return router;
}

module.exports = { templateRoutes };
