const path = require('path');
require('dotenv').config();

module.exports = {
  appName: 'Tutora',
  appVersion: 'v1.0',
  port: process.env.PORT || 3000,
  logDir: path.join(__dirname, '..', 'logs'),
  logFile: 'logger.md',
};

