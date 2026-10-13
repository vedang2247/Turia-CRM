const express = require('express');
const { createCrmControllers } = require('../controllers/crmController');

function taskRoutes(db) {
  const router = express.Router();
  const c = createCrmControllers(db).tasks;

  router.get('/', c.list);
  router.post('/', c.create);

  // Link badge lookup routes (must precede /:id)
  router.get('/links/by-chat', c.getLinksByChat);
  router.get('/links/by-thread', c.getLinksByThread);

  router.get('/:id', c.get);
  router.patch('/:id', c.update);
  router.put('/:id', c.update);
  router.delete('/:id', c.delete);

  // Sub-resource routes
  router.post('/:id/links', c.addLink);
  router.delete('/:id/links/:linkId', c.removeLink);
  router.post('/:id/emails', c.recordEmail);

  return router;
}

module.exports = { taskRoutes };
