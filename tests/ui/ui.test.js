// const spellModel = require('../models/spellModel');
// const dbName = 'dnd_db_testing'
// const home = "http://localhost:1339";
// let spellSchools;

// const randomSpells = [
//     { level: 0, name: 'Acid Splash', schoolId: 1, description: 'Splashes some acid on someone - Ranged spell attack (1d6 acid damage).' },
//     { level: 1, name: 'Absorb Elements', schoolId: 2, description: 'The spell captures some of the incoming energy, lessening its effect on you and storing it for your next melee attack.' },
//     { level: 2, name: 'Acid Arrow', schoolId: 1, description: 'A shimmering green arrow streaks toward a target within range and bursts in a spray of acid. Make a ranged spell attack against the target.' },
//     { level: 3, name: 'Animate Dead', schoolId: 3, description: 'This spell creates an undead servant. ' },
//     { level: 4, name: 'Dimension Door', schoolId: 4, description: 'You teleport yourself from your current location to any other spot within range. ' },
//     { level: 5, name: 'Legend Lore', schoolId: 5, description: 'Name or describe a person, place, or object. The spell brings to your mind a brief summary of the significant lore about the thing you named.' },
//     { level: 6, name: 'Programmed Illusion', schoolId: 6, description: 'You create an illusion of an object, a creature, or some other visible phenomenon within range that activates when a specific condition occurs. ' },
//     { level: 7, name: 'Etherealness', schoolId: 7, description: 'You step into the border regions of the Ethereal Plane, in the area where it overlaps with your current plane. ' },
//     { level: 8, name: 'Dominate Monster', schoolId: 8, description: 'You attempt to beguile a creature that you can see within range. It must succeed on a Wisdom saving throw or be charmed by you for the duration. ' },
//     { level: 9, name: 'Power Word Kill', schoolId: 8, description: 'You utter a word of power that can compel one creature you can see within range to die instantly. If the creature you choose has 100 hit points or fewer, it dies.' }
// ]

// /**
//  * Gets a copy of a random spell.
//  * @returns A copy of a random spell from an array of premade spells.
//  */
// function getRandomSpell() {
//     const random = Math.floor(Math.random() * randomSpells.length);
//     return { ...randomSpells.slice(random, random + 1)[0] };
// }

// beforeEach(async () => {
//     await spellModel.initialize(dbName, true);
//     // load home page and wait until it is fully loaded
//     await page.goto(home, { waitUntil: "domcontentloaded" });

//     // Disable smooth scrolling from bootstrap
//     await page.addStyleTag({ content: ":root{scroll-behavior: auto !important;}" });

//     if (!spellSchools)
//         spellSchools = await spellModel.getAllSchools();

//     await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
// })


// afterEach(async () => {
//     try {
//         await spellModel.closeConnection();
//     } catch (error) {
//         console.error(error);
//     }
// });

// /**
//  * Gets the lower case text content of the element with the selector passed.
//  * @param {String} selector The jquery selector for the element to get the text of.
//  */
// async function getElementText(selector){
//     await page.waitForSelector(selector)
//     let element = await page.$(selector);
//     let text = await page.evaluate(el => el.textContent, element);
//     return text.toLowerCase();
// }

// /**
//  * Gets the lower case value of the input element with the selector passed.
//  * @param {String} selector The jquery selector for the element to get the text of.
//  */
//  async function getInputValue(selector){
//     await page.waitForSelector(selector)
//     let element = await page.$(selector);
//     let text = await page.evaluate(el => el.value, element);
//     return text.toLowerCase();
// }

// /**
//  * Gets the number of elements with the selector
//  * @param {String} selector The jquery selector for the elements to find.
//  */
//  async function getNumberOfElements(selector){
//     try{
//         let elements = await page.$$(selector);
//         return elements.length;
//     }
//     catch(error){
//         return 0;
//     }
// }

