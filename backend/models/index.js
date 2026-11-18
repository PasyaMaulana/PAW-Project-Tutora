const sequelize = require('../config/database');
const Topic = require('./topicModel');

const db = {
  sequelize,
  Topic,
};

module.exports = db;
