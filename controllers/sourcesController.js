const hbs = require('express-handlebars').create({});
const express = require('express');
const res = require('express/lib/response');
const router = express.Router();
const routeRoot = '/sources';
const model = require('../models/characterModel');
const logger = require('../logger');
const authenticator = require('./authenticationHelperController')
const userModel = require('../models/userModel')

const errors = require('../models/errorModel');

async function getSources(request, response){
    response.status(201).render('sources.hbs', {});
}

router.get('/', getSources);
module.exports = {
    router,
    routeRoot
}