// // Navigation
// test('Invalid URL - Navigates to 404 Error page', async () => {
//     await page.goto(`${home}/archibald`, {waitUntil: 'domcontentloaded'});

//     const pageText = await getElementText('#container');

//     expect(pageText).toContain('404 error');
//     expect(pageText).toContain("it looks like you entered an invalid url and got lost");
// })

// test('Home Page - Nagivate to spells through nav bar', async () => {

//     // Nagivate
//     await page.click('#spellsHeaderLink', { waitUntil: "domcontentloaded" });

//     // Check that it's the right page
//     const textLower = await getElementText('#addSpellsHeader');

//     expect(textLower).toContain("add your own spells")

// })

// test('Home Page - Nagivate to spells through features', async () => {

//     // Nagivate
//     await page.click('#spellsFeaturesLink', { waitUntil: "domcontentloaded" });

//     // Get the text
//     const textLower = await getElementText('#addSpellsHeader');

//     expect(textLower).toContain("add your own spells")

// })

// test('Spells Page - Nagivate to home through nav bar', async () => {

//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'})

//     // Nagivate
//     await page.click('#homeHeaderLink', { waitUntil: "domcontentloaded" });


//     // Check that it's the right page
//     const textLower = await getElementText('h1');
//     expect(textLower).toContain("mind flayer's atheneum");

// })

// // Add a new spell
// test('Spells Page - Add a new spell - Success', async() => {

//         // Go to the spells page
//         await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//         // Enter random spell into the form
//         const { level, name, schoolId, description } = getRandomSpell();
//         await page.select('#levelSelectAdd', `${level}`);
//         await page.type('#nameInputAdd', name);
//         await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//         await page.type('#descriptionInputAdd', description);

//         // click form's submit button and wait for new page to load
//         await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });

//         // Extract all the text content on the page  
//         const textLower = await getElementText('#spellDisplayTable');
    
//         // Verify successful outcome - spell is displayed in the table
//         expect(textLower).toContain(`${level}`);
//         expect(textLower).toContain(name.toLowerCase());
//         expect(textLower).toContain(spellSchools[schoolId-1].name.toLowerCase());
//         expect(textLower).toContain(description.toLowerCase());
// })

// test('Spells Page - Add a new spell - Fail - Required prevents empty name', async() => {

//     // Go to the spells page
//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//     // Enter random spell into the form
//     const { level, name, schoolId, description } = getRandomSpell();
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', '');
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });

//     // Extract all the text content on the page  
//     const rows = await getNumberOfElements('.spell');

//     // No spells should be added
//     expect(rows).toBe(0);

// })

// test('Spells Page - Add a new spell - Fail - Invalid name displays error', async() => {

//     // Go to the spells page
//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//     // Enter random spell into the form
//     const { level, name, schoolId, description } = getRandomSpell();
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', '100');
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });

//     // Extract all the text content on the page 
//     const errorText = await getElementText('#alert');
//     const rows = await getNumberOfElements('.spell');

//     // No spells should be added
//     expect(rows).toBe(0);
//     expect(errorText).toContain("400");
//     expect(errorText).toContain("should not contain numbers");

// })

// test('Spells Page - Add a new spell - Fail - Existing spell with new description displays warning', async() => {

//     // Go to the spells page
//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//     // Enter random spell into the form twice
//     const { level, name, schoolId, description } = getRandomSpell();
    
//     // Add the spell
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });

//     // Add the spell a second time
//     await new Promise((resolve, reject) => {setTimeout(() => {
//         resolve()
//     }, 100);})
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description + 'New');

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });

//     // Extract all the text content on the page 
//     const errorText = await getElementText('#alert');
//     const rows = await getNumberOfElements('.spell');

//     // 1 spell should be added and a warning should come up
//     expect(rows).toBe(1);
//     expect(errorText).toContain("warning");
//     expect(errorText).toContain("a spell with the same details already exists");

// })


// // Delete Spells
// test('Spells Page - Delete a spell - Success', async() => {

