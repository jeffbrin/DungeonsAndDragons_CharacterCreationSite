const express = require('express');
const app = express();
const {engine} = require('express-handlebars');
const bodyParser = require('body-parser');
const expressListRoutes = require('express-list-routes');

// Logger
const logger = require('./logger');
const pinohttp = require('pino-http');
const httpLogger = pinohttp({
    logger: logger
});
app.use(httpLogger);


const port = 1339;

app.use(express.json())
const controllers = ['spellController', 'homeController', 'errorController'];


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
    middleware(request, response, next);
})

function middleware (request, response, next){
    if(request.body.choice){

        try{
            let choice = JSON.parse(request.body.choice);
            
            if(choice.method)
                request.method = choice.method;
        }
        catch(error){
            // console.log(`Error parching request.body.choice (likely from a button): ${error}`);
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
