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
    .then( async (newSession) => {
        // Set the cookie and render the home page
        response.cookie("sessionId", newSession.sessionId, { expires: newSession.expiryDate }); 
        response.render('home.hbs', {homeActive: true, username: await userModel.getUsernameFromSessionId(newSession.sessionId)})
    })
    .catch(error => {
        if (error instanceof UserAlreadyExistsError){
            logger.error(error.toString());

            response.status(400);
            response.render('home.hbs', {homeActive: true, signupError: 'Username already exists.'});
        }
        else if (error instanceof InvalidPasswordError){
            logger.error(error.toString());

            response.status(400);
            response.render('home.hbs', {homeActive: true, signupError: `Invalid password.`});
        }
        else if(error instanceof InvalidUsernameError){
            logger.error(error.toString());

            response.status(400);
            response.render('home.hbs', {homeActive: true, signupError: 'Invalid username.'});
        }
        else if(error instanceof DatabaseError){
            logger.error(error.toString());

            response.status(500);
            response.render('home.hbs', {homeActive: true, error: 'Something went wrong on our end. Please wait a moment and try signing in again.', status: 500});
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