//     // Go to the spells page
//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//     // Enter random spell into the form
//     const { level, name, schoolId, description } = getRandomSpell();
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     await page.waitForSelector('#deleteSpell1')
//     const button = await page.$('#deleteSpell1');
//     await button.evaluate(b => b.click({waitUntil: 'domcontentloaded'}));

//     // Make sure there are no spells
//     const spellRows = await getNumberOfElements('.spell');
//     expect(spellRows).toBe(0);
// })

// test('Spells Page - Delete a spell in the edit view - Success', async() => {

//     // Go to the spells page
//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//     // Enter random spell into the form
//     const { level, name, schoolId, description } = getRandomSpell();
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     await page.waitForSelector('#editSpell1')
//     const editButton = await page.$('#editSpell1');
//     await editButton.evaluate(b => b.click({waitUntil: 'domcontentloaded'}));

//     await page.waitForSelector('#deleteSpell1')
//     const button = await page.$('#deleteSpell1');
//     await button.evaluate(b => b.click({waitUntil: 'domcontentloaded'}));

//     // Make sure there are no spells 
//     const spellRows = await getNumberOfElements('.spell');
//     expect(spellRows).toBe(0);
// })

// // Edit Spell
// test('Spells Page - Edit a spell - Success', async() => {

//     // Go to the spells page
//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//     // Enter random spell into the form
//     const { level, name, schoolId, description } = getRandomSpell();
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     await page.waitForSelector('#editSpell1')
//     const editButton = await page.$('#editSpell1');
//     await editButton.evaluate(b => b.click({waitUntil: 'domcontentloaded'}));

//     // Edit the spell
//     await new Promise((resolve, reject) => {setTimeout(() => {
//         resolve();
//     }, 100);})
//     await page.type('#updateFormLevel', `9`);
//     await page.type('#updateFormName', 'New Spell');
//     await page.type('#updateFormSchool', spellSchools[0].name);
//     await page.type('#updateFormDescription', 'New Description');

//     await page.waitForSelector('#confirmEditSpell1');
//     const confirmEditButton = await page.$('#confirmEditSpell1');
//     await confirmEditButton.evaluate(b => b.click({waitUntil: 'domcontentloaded'}));
    

//     // Make sure the spell was added
//     await page.waitForSelector('.spell');
//     const spellRows = await getNumberOfElements('.spell');
//     expect(spellRows).toBe(1);

//     // Make sure the spell was edited
//     await new Promise((resolve, reject) => {setTimeout(() => {
//         resolve();
//     }, 100);})
//     // Extract all the text content on the page  
//     const textLower = await getElementText('#spellDisplayTable');
    
//     // Verify successful outcome - spell is displayed in the table
//     expect(textLower).toContain(`9`);
//     expect(textLower).toContain('new spell');
//     expect(textLower).toContain(spellSchools[0].name.toLowerCase());
//     expect(textLower).toContain('new description');
// })

// test('Spells Page - Edit a spell - Fail - invalid name', async() => {

//     // Go to the spells page
//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//     // Enter random spell into the form
//     const { level, name, schoolId, description } = getRandomSpell();
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     await page.waitForSelector('#editSpell1')
//     const editButton = await page.$('#editSpell1');
//     await editButton.evaluate(b => b.click({waitUntil: 'domcontentloaded'}));

//     // Edit the spell
//     await new Promise((resolve, reject) => {setTimeout(() => {
//         resolve();
//     }, 100);})
//     await page.type('#updateFormLevel', `9`);
//     await page.type('#updateFormName', '100'); // Invalid name
//     await page.type('#updateFormSchool', spellSchools[0].name);
//     await page.type('#updateFormDescription', 'New Description');

//     await page.waitForSelector('#confirmEditSpell1');
//     const confirmEditButton = await page.$('#confirmEditSpell1');
//     await confirmEditButton.evaluate(b => b.click({waitUntil: 'domcontentloaded'}));
    

