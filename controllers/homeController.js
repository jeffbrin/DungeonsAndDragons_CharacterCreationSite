const express = require('express');
const router = express.Router();
const routeRoot = '/';


/**
 * Responds to an http request with a response containing the spells home page.
 * @param {object} request An http request object.
 * @param {object} response An http response object.
 */
function getHome(request, response){
    response.render('home.hbs', {homeActive: true})
}

router.get('/', getHome);
router.get('/home', getHome);

module.exports = {
    router,
    routeRoot
}
