const JsonDB = require('../shared/jsondb');
const path = require('path');

const db = new JsonDB(path.join(__dirname, '..', 'data', 'skillbank-data.json'));

module.exports = db;