//     // Make sure the spell was added
//     await page.waitForSelector('.spell');
//     const spellRows = await getNumberOfElements('.spell');
//     expect(spellRows).toBe(1);

//     // There should be a warning
//     const warningText = await getElementText('#alert');
//     expect(warningText).toContain('400');
//     expect(warningText).toContain('invalid input: spell name should not contain numbers');
// })

// // Filter spells
// test('Spells Page - Filter on name - Success', async() => {

//     // Go to the spells page
//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//     // Enter random spell into the form
//     const { level, name, schoolId, description } = getRandomSpell();
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter the spell again with a pre and postfix
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', `pre${name}post`);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter a completely different spell
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${(level + 1) % 10}`);
//     await page.type('#nameInputAdd', 'notthesame');
//     await page.type('#schoolSelectAdd', spellSchools[(schoolId) % spellSchools.length].name);
//     await page.type('#descriptionInputAdd', 'Description');

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });

//     // Make sure all the spells were added
//     await page.waitForSelector('.spell');
//     const spellRows = await getNumberOfElements('.spell');
//     expect(spellRows).toBe(3);

//     // Filter
//     await page.type('#nameInputFilter', name);
//     await page.click('#filterSubmit', {waitUntil: 'domcontentloaded'});

//     // verify the filtering
//     await page.waitForSelector('.spell');
//     const filteredSpellRows = await getNumberOfElements('.spell');
//     expect(filteredSpellRows).toBe(2);
    
//     // Make sure the filter stayed the same
//     const filterValue = await getInputValue('#nameInputFilter')
//     expect(filterValue).toContain(name.toLowerCase());
// })

// test('Spells Page - Filter on level - Success', async() => {

//     // Go to the spells page
//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//     // Enter random spell into the form
//     const { level, name, schoolId, description } = getRandomSpell();
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter the spell again with a pre and postfix
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', `pre${name}post`);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter a completely different spell
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${(level + 1) % 10}`);
//     await page.type('#nameInputAdd', 'notthesame');
//     await page.type('#schoolSelectAdd', spellSchools[(schoolId) % spellSchools.length].name);
//     await page.type('#descriptionInputAdd', 'Description');

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });

//     // Make sure all the spells were added
//     await page.waitForSelector('.spell');
//     const spellRows = await getNumberOfElements('.spell');
//     expect(spellRows).toBe(3);

//     // Filter
//     await page.type('#levelSelectFilter', `${level}`);
//     await page.click('#filterSubmit', {waitUntil: 'domcontentloaded'});

//     // verify the filtering
//     await page.waitForSelector('.spell');
//     const filteredSpellRows = await getNumberOfElements('.spell');
//     expect(filteredSpellRows).toBe(2);
    
//     // Make sure the filter stayed the same
//     const filterValue = await getInputValue('#levelSelectFilter')
//     expect(filterValue).toContain(`${level}`);
// })

// test('Spells Page - Filter on school - Success', async() => {

