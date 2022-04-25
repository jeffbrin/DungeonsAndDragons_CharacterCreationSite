const express = require('express');
const router = express.Router();
const routeRoot = '/';

/**
 * Handles invalid http requests in the domain.
 * @param {Object} request The http request
 * @param {Object} response The http response
 */
async function handleInvalidEndpoint(request, response){
    response.status(404);
    response.render('404Error.hbs');
}
router.all("*", handleInvalidEndpoint)

module.exports = {
    router, 
    routeRoot
}