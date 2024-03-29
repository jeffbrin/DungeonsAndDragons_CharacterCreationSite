const userModel = require('../models/userModel');
const { InvalidSessionError, DatabaseError } = require('../models/errorModel');
const logger = require('../logger');
const url = require('url');

/**
 * Gets a url format to be used in a redirect.
 * @param {String} pathname The path to redirect to
 * @param {Object} queryObject The object to put in the query.
 * @returns A url format to use in a redirect
 */
 function getUrlFormat(pathname, queryObject)
 {
     return url.format({ pathname: pathname, query: queryObject });
 }

/**
 * Authorizes a request and refreshes the user's session. 
 * If the user is logged in, the callback function is called, otherwise the user is redirected to the home page with an error.
 * The callbacks is called with the request and response objects.
 * The new session id is passed to the callback as the third argument.
 * request.cookie.sessionId will not be up to date after this method so using it will cuase invalid session errors
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 * @param {Promise} callback The asynchronous callback function to be called once the user is authenticated.
 */
async function gateAccess(request, response, callback) {

    // If there's no cookie
    if (!request.cookies || !request.cookies.sessionId) {
        response.clearCookie('sessionId')
        response.redirect(getUrlFormat('/home', { error: "You don't have access to the page you were just trying to reach, please log in and try again.", status: 401 }));
    }
    else {
        // Get the cookie and authenticate
        let username;
        await userModel.refreshSession(request.cookies.sessionId)
            .then(async newSession => {
                response.status(200);
                response.cookie("sessionId", newSession.sessionId, { expires: newSession.expiryDate });
                username = await userModel.getUsernameFromSessionId(newSession.sessionId);
                // Verify authentication
                await callback(request, response, newSession.sessionId);
            })
            .catch(error => {
                logger.error(error);
                if (error instanceof InvalidSessionError) {
                    // Delete the cookie since their session is invalid
                    response.clearCookie('sessionId');
                    response.redirect(getUrlFormat('/home', { error: "You don't have access to the page you were just trying to reach, please log in and try again.", status: 401 }));
                }
                else if (error instanceof DatabaseError) {
                    response.redirect(getUrlFormat('/home', { error: 'Something went wrong on our end, you may have been logged out.', status: 500 }));
                }
                else {
                    response.redirect(getUrlFormat('/home', { error: 'Something went wrong, if you were logged in, you may have been logged out.', status: 500 }));
                }
            })
    }

}

/**
 * Calls a different controller function depending on the user's login status.
 * If the user is logged in, their session is refreshed and the loggedInCallback is called, otherwise the loggedOutCallback is called.
 * The callbacks are called with the request and response objects as well as the user's username and id if the logged in function is called.
 * On a DatabaseError, the user is redirected to the home page with an error displayed.
 * @param {Object} request An http request object.
 * @param {Object} response An http response object.
 * @param {Promise} callback The asynchronous callback function to be called if the the user is logged in.
 * @param {Promise} callback The asynchronous callback function to be called if the the user is not logged in.
 */
async function loadDifferentPagePerLoginStatus(request, response, loggedInCallback, loggedOutCallback) {
    // Check if there are no cookies
    if (!request.cookies) {
        await loggedOutCallback(request, response)
    }
    else {
        // Get the cookie and authenticate
        await userModel.refreshSession(request.cookies.sessionId)
            .then(async newSession => {
                response.cookie("sessionId", newSession.sessionId, { expires: newSession.expiryDate });
                await loggedInCallback(request, response, await userModel.getUsernameFromSessionId(newSession.sessionId), await userModel.getUserIdFromSessionId(newSession.sessionId));
            })
            .catch(async error => {
                logger.error(error);
                if (error instanceof InvalidSessionError) {
                    // Delete the cookie
                    response.clearCookie('sessionId');
                    await loggedOutCallback(request, response);
                }
                else if (error instanceof DatabaseError) {
                    response.redirect(getUrlFormat('/home', { error: 'Something went wrong on our end, you may have been logged out.', status: 500 }));
                }
                else {
                    response.redirect(getUrlFormat('/home', { error: 'Something went wrong, if you were logged in, you may have been logged out.' }));
                }
            })
    }
}

module.exports = { gateAccess, loadDifferentPagePerLoginStatus }