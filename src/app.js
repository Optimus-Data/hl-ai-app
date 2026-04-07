require('dotenv').config();
const express = require('express');
const routes = require('./routes/routes.js');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);
  return app;
}

module.exports = { createApp };
