const path = require('path');
// File .env berada di root project (satu tingkat di atas folder backend)
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });

module.exports = {
  appName: 'Tutora',
  appVersion: 'v1.0',
  port: process.env.PORT || 3000,
  logDir: path.join(__dirname, '..', 'logs'),
  logFile: 'logger.md',
};