//     // Go to the spells page
//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//     // Enter random spell into the form
//     const { level, name, schoolId, description } = getRandomSpell();
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter the spell again with a pre and postfix
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', `pre${name}post`);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter a completely different spell
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${(level + 1) % 10}`);
//     await page.type('#nameInputAdd', 'notthesame');
//     await page.type('#schoolSelectAdd', spellSchools[(schoolId) % spellSchools.length].name);
//     await page.type('#descriptionInputAdd', 'Description');

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });

//     // Make sure all the spells were added
//     await page.waitForSelector('.spell');
//     const spellRows = await getNumberOfElements('.spell');
//     expect(spellRows).toBe(3);

//     // Filter
//     await page.type('#schoolSelectFilter', spellSchools[schoolId-1].name);
//     await page.click('#filterSubmit', {waitUntil: 'domcontentloaded'});

//     // verify the filtering
//     await page.waitForSelector('.spell');
//     const filteredSpellRows = await getNumberOfElements('.spell');
//     expect(filteredSpellRows).toBe(2);
    
//     // Make sure the filter stayed the same
//     const filterValue = await getInputValue('#schoolSelectFilter')
//     expect(filterValue).toContain(`${spellSchools[schoolId-1].id}`);
// })

// test('Spells Page - Filter on name - Failure - Invalid name', async() => {

//     // Go to the spells page
//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//     // Enter random spell into the form
//     const { level, name, schoolId, description } = getRandomSpell();
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter the spell again with a pre and postfix
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', `pre${name}post`);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter a completely different spell
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${(level + 1) % 10}`);
//     await page.type('#nameInputAdd', 'notthesame');
//     await page.type('#schoolSelectAdd', spellSchools[(schoolId) % spellSchools.length].name);
//     await page.type('#descriptionInputAdd', 'Description');

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });

//     // Make sure all the spells were added
//     await page.waitForSelector('.spell');
//     const spellRows = await getNumberOfElements('.spell');
//     expect(spellRows).toBe(3);

//     // Filter
//     await page.type('#nameInputFilter', "100");
//     await page.click('#filterSubmit', {waitUntil: 'domcontentloaded'});

//     // All spells should be shown
//     await page.waitForSelector('.spell');
//     const filteredSpellRows = await getNumberOfElements('.spell');
//     expect(filteredSpellRows).toBe(3);
    
//     // Make sure the filter stayed the same
//     const alertText = await getElementText('#alert')
//     expect(alertText).toContain("400");
//     expect(alertText).toContain("invalid data: spell name should not contain numbers");
// })


// test('Spells Page - Filter on name - Failure - Invalid name', async() => {

//     // Go to the spells page
//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//     // Enter random spell into the form
//     const { level, name, schoolId, description } = getRandomSpell();
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter the spell again with a pre and postfix
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', `pre${name}post`);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter a completely different spell
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${(level + 1) % 10}`);
//     await page.type('#nameInputAdd', 'notthesame');
//     await page.type('#schoolSelectAdd', spellSchools[(schoolId) % spellSchools.length].name);
//     await page.type('#descriptionInputAdd', 'Description');

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });

//     // Make sure all the spells were added
//     await page.waitForSelector('.spell');
//     const spellRows = await getNumberOfElements('.spell');
//     expect(spellRows).toBe(3);

//     // Filter
//     await page.click('#filterSubmit', {waitUntil: 'domcontentloaded'});

//     // All spells should be shown
//     await page.waitForSelector('.spell');
//     const filteredSpellRows = await getNumberOfElements('.spell');
//     expect(filteredSpellRows).toBe(3);
// })

// // Delete spells with name
// test('Spells Page - Delete all spells with name - Success', async() => {

//     // Go to the spells page
//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//     // Enter random spell into the form
//     const { level, name, schoolId, description } = getRandomSpell();
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter the spell again with a new school
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[(schoolId) % spellSchools.length].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter a completely different spell
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${(level + 1) % 10}`);
//     await page.type('#nameInputAdd', 'notthesame');
//     await page.type('#schoolSelectAdd', spellSchools[(schoolId) % spellSchools.length].name);
//     await page.type('#descriptionInputAdd', 'Description');

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });

//     // Make sure all the spells were added
//     await page.waitForSelector('.spell');
//     const spellRows = await getNumberOfElements('.spell');
//     expect(spellRows).toBe(3);

//     // Delete the first two spells
//     await page.waitForSelector('#removeByNameInput');
//     await page.type('#removeByNameInput', name);

//     await page.waitForSelector('#removeByNameSubmit')
//     const button = await page.$('#removeByNameSubmit');
//     await button.evaluate(b => b.click({waitUntil: 'domcontentloaded'}));

