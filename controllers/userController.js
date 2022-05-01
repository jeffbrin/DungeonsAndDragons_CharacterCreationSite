///This controller is to add users to the database
const express = require('express');
const router = express.Router();
const routeRoot = '/users';
const userModel = require('../models/userModel');
const logger = require('../logger');
const errors = require('./errorController');
const {InvalidPasswordError, InvalidUsernameError, DatabaseError, IncorrectPasswordError, UserNotFoundError, UserAlreadyExistsError} = require('../models/errorModel');


async function createUser(request, response){

    let username = request.body.username;
    let password = request.body.password;

    userModel.addUser(username, password)
    .then(() => {
        // Set the cookie
        response.render('home.hbs', {homeActive: true})
    })
    .catch(error => {
        if (error instanceof UserAlreadyExistsError || error instanceof InvalidPasswordError || error instanceof InvalidUsernameError || error instanceof DatabaseError){
            logger.error(error.toString());

            response.status(400);
            response.render('home.hbs', {homeActive: true, error: error.message, status: 400});
        }
        else{
            logger.error(error);
            response.status(500).render('home.hbs', {homeActive: true, error: 'Something went wrong.', status: 500});
        }
    })
}
router.post('/', createUser);


module.exports = {
    router,
    routeRoot
}