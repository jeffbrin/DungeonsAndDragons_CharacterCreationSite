const express = require('express');
const app = express();
const {engine} = require('express-handlebars');
const bodyParser = require('body-parser');
const expressListRoutes = require('express-list-routes');
const cookieParser = require('cookie-parser');
const characterController = require('./controllers/characterController')

// Logger
const logger = require('./logger');
const pinohttp = require('pino-http');
const userModel = require('./models/userModel');
const { request } = require('express');
const httpLogger = pinohttp({
    logger: logger
});
app.use(httpLogger);
app.use(cookieParser());


app.use(express.json())
const controllers = ['themeController', 'classController', 'backgroundController', 'spellController', 'raceController', 'characterController', 'userController', 'sessionController', 'homeController', 'sourcesController', 'errorController'];


// Tell the app to use handlebars templating engine.  
// Configure the engine to use a simple .hbs extension to simplify file naming
app.engine('hbs', engine({ extname: '.hbs'}));
app.set('view engine', 'hbs');
app.set('views', './views');  // indicate folder for views

// Add support for forms
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'))

// Middleware
app.use((request, response, next) => {
    alterMethodWhenIndicatedByChoice(request, response, next);
})

app.use((request, response, next) => {addRecentCharactersCookie(request, response, next);} );

async function addRecentCharactersCookie(request, response, next) {
    try{
        response.locals.recentCharacters = await characterController.getCookieObjectFromRequestAndUserId(request, 
            await userModel.getUserIdFromSessionId(request.cookies.sessionId));
    }
    catch(error){
        logger.info(`Unable to get recent characters for a user: ${error}`)
    }
    next();
}

app.use((request, response, next) => {lightTheme(request, response, next);} );

async function lightTheme(request, response, next) {
    try{
        response.locals.lightTheme = JSON.parse(request.cookies.lightTheme);
    }
    catch(error){
        logger.info(`Unable to get Theme: ${error}`)
    }
    next();
}


/**
 * Changes the method of an http request if the body contains a property called choice
 * with the following format. choice: '{"method": "METHOD_VALUE"}'
 * @param {Object} request An http request object.
 * @param {Object} response An http request object.
 * @param {Function} next The method called to end this method.
 */
function alterMethodWhenIndicatedByChoice (request, response, next){
    if(request.body.choice){

        try{
            let choice = JSON.parse(request.body.choice);
            
            if(choice.method)
                request.method = choice.method;
            if(choice.action)
                request.action = choice.action;
        }
        catch(error){
            // Choice was not JSON
        }
        
    }
    else if(request.query.choice){

        try{
            let choice = JSON.parse(request.query.choice);
            
            if(choice.method)
                request.method = choice.method;
            if(choice.action)
                request.url = choice.action;
        }
        catch(error){
            // Choice was not JSON
        }
        
    }
    next();
}

// Register routes from all controllers 
// Assumes a flat directory structure and common ‘routeRoot’ / 'router’ exports
controllers.forEach((controllerName) => {
    try {
        const controllerRoutes = require('./controllers/' + controllerName);
        app.use(controllerRoutes.routeRoot, controllerRoutes.router);
    } catch (err) {
        //fail gracefully if no routes for this controller
        console.error(`Failed to use controller (${controllerName}):`)
        console.error(err);
    }    
})

// List out all created routes 
expressListRoutes(app, {prefix: '/'});

module.exports = app;