//     // One spell should be left
//     await page.waitForSelector('.spell');
//     const filteredSpellRows = await getNumberOfElements('.spell');
//     expect(filteredSpellRows).toBe(1);

// })

// test('Spells Page - Delete all spells with name - Failure - Invalid name', async() => {

//     // Go to the spells page
//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//     // Enter random spell into the form
//     const { level, name, schoolId, description } = getRandomSpell();
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter the spell again with a new school
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[(schoolId) % spellSchools.length].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter a completely different spell
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${(level + 1) % 10}`);
//     await page.type('#nameInputAdd', 'notthesame');
//     await page.type('#schoolSelectAdd', spellSchools[(schoolId) % spellSchools.length].name);
//     await page.type('#descriptionInputAdd', 'Description');

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });

//     // Make sure all the spells were added
//     await page.waitForSelector('.spell');
//     const spellRows = await getNumberOfElements('.spell');
//     expect(spellRows).toBe(3);

//     // Delete the first two spells
//     await page.waitForSelector('#removeByNameInput');
//     await page.type('#removeByNameInput', "100");

//     await page.waitForSelector('#removeByNameSubmit')
//     const button = await page.$('#removeByNameSubmit');
//     await button.evaluate(b => b.click({waitUntil: 'domcontentloaded'}));

//     // All the spells should be displayed
//     await page.waitForSelector('.spell');
//     const filteredSpellRows = await getNumberOfElements('.spell');
//     expect(filteredSpellRows).toBe(3);

//     // Make sure the filter stayed the same
//     const alertText = await getElementText('#alert')
//     expect(alertText).toContain("400");
//     expect(alertText).toContain("invalid input: error: spell name should not contain numbers.");

// })

// // Change Spell Names
// test('Spells Page - Change all spell names from x to y - Success', async() => {

//     // Go to the spells page
//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//     // Enter random spell into the form
//     const { level, name, schoolId, description } = getRandomSpell();
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter the spell again with a new school
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[(schoolId) % spellSchools.length].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter a completely different spell
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${(level + 1) % 10}`);
//     await page.type('#nameInputAdd', 'notthesame');
//     await page.type('#schoolSelectAdd', spellSchools[(schoolId) % spellSchools.length].name);
//     await page.type('#descriptionInputAdd', 'Description');

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });

//     // Make sure all the spells were added
//     await page.waitForSelector('.spell');
//     const spellRows = await getNumberOfElements('.spell');
//     expect(spellRows).toBe(3);

//     // Change the first two spell names
//     await page.waitForSelector('#fromName');
//     await page.type('#fromName', name);
//     await page.waitForSelector('#toName');
//     await page.type('#toName', "new spell name");

//     await page.waitForSelector('#changeNamesSubmit');
//     const button = await page.$('#changeNamesSubmit');
//     await button.evaluate(b => b.click({waitUntil: 'domcontentloaded'}));

//     // All the spells should be displayed
//     await page.waitForSelector('.spell');
//     const filteredSpellRows = await getNumberOfElements('.spell');
//     expect(filteredSpellRows).toBe(3);

//     await page.waitForSelector('#spellDisplayTable');
//     const spellsTableText = await getElementText('#spellDisplayTable');
//     expect(spellsTableText).toContain('new spell name')

// })

// test('Spells Page - Change all spell names from x to y - Failure - Invalid from name', async() => {

