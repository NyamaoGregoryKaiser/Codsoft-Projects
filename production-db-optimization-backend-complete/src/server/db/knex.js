const knexConfig = require('../config/knexfile');
const environment = process.env.NODE_ENV || 'development';
const knex = require('knex')(knexConfig[environment]);

module.exports = knex;