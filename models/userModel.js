const mysql = require('mysql2/promise');
let connection;
const tableName = 'playercharacter';
const logger = require('../logger');
const error = logger.error;
const warn = logger.warn;
const info = logger.info;
const errors = require('./errorModel');

async function addUser(username, password){

}
