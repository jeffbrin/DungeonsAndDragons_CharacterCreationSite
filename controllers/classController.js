const express = require('express');
const router = express.Router();
const routeRoot = '/classes';
const model = require('../models/classModel');
const authenticator = require('./authenticationHelperController')
const errors = require('../models/errorModel');
const {DatabaseError, InvalidInputError} = require('../models/errorModel');
const userModel = require('../models/userModel');
const raceModel = require('../models/raceModel');
const hbs = require('express-handlebars').create();
let allRaces;

hbs.handlebars.registerHelper('randomRace', () => {
    return allRaces[Math.floor(Math.random() * allRaces.length)].Name;
});

hbs.handlebars.registerHelper('equals', (arg1, arg2) =>
{
    if (!arg1 && !arg2)
        return true;
    return arg1 == arg2;
});


function uniqueList(list){
    const newList = [];
    for (let i = 0; i < list.length; i++){
        if(!newList.includes(list[i]))
            newList.push(list[i])
    }
    newList.sort(function(a, b){return a - b});
    return newList;
}

/**
 * on a get request, the getAllClasses method from the model is called
 * responds with correct error codes depending on type of error thrown in the model method
 * @param {HTTPRequest} request 
 * @param {HTTPResponse} response
 */
 async function getAllClasses(request, response, username) {
    try {
         // On the first request, get all the classes
         if(!allRaces)
         allRaces = await raceModel.getAllRaces();
        
        let found = await model.getAllClasses();
        console.log(found);
        // console.log(found[0])
        response.status(201).render('classes.hbs', { classesActive: true, classes: found, username: username });
    }
    catch (error) {
        if (error instanceof errors.DatabaseError) {
            response.status(500).render('classes.hbs', { error: true, message: "Database error, Couldn't get Classes" });
            console.log("Database Error - From getAllClasses in classController");
        }
        else if (error instanceof errors.InvalidInputError) {
            response.status(400).render('classes.hbs', { error: true, message: "Input Error, Couldn't get all Classes" });
            console.log('input error - from getAllClasses in classController');
        }
        else{
            console.log(error.message);
        }
    }
}

// Using loadDifferentPagePerLoginStatus to automatically refresh the session
router.get('/', (request, response) => {authenticator.loadDifferentPagePerLoginStatus(request, response, getAllClasses, getAllClasses)});


// Focus on a specific Class
async function showSpecificClass(request, response, username){
    console.log("Inside showSpecificClass");
    try{
        console.log("about to get specific Class")
        const Class = await model.getClass(request.params.id);
        console.log(Class);
        response.status(200).render('classFocus.hbs', {Class: Class, username: username, classesActive: true, Levels: uniqueList(Class.Features.map(feature => Number(feature.Level)))})
    }
    catch(error){
        if (error instanceof DatabaseError){
            response.status(500).render('home.hbs', {homeActive: true, error: 'An error occured getting the list of classes. Please wait a moment and try again.', status: 500});
        }
        else if (error instanceof InvalidInputError){
            console.log(error)
            response.status(400).render('home.hbs', {homeActive: true, error: 'You tried to access an invalid Class.', status: 400});
        }
        else{
            console.log(error)
            response.status(500).render('home.hbs', {homeActive: true, error: 'Something went wrong', status: 500});
        }
    }
}
router.get('/:id', (request, response) => {authenticator.loadDifferentPagePerLoginStatus(request, response, showSpecificClass, showSpecificClass)})



module.exports = {
    router,
    routeRoot
}