//     // Go to the spells page
//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//     // Enter random spell into the form
//     const { level, name, schoolId, description } = getRandomSpell();
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter the spell again with a new school
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[(schoolId) % spellSchools.length].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter a completely different spell
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${(level + 1) % 10}`);
//     await page.type('#nameInputAdd', 'notthesame');
//     await page.type('#schoolSelectAdd', spellSchools[(schoolId) % spellSchools.length].name);
//     await page.type('#descriptionInputAdd', 'Description');

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });

//     // Make sure all the spells were added
//     await page.waitForSelector('.spell');
//     const spellRows = await getNumberOfElements('.spell');
//     expect(spellRows).toBe(3);

//     // Change the first two spell names
//     await page.waitForSelector('#fromName');
//     await page.type('#fromName', "100");
//     await page.waitForSelector('#toName');
//     await page.type('#toName', "new spell name");

//     await page.waitForSelector('#changeNamesSubmit');
//     const button = await page.$('#changeNamesSubmit');
//     await button.evaluate(b => b.click({waitUntil: 'domcontentloaded'}));

//     // All the spells should be displayed
//     await page.waitForSelector('.spell');
//     const filteredSpellRows = await getNumberOfElements('.spell');
//     expect(filteredSpellRows).toBe(3);

//     await page.waitForSelector('#alert');
//     const spellsTableText = await getElementText('#alert');
//     expect(spellsTableText).toContain('400')
//     expect(spellsTableText).toContain('invalid input: spell name should not contain numbers.');

// })

// test('Spells Page - Change all spell names from x to y - Failure - Invalid to name', async() => {

//     // Go to the spells page
//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//     // Enter random spell into the form
//     const { level, name, schoolId, description } = getRandomSpell();
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter the spell again with a new school
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[(schoolId) % spellSchools.length].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });
    
//     // Enter a completely different spell
//     await page.waitForSelector('#levelSelectAdd');
//     await page.select('#levelSelectAdd', `${(level + 1) % 10}`);
//     await page.type('#nameInputAdd', 'notthesame');
//     await page.type('#schoolSelectAdd', spellSchools[(schoolId) % spellSchools.length].name);
//     await page.type('#descriptionInputAdd', 'Description');

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });

//     // Make sure all the spells were added
//     await page.waitForSelector('.spell');
//     const spellRows = await getNumberOfElements('.spell');
//     expect(spellRows).toBe(3);

//     // Change the first two spell names
//     await page.waitForSelector('#fromName');
//     await page.type('#fromName', name);
//     await page.waitForSelector('#toName');
//     await page.type('#toName', "100");

//     await page.waitForSelector('#changeNamesSubmit');
//     const button = await page.$('#changeNamesSubmit');
//     await button.evaluate(b => b.click({waitUntil: 'domcontentloaded'}));

//     // All the spells should be displayed
//     await page.waitForSelector('.spell');
//     const filteredSpellRows = await getNumberOfElements('.spell');
//     expect(filteredSpellRows).toBe(3);

//     await page.waitForSelector('#alert');
//     const spellsTableText = await getElementText('#alert');
//     expect(spellsTableText).toContain('400')
//     expect(spellsTableText).toContain('invalid input: spell name should not contain numbers.');

// })

// // Focus on spells
// test('focusSpell - focus on a spell - success', async () => {

//     // Go to the spells page
//     await page.goto(`${home}/spells`, {waitUntil: 'domcontentloaded'});

//     // Enter random spell into the form
//     const { level, name, schoolId, description } = getRandomSpell();
//     await page.select('#levelSelectAdd', `${level}`);
//     await page.type('#nameInputAdd', name);
//     await page.type('#schoolSelectAdd', spellSchools[schoolId-1].name);
//     await page.type('#descriptionInputAdd', description);

//     // click form's submit button and wait for new page to load
//     await page.click('#addSpellButton', { waitUntil: 'domcontentloaded' });

//     await page.waitForSelector('#focusSpell1');
//     const button = await page.$('#focusSpell1');
//     await button.evaluate(b => b.click({waitUntil: 'domcontentloaded'}));

//     // Make sure the correct data is displayed
//     const pageText = await getElementText('#container');
//     expect(pageText).toContain(name.toLowerCase());
//     expect(pageText).toContain(spellSchools[schoolId-1].name.toLowerCase());
//     expect(pageText).toContain(description.toLowerCase());

//     if(level == 0)
//         expect(pageText).toContain('cantrip')
//     else
//         expect(pageText).toContain(`${level}`)

// })