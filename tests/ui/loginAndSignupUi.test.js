const userModel = require('../../models/userModel');
const dbName = 'dnd_db_testing'
const home = "http://localhost:1339";

const VALID_USERNAME = 'newUser';
const VALID_PASSWORD = 'Password1';

beforeEach(async () => {
    await userModel.initialize(dbName, true);

    // load home page and wait until it is fully loaded
    await page.goto(home, { waitUntil: "domcontentloaded" });

    // Disable smooth scrolling from bootstrap
    await page.addStyleTag({ content: ":root{scroll-behavior: auto !important;}" });

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
})


afterEach(async () => {
    try {
        await userModel.closeConnection();
    } catch (error) {
        console.error(error);
    }
});


/**
 * Gets the lower case text content of the element with the selector passed.
 * @param {String} selector The jquery selector for the element to get the text of.
 */
async function getElementText(selector){
    await page.waitForSelector(selector)
    let element = await page.$(selector);
    let text = await page.evaluate(el => el.textContent, element);
    return text.toLowerCase();
}

async function waitForSeconds(seconds){
    return new Promise((resolve, reject) => {setTimeout(() => {
        resolve();
    }, 1000 * seconds);})
}

// Login
test('Home Page - Login - Valid data', async () => {

    await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);

    // Click on the login button
    const loginButton = await page.$('#loginButton');
    await Promise.all([    
        loginButton.evaluate(b => b.click())
    ]);

    await waitForSeconds(1);

    // Enter the username
    await page.type('#usernameLogin', VALID_USERNAME);

    // Enter the password
    await page.type('#passwordLogin', VALID_PASSWORD);

    // Submit
    const submitButton = await page.$('#loginSubmitButton');
    await Promise.all([    
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),    
        submitButton.evaluate(b => b.click())
    ]);

    const textLower = await getElementText('header');
    expect(textLower).toContain(VALID_USERNAME.toLowerCase());

})

test('Home Page - Login - Empty username', async () => {

    await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);

    // Click on the login button
    const loginButton = await page.$('#loginButton');
    await Promise.all([    
        loginButton.evaluate(b => b.click())
    ]);

    await waitForSeconds(1);

    // Enter the password
    await page.type('#passwordLogin', VALID_PASSWORD);

    // Submit
    const submitButton = await page.$('#loginSubmitButton');
    await Promise.all([    
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),    
        submitButton.evaluate(b => b.click())
    ]);

    // Error is shown
    const textLower = await getElementText('#loginErrorText');
    expect(textLower == null).toBe(false);

})

test('Home Page - Login - Empty password', async () => {

    await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);

    // Click on the login button
    const loginButton = await page.$('#loginButton');
    await Promise.all([    
        loginButton.evaluate(b => b.click())
    ]);

    await waitForSeconds(1);

    // Enter the username
    await page.type('#usernameLogin', VALID_USERNAME);

    // Submit
    const submitButton = await page.$('#loginSubmitButton');
    await Promise.all([    
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),    
        submitButton.evaluate(b => b.click())
    ]);

    // Error is shown
    const textLower = await getElementText('#loginErrorText');
    expect(textLower == null).toBe(false);

})

test('Home Page - Login - User does not exist', async () => {

    // Click on the login button
    const loginButton = await page.$('#loginButton');
    await Promise.all([    
        loginButton.evaluate(b => b.click())
    ]);

    await waitForSeconds(1);

    // Enter the username
    await page.type('#usernameLogin', VALID_USERNAME);

    // Enter the password
    await page.type('#passwordLogin', VALID_PASSWORD);

    // Submit
    const submitButton = await page.$('#loginSubmitButton');
    await Promise.all([    
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),    
        submitButton.evaluate(b => b.click())
    ]);

    // Error is shown
    const textLower = await getElementText('#loginErrorText');
    expect(textLower == null).toBe(false);

})

// Cookie
test('Home Page - Refresh - Stay signed in', async () => {

    await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);

    // Click on the login button
    const loginButton = await page.$('#loginButton');
    await Promise.all([    
        loginButton.evaluate(b => b.click())
    ]);

    await waitForSeconds(1);

    // Enter the username
    await page.type('#usernameLogin', VALID_USERNAME);

    // Enter the password
    await page.type('#passwordLogin', VALID_PASSWORD);

    // Submit
    const submitButton = await page.$('#loginSubmitButton');
    await Promise.all([    
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),    
        submitButton.evaluate(b => b.click())
    ]);

    // Logged in
    let textLower = await getElementText('header');
    expect(textLower).toContain(VALID_USERNAME.toLowerCase());

    page.goto(home, {waitUntil: 'domcontentloaded'});

    // Username is still there
    textLower = await getElementText('header');
    expect(textLower).toContain(VALID_USERNAME.toLowerCase());

})

// Sign up
test('Home Page - Sign up - Valid data', async () => {

    // Click on the signup button
    const signupButton = await page.$('#signupButton');
    await Promise.all([    
        signupButton.evaluate(b => b.click())
    ]);

    await waitForSeconds(1);

    // Enter the username
    await page.type('#usernameSignup', VALID_USERNAME);

    // Enter the password
    await page.type('#passwordSignup', VALID_PASSWORD);

    // Submit
    const submitButton = await page.$('#signupSubmitButton');
    await Promise.all([    
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),    
        submitButton.evaluate(b => b.click())
    ]);

    const textLower = await getElementText('header');
    expect(textLower).toContain(VALID_USERNAME.toLowerCase());

})

test('Home Page - Sign up - Empty username', async () => {

    await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);

    // Click on the signup button
    const signupButton = await page.$('#signupButton');
    await Promise.all([    
        signupButton.evaluate(b => b.click())
    ]);

    await waitForSeconds(1);

    // Enter the password
    await page.type('#passwordSignup', VALID_PASSWORD);

    // Submit
    const submitButton = await page.$('#signupSubmitButton');
    await Promise.all([    
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),    
        submitButton.evaluate(b => b.click())
    ]);

    // Error is shown
    const textLower = await getElementText('#signupErrorText');
    expect(textLower == null).toBe(false);

})

test('Home Page - Sign up - Empty password', async () => {

    await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);

    // Click on the signup button
    const signupButton = await page.$('#signupButton');
    await Promise.all([    
        signupButton.evaluate(b => b.click())
    ]);

    // Enter the username
    await page.type('#usernameSignup', VALID_USERNAME);

    // Submit
    const submitButton = await page.$('#signupSubmitButton');
    await Promise.all([    
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),    
        submitButton.evaluate(b => b.click())
    ]);

    // Error is shown
    const textLower = await getElementText('#signupErrorText');
    expect(textLower == null).toBe(false);

})

test('Home Page - Sign up - User already exists', async () => {

    await userModel.addUser(VALID_USERNAME, VALID_PASSWORD);

    // Click on the signup button
    const signupButton = await page.$('#signupButton');
    await Promise.all([    
        signupButton.evaluate(b => b.click())
    ]);

    await waitForSeconds(1);

    // Enter the username
    await page.type('#usernameSignup', VALID_USERNAME);

    // Enter the password
    await page.type('#passwordSignup', VALID_PASSWORD);

    // Submit
    const submitButton = await page.$('#signupSubmitButton');
    await Promise.all([    
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),    
        submitButton.evaluate(b => b.click())
    ]);

    // Error is shown
    const textLower = await getElementText('#signupErrorText');
    expect(textLower == null).toBe(false);

})

// Log out
test('Home Page - Logout', async () => {

    // Click on the signup button
    const signupButton = await page.$('#signupButton');
    await Promise.all([    
        signupButton.evaluate(b => b.click())
    ]);

    await waitForSeconds(1);

    // Enter the username
    await page.type('#usernameSignup', VALID_USERNAME);

    // Enter the password
    await page.type('#passwordSignup', VALID_PASSWORD);

    // Submit
    const submitButton = await page.$('#signupSubmitButton');
    await Promise.all([    
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),    
        submitButton.evaluate(b => b.click())
    ]);

    let textLower = await getElementText('header');
    expect(textLower).toContain(VALID_USERNAME.toLowerCase());

    // Logout
    const logoutButton = await page.$('#logoutButton');
    await Promise.all([    
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }), 
        logoutButton.evaluate(b => b.click())
    ]);

    textLower = await getElementText('header');
    expect(textLower).not.toContain(VALID_USERNAME.toLowerCase());
})