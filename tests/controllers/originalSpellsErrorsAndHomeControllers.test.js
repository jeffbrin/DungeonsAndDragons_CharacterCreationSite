// const app = require("../../app"); 
// const supertest = require("supertest");
// const testRequest = supertest(app);

// const dbName = "dnd_db_testing"; 
// const model = require('../../models/spellModel');
// beforeEach(async () => {
//     await model.initialize(dbName, true);    
// });

// afterEach(async () => {
//     try{
//         await model.closeConnection();
//     }catch(error){
//         console.error(error)
//     }
// });

// /* Data to be used to generate random spells for testing */
// /* Levels 2 - 7 so the tests can add / subtract levels without going out of bounds */
// const spellData = [
//     {level: 2, name: "Web", schoolId: 1, description: "You conjure a mass of thick, sticky webbing at a point of your choice within range. The webs fill a 20-foot cube from that point for the duration. The webs are difficult terrain and lightly obscure their area."},
//     {level: 3, name: "Animate Dead", schoolId: 2, description: "This spell creates an undead servant.\nChoose a pile of bones or a corpse of a Medium or Small humanoid within range. Your spell imbues the target with a foul mimicry of life, raising it as an undead creature. The target becomes a skeleton if you chose bones or a zombie if you chose a corpse (the DM has the creature's game statistics)."},
//     {level: 4, name: "Arcane Eye", schoolId: 3, description: "You create an invisible, magical eye within range that hovers in the air for the duration.\nYou mentally receive visual information from the eye, which has normal vision and darkvision out to 30 feet. The eye can look in every direction.\nAs an action, you can move the eye up to 30 feet in any direction. There is no limit to how far away from you the eye can move, but it can't enter another plane of existence. A solid barrier blocks the eye's movement, but the eye can pass through an opening as small as 1 inch in diameter."},
//     {level: 5, name: "Bigby's Hand", schoolId: 4, description: "You create a Large hand of shimmering, translucent force in an unoccupied space that you can see within range. The hand lasts for the spell's duration, and it moves at your command, mimicking the movements of your own hand."},
//     {level: 6, name: "Charm Monster", schoolId: 5, description: "You attempt to charm a creature you can see within range. It must make a Wisdom saving throw, and it does so with advantage if you or your companions are fighting it. If it fails the saving throw, it is charmed by you until the spell ends or until you or your companions do anything harmful to it. The charmed creature is friendly to you. When the spell ends, the creature knows it was charmed by you."},
//     {level: 7, name: "Mirage Arcane", schoolId: 6, description: "You make terrain in an area up to 1 mile square look, sound, smell, and even feel like some other sort of terrain.\nThe terrain's general shape remains the same, however. Open fields or a road could be made to resemble a swamp, hill, crevasse, or some other difficult or impassable terrain. A pond can be made to seem like a grassy meadow, a precipice like a gentle slope, or a rock-strewn gully like a wide and smooth road."}
// ]
    
// // Generate a random spell for testing without removing from the array
// const generateSpellData = () => {
//     const index = Math.floor((Math.random() * spellData.length));
//     return {...spellData.slice(index, index+1)[0]};
// }

// /**
//  * Checks if two spells are equal. Does not take school into account
//  * @param spellOne The first spell to compare.
//  * @param spellTwo the second spell to compare.
//  */
// function spellsEqual(spellOne, spellTwo){
//     return spellOne.name.toLowerCase() == spellTwo.name.toLowerCase() &&
//             spellOne.level == spellTwo.level &&
//             spellOne.description == spellTwo.description;
// }

// /**
//  *  Copies a spell to a new object
//  * @param spell The spell to copy
//  * @returns a copy of the spell passed
//  */
// function copySpell(spell){
//     return {...spell}
// }

// // HOME
// test("GET / success", async () => {
//     const testResponse = await testRequest.get('/').send();
//     expect(testResponse.status).toBe(200);

//     let ct = testResponse.get('content-type');
//     expect(ct.startsWith('text/html')).toBe(true);
// });

// test("GET /home success", async () => {
//     const testResponse = await testRequest.get('/home').send();
//     expect(testResponse.status).toBe(200);

//     let ct = testResponse.get('content-type');
//     expect(ct.startsWith('text/html')).toBe(true);
// });

// // INVALID ENDPOINT
// test("GET /invalidEndpoint success", async () => {
//     const testResponse = await testRequest.get('/invalidEndpoint').send();
//     expect(testResponse.status).toBe(404);

//     let ct = testResponse.get('content-type');
//     expect(ct.startsWith('text/html')).toBe(true);
// });

// test("POST /invalidEndpoint success", async () => {
//     const testResponse = await testRequest.post('/invalidEndpoint').send();
//     expect(testResponse.status).toBe(404);

//     let ct = testResponse.get('content-type');
//     expect(ct.startsWith('text/html')).toBe(true);
// });

// test("PUT /invalidEndpoint success", async () => {
//     const testResponse = await testRequest.put('/invalidEndpoint').send();
//     expect(testResponse.status).toBe(404);

//     let ct = testResponse.get('content-type');
//     expect(ct.startsWith('text/html')).toBe(true);
// });

// test("DELETE /invalidEndpoint success", async () => {
//     const testResponse = await testRequest.delete('/invalidEndpoint').send();
//     expect(testResponse.status).toBe(404);

//     let ct = testResponse.get('content-type');
//     expect(ct.startsWith('text/html')).toBe(true);
// });


// // POST /spells
// test("POST /spells success", async () => {

//     const randomSpell = generateSpellData();

//     const testResponse = await testRequest.post('/spells').send(randomSpell);
//     expect(testResponse.status).toBe(201);

// });

// test("POST /spells failure - bad input", async () => {

//     const randomSpell = generateSpellData();
//     randomSpell.name = 10;

//     const testResponse = await testRequest.post('/spells').send(randomSpell);
//     expect(testResponse.status).toBe(400);
// });

// test("POST /spells failure - closed database connection", async () => {

//     const randomSpell = generateSpellData();
//     await model.closeConnection();

//     const testResponse = await testRequest.post('/spells').send(randomSpell);
//     expect(testResponse.status).toBe(500);
// });

// // DELETE /spells/name/:name
// test("DELETE /spells/name success", async () => {

//     // Add the same spell with two different levels and schools
//     const spellCopy = copySpell(spellData[4]);
//     await model.addSpell(spellCopy);
//     spellCopy.level = 9
//     spellCopy.schoolId = 1
//     await model.addSpell(spellCopy);
    
//     // Add another spell to remain after the delete
//     const spellToKeep = spellData[1]
//     await model.addSpell(spellToKeep);

//     const testResponse = await testRequest.delete(`/spells/name`).send({name: spellCopy.name});
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(200);

//     const spellsRemaining = await model.getAllSpells();
//     expect(spellsRemaining.length).toBe(1);
//     expect(spellsEqual(spellsRemaining[0], spellToKeep))


// });

// test("DELETE /spells/name failure - invalid input", async () => {

//     // Add the same spell with two different levels and schools
//     const spellCopy = copySpell(spellData[4]);
//     await model.addSpell(spellCopy);
//     spellCopy.level = 9
//     spellCopy.schoolId = 1
//     await model.addSpell(spellCopy);
    
//     // Add another spell to remain after the delete
//     const spellToKeep = spellData[1]
//     await model.addSpell(spellToKeep);

//     const testResponse = await testRequest.delete(`/spells/name`).send({name: 10});
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(400);

//     const spellsRemaining = await model.getAllSpells();
//     expect(spellsRemaining.length).toBe(3);

//     expect(spellsEqual(spellsRemaining[0], spellData[4]))
//     expect(spellsEqual(spellsRemaining[1], spellCopy))
//     expect(spellsEqual(spellsRemaining[2], spellToKeep))


// });

// test("DELETE /spells/name failure - closed database connection", async () => {

//     // Add the same spell with two different levels and schools
//     const spellCopy = copySpell(spellData[4]);
//     await model.addSpell(spellCopy);
//     spellCopy.level = 9
//     spellCopy.schoolId = 2
//     await model.addSpell(spellCopy);
    
//     // Add another spell to remain after the delete
//     const spellToKeep = spellData[1]
//     await model.addSpell(spellToKeep);

//     await model.closeConnection();
//     const testResponse = await testRequest.delete(`/spells/name`).send({name: spellCopy.name});

//     expect(testResponse.status).toBe(500);

// });

// // DELETE /spells/:id
// test("DELETE /spells/:id success", async () => {
    
//     // Add two spells
//     const randomSpell = generateSpellData();
//     await model.addSpell(randomSpell);
//     randomSpell.level -= 1;
//     await model.addSpell(randomSpell);

//     const testResponse = await testRequest.delete('/spells').send({spellChoiceId: 1});
//     const responseBody = testResponse.body;

//     // status is 200 and delete was successful
//     expect(testResponse.status).toBe(200);

//     const storedSpells = await model.getAllSpells();

//     // There is only one spell left
//     expect(storedSpells.length).toBe(1);
//     expect(spellsEqual(randomSpell, storedSpells[0])).toBe(true);

// });

// test("DELETE /spells success - no spell deleted", async () => {
    
//     // Add two spells
//     const randomSpell = generateSpellData();
//     await model.addSpell(randomSpell);
//     randomSpell.level -= 1;
//     await model.addSpell(randomSpell);

//     const testResponse = await testRequest.delete('/spells').send({spellChoiceId: 5});
//     const responseBody = testResponse.body;

//     // status is 200 and delete was successful
//     expect(testResponse.status).toBe(200);

//     const storedSpells = await model.getAllSpells();

//     // There are two spells left
//     expect(storedSpells.length).toBe(2);
//     expect(spellsEqual(randomSpell, storedSpells[1])).toBe(true);

// });

// test("DELETE /spells failure - invalid input", async () => {
    
//     // Add two spells
//     const randomSpell = generateSpellData();
//     await model.addSpell(randomSpell);
//     randomSpell.level -= 1;
//     await model.addSpell(randomSpell);

//     const testResponse = await testRequest.delete('/spells').send({spellChoiceId: 0});

//     // status is 400
//     expect(testResponse.status).toBe(400);
// });

// test("DELETE /spells failure - closed database connection", async () => {
    
//     // Add two spells
//     const randomSpell = generateSpellData();
//     await model.addSpell(randomSpell);
//     randomSpell.level -= 1;
//     await model.addSpell(randomSpell);

//     await model.closeConnection();
//     const testResponse = await testRequest.delete('/spells').send({spellChoiceId: 1});

//     // status is 500
//     expect(testResponse.status).toBe(500);
// });

// // GET /spells
// test("GET /spells success", async () => {

//     await model.addSpell(spellData[0]);
//     await model.addSpell(spellData[1]);
//     await model.addSpell(spellData[2]);

//     const testResponse = await testRequest.get('/spells').send();
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(200);

// });

// test("GET /spells success - empty database", async () => {

//     testResponse = await testRequest.get('/spells').send();

//     expect(testResponse.status).toBe(200);

// });

// test("GET /spells failure - closed database connection", async () => {

//     await model.closeConnection();
//     testResponse = await testRequest.get('/spells').send();

//     expect(testResponse.status).toBe(500);

// });

// // GET /spells/filter
// test("GET /spells/filter success - filter on level", async () => {
//     await model.addSpell(spellData[0]);
//     await model.addSpell(spellData[1]);
//     await model.addSpell(spellData[2]);
//     const spellWithSpellOneLevelSpellTwoNameSpellThreeSchool = {level: spellData[0].level, name: spellData[1].name, schoolId: spellData[2].schoolId, description: 'Spell Description'};
//     await model.addSpell(spellWithSpellOneLevelSpellTwoNameSpellThreeSchool);

//     const testResponse = await testRequest.get(`/spells/filter?level=${spellWithSpellOneLevelSpellTwoNameSpellThreeSchool.level}`).send();
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(200);

// });

// test("GET /spells/filter success - filter on name", async () => {
//     await model.addSpell(spellData[0]);
//     await model.addSpell(spellData[1]);
//     await model.addSpell(spellData[2]);
//     const spellWithSpellOneLevelSpellTwoNameSpellThreeSchool = {level: spellData[0].level, name: spellData[1].name, schoolId: spellData[2].schoolId, description: 'Spell Description'};
//     await model.addSpell(spellWithSpellOneLevelSpellTwoNameSpellThreeSchool);

//     const testResponse = await testRequest.get(`/spells/filter?name=${spellWithSpellOneLevelSpellTwoNameSpellThreeSchool.name}`).send();
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(200);

// });

// test("GET /spells/filter success - filter on school", async () => {
//     await model.addSpell(spellData[0]);
//     await model.addSpell(spellData[1]);
//     await model.addSpell(spellData[2]);
//     const spellWithSpellOneLevelSpellTwoNameSpellThreeSchool = {level: spellData[0].level, name: spellData[1].name, schoolId: spellData[2].schoolId, description: 'Spell Description'};
//     await model.addSpell(spellWithSpellOneLevelSpellTwoNameSpellThreeSchool);

//     const testResponse = await testRequest.get(`/spells/filter?schoolId${spellWithSpellOneLevelSpellTwoNameSpellThreeSchool.schoolId}`).send();
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(200);

// });

// test("GET /spells/filter success - filter on level and school", async () => {
//     await model.addSpell(spellData[0]);
//     await model.addSpell(spellData[1]);
//     await model.addSpell(spellData[2]);
//     const spellWithSpellOneLevelAndSchool = {level: spellData[0].level, name: spellData[1].name, schoolId: spellData[0].schoolId, description: 'Spell Description'};
    
//     try{
//         await model.addSpell(spellWithSpellOneLevelAndSchool);
//     }catch(error){
//         console.log(error);
//     }

//     const testResponse = await testRequest.get(`/spells/filter?level=${spellWithSpellOneLevelAndSchool.level}&spellId=${spellWithSpellOneLevelAndSchool.schoolId}`).send();
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(200);

// });

// test("GET /spells/filter success - filter on level, name and school", async () => {
//     await model.addSpell(spellData[0]);
//     await model.addSpell(spellData[1]);
//     await model.addSpell(spellData[2]);
//     const spellWithSpellOneLevelSpellTwoNameSpellThreeSchool = {level: spellData[0].level, name: spellData[1].name, schoolId: spellData[2].schoolId, description: 'Spell Description'};
//     await model.addSpell(spellWithSpellOneLevelSpellTwoNameSpellThreeSchool);

//     const testResponse = await testRequest.get(`/spells/filter?level=${spellWithSpellOneLevelSpellTwoNameSpellThreeSchool.level}&name=${spellWithSpellOneLevelSpellTwoNameSpellThreeSchool.name}&schoolId=${spellWithSpellOneLevelSpellTwoNameSpellThreeSchool.schoolId}`).send();
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(200);

// });

// test("GET /spells/filter failure - invalid level in filter", async () => {

//     const testResponse = await testRequest.get('/spells/filter?level=Level').send()

//     expect(testResponse.status).toBe(400);

// });

// test("GET /spells/filter failure - invalid name in filter", async () => {

//     const testResponse = await testRequest.get('/spells/filter?name=100').send()

//     expect(testResponse.status).toBe(400);

// });

// test("GET /spells/filter failure - invalid schoolId in filter", async () => {

//     const testResponse = await testRequest.get('/spells/filter?schoolId=Hello%20There').send()

//     expect(testResponse.status).toBe(400);

// });

// test("GET /spells/filter failure - empty filter", async () => {

//     const testResponse = await testRequest.get('/spells/filter').send({})

//     expect(testResponse.status).toBe(200);

// });

// test("GET /spells/filter success - no filter", async () => {

//     const testResponse = await testRequest.get('/spells/filter').send()

//     expect(testResponse.status).toBe(200);

// });

// test("GET /spells/filter failure - closed database connection", async () => {

//     await model.closeConnection();
//     const testResponse = await testRequest.get('/spells/filter').send({level: 1})

//     expect(testResponse.status).toBe(500);

// });

// // GET /spells/:id
// test("GET /spells/:id success - one spell in database", async () => {

//     const randomSpell = generateSpellData();
//     await model.addSpell(randomSpell);

//     const testResponse = await testRequest.get('/spells/1').send();
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(200);

// });

// test("GET /spells/:id success - multiple spells in database", async () => {

//     const randomSpell = copySpell(generateSpellData());
//     await model.addSpell(randomSpell);
//     randomSpell.level++;
//     await model.addSpell(randomSpell);
//     randomSpell.level++;
//     await model.addSpell(randomSpell);

//     const testResponse = await testRequest.get('/spells/3').send();
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(200);

// });

// test("GET /spells/:id failure - invalid id", async () => {

//     const testResponse = await testRequest.get('/spells/0').send();

//     expect(testResponse.status).toBe(400);

// });

// test("GET /spells/:id failure - closed database connection", async () => {

//     await model.closeConnection();
//     const testResponse = await testRequest.get('/spells/1').send();

//     expect(testResponse.status).toBe(500);

// });

// // PUT /spells/:id
// test("PUT /spells success - change level", async () => {

//     const randomSpell = copySpell(generateSpellData());
//     await model.addSpell(randomSpell);
//     randomSpell.level++;
//     await model.addSpell(randomSpell);

//     const newLevel = 0;
//     const testResponse = await testRequest.put('/spells').send({level: newLevel, spellChoiceId: 1});
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(200);

//     const storedSpells = await model.getAllSpells();
//     expect(spellsEqual(randomSpell, storedSpells[1]));

//     // first spell should have been updated to be randomSpell with level 0
//     randomSpell.level = newLevel;
//     expect(spellsEqual(randomSpell, storedSpells[0])).toBe(true);

// });

// test("PUT /spells success - change name", async () => {
//     const randomSpell = copySpell(generateSpellData());
//     await model.addSpell(randomSpell);
//     randomSpell.level++;
//     await model.addSpell(randomSpell);

//     const newName = "Wormple Scurmple";
//     const testResponse = await testRequest.put('/spells').send({name: newName, spellChoiceId: 1});
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(200);

//     const storedSpells = await model.getAllSpells();
//     expect(spellsEqual(randomSpell, storedSpells[1]));

//     randomSpell.name = newName;
//     randomSpell.level--;
//     expect(spellsEqual(randomSpell, storedSpells[0])).toBe(true);
// });

// test("PUT /spells success - change school", async () => {
//     const randomSpell = copySpell(spellData[3]);
//     await model.addSpell(randomSpell);
//     randomSpell.level++;
//     await model.addSpell(randomSpell);

//     const newSchoolId = 4;
//     const testResponse = await testRequest.put('/spells').send({schoolId: newSchoolId, spellChoiceId: 1});
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(200);

//     const storedSpells = await model.getAllSpells();
//     try{
//         expect(spellsEqual(randomSpell, storedSpells[1]));
//     }catch(error){
//         console.error(error);
//     }

//     randomSpell.schoolId = newSchoolId;
//     randomSpell.level--;
//     expect(spellsEqual(randomSpell, storedSpells[0])).toBe(true);
// });

// test("PUT /spells success - change description", async () => {
//     const randomSpell = copySpell(generateSpellData());
//     await model.addSpell(randomSpell);
//     randomSpell.level++;
//     await model.addSpell(randomSpell);

//     const newDescription = "New Description";
//     const testResponse = await testRequest.put('/spells').send({description: newDescription, spellChoiceId: 1});
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(200);

//     const storedSpells = await model.getAllSpells();
//     expect(spellsEqual(randomSpell, storedSpells[1]));

//     randomSpell.description = newDescription;
//     randomSpell.level--;
//     expect(spellsEqual(randomSpell, storedSpells[0])).toBe(true);
// });

// test("PUT /spells success - change all properties", async () => {
//     const randomSpell = copySpell(generateSpellData());
//     await model.addSpell(randomSpell);
//     randomSpell.level++;
//     await model.addSpell(randomSpell);

//     const newSpell = copySpell(randomSpell);
//     newSpell.level = 0;
//     newSpell.name = 'Archibald';
//     newSpell.schoolId = 5;
//     newSpell.description = 'New Description';
//     newSpell.spellChoiceId = 1
//     const testResponse = await testRequest.put('/spells').send(newSpell);
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(200);

//     const storedSpells = await model.getAllSpells();
//     expect(spellsEqual(randomSpell, storedSpells[1]));

    
//     expect(spellsEqual(newSpell, storedSpells[0])).toBe(true);
// });

// test("PUT /spells success - id doesn't exist", async () => {
//     const randomSpell = copySpell(generateSpellData());
//     await model.addSpell(randomSpell);
//     randomSpell.level++;
//     await model.addSpell(randomSpell);

//     const testResponse = await testRequest.put('/spells').send({level: 0, spellChoiceId: 100});
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(200);

//     // No spell changed
//     const storedSpells = await model.getAllSpells();
//     expect(spellsEqual(randomSpell, storedSpells[1]));

//     randomSpell.level--;
//     expect(spellsEqual(randomSpell, storedSpells[0])).toBe(true);
// });

// test("PUT /spells failure - change no properties", async () => {
//     const randomSpell = copySpell(generateSpellData());
//     await model.addSpell(randomSpell);
//     randomSpell.level++;
//     await model.addSpell(randomSpell);

//     const testResponse = await testRequest.put('/spells').send({spellChoiceId: 1});

//     expect(testResponse.status).toBe(400);

//     // No spell changed
//     const storedSpells = await model.getAllSpells();
//     expect(spellsEqual(randomSpell, storedSpells[1]));

//     randomSpell.level--;
//     expect(spellsEqual(randomSpell, storedSpells[0])).toBe(true);
// });

// test("PUT /spells failure - invalid level", async () => {
//     const randomSpell = copySpell(generateSpellData());
//     await model.addSpell(randomSpell);
//     randomSpell.level++;
//     await model.addSpell(randomSpell);

//     const testResponse = await testRequest.put('/spells').send({level: -1, spellChoiceId: 1});

//     expect(testResponse.status).toBe(400);

//     // No spell changed
//     const storedSpells = await model.getAllSpells();
//     expect(spellsEqual(randomSpell, storedSpells[1]));

//     randomSpell.level--;
//     expect(spellsEqual(randomSpell, storedSpells[0])).toBe(true);
// });

// test("PUT /spells failure - invalid name", async () => {
//     const randomSpell = copySpell(generateSpellData());
//     await model.addSpell(randomSpell);
//     randomSpell.level++;
//     await model.addSpell(randomSpell);

//     const testResponse = await testRequest.put('/spells').send({name: '', spellChoiceId: 1});

//     expect(testResponse.status).toBe(400);

//     // No spell changed
//     const storedSpells = await model.getAllSpells();
//     expect(spellsEqual(randomSpell, storedSpells[1]));

//     randomSpell.level--;
//     expect(spellsEqual(randomSpell, storedSpells[0])).toBe(true);
// });

// test("PUT /spells failure - invalid school", async () => {
//     const randomSpell = copySpell(generateSpellData());
//     await model.addSpell(randomSpell);
//     randomSpell.level++;
//     await model.addSpell(randomSpell);

//     const testResponse = await testRequest.put('/spells').send({schoolId: -1000, spellChoiceId: 1});

//     expect(testResponse.status).toBe(400);

//     // No spell changed
//     const storedSpells = await model.getAllSpells();
//     expect(spellsEqual(randomSpell, storedSpells[1]));

//     randomSpell.level--;
//     expect(spellsEqual(randomSpell, storedSpells[0])).toBe(true);
// });

// test("PUT /spells failure - empty description", async () => {
//     const randomSpell = copySpell(generateSpellData());
//     await model.addSpell(randomSpell);
//     randomSpell.level++;
//     await model.addSpell(randomSpell);

//     const testResponse = await testRequest.put('/spells').send({description: '', spellChoiceId: 1});

//     expect(testResponse.status).toBe(400);

//     // No spell changed
//     const storedSpells = await model.getAllSpells();
//     expect(spellsEqual(randomSpell, storedSpells[1]));

//     randomSpell.level--;
//     expect(spellsEqual(randomSpell, storedSpells[0])).toBe(true);
// });

// test("PUT /spells failure - numeric description", async () => {
//     const randomSpell = copySpell(generateSpellData());
//     await model.addSpell(randomSpell);
//     randomSpell.level++;
//     await model.addSpell(randomSpell);

//     const testResponse = await testRequest.put('/spells').send({description: 10, spellChoiceId: 1});

//     expect(testResponse.status).toBe(400);

//     // No spell changed
//     const storedSpells = await model.getAllSpells();
//     expect(spellsEqual(randomSpell, storedSpells[1]));

//     randomSpell.level--;
//     expect(spellsEqual(randomSpell, storedSpells[0])).toBe(true);
// });

// test("PUT /spells failure - closed database connection", async () => {
//     const randomSpell = copySpell(generateSpellData());
//     await model.addSpell(randomSpell);
//     randomSpell.level++;
//     await model.addSpell(randomSpell);

//     await model.closeConnection();
//     const testResponse = await testRequest.put('/spells').send({description: 'description', spellChoiceId: 1});

//     expect(testResponse.status).toBe(500);

// });

// // PUT /spells/names/:name
// test("PUT /spells/name success", async () => {

//     const randomSpell = copySpell(generateSpellData());
//     randomSpell.name = "Bigby's Hand"
//     await model.addSpell(randomSpell);
//     const secondRandomSpell = copySpell(randomSpell);
//     secondRandomSpell.level--;
//     await model.addSpell(secondRandomSpell);
//     const randomSpellDifferentName = copySpell(randomSpell);
//     randomSpellDifferentName.name = 'Archibald';
//     await model.addSpell(randomSpellDifferentName);

//     const testResponse = await testRequest.put(`/spells/name`).send({fromName: randomSpell.name, toName: 'New Name'});
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(200);

//     const spellsStored = await model.getAllSpells();
//     randomSpell.name = 'New Name';
//     secondRandomSpell.name = 'New Name';
//     expect(spellsEqual(spellsStored[0], randomSpell)).toBe(true);
//     expect(spellsEqual(spellsStored[1], secondRandomSpell)).toBe(true);
//     expect(spellsEqual(spellsStored[2], randomSpellDifferentName)).toBe(true);

// });

// test("PUT /spells/name success - no names changed", async () => {

//     const randomSpell = copySpell(generateSpellData());
//     await model.addSpell(randomSpell);
//     const secondRandomSpell = copySpell(randomSpell);
//     secondRandomSpell.level--;
//     await model.addSpell(secondRandomSpell);
//     const randomSpellDifferentName = copySpell(randomSpell);
//     randomSpellDifferentName.name = 'Archibald';
//     await model.addSpell(randomSpellDifferentName);

//     const testResponse = await testRequest.put(`/spells/name`).send({fromName: 'fakeName', toName: 'New Name'});
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(200);

//     const spellsStored = await model.getAllSpells();
//     expect(spellsEqual(spellsStored[0], randomSpell)).toBe(true);
//     expect(spellsEqual(spellsStored[1], secondRandomSpell)).toBe(true);
//     expect(spellsEqual(spellsStored[2], randomSpellDifferentName)).toBe(true);

// });

// test("PUT /spells/name success - empty database", async () => {

//     const testResponse = await testRequest.put(`/spells/name`).send({fromName: 'fakeName', toName: 'New Name'});
//     const responseBody = testResponse.body;

//     expect(testResponse.status).toBe(200);

//     const spellsStored = await model.getAllSpells();
//     expect(spellsStored.length).toBe(0);

// });

// test("PUT /spells/name failure - invalid from name", async () => {

//     const testResponse = await testRequest.put(`/spells/name`).send({fromName: '10', toName: 'New Name'});

//     expect(testResponse.status).toBe(400);

// });

// test("PUT /spells/name failure - invalid to name", async () => {

//     const testResponse = await testRequest.put(`/spells/name`).send({fromName: 'name', toName: ''});

//     expect(testResponse.status).toBe(400);

// });

// test("PUT /spells/name failure - no to name provided", async () => {

//     const testResponse = await testRequest.put(`/spells/name`).send({fromName: 'name',});

//     expect(testResponse.status).toBe(400);

// });

// test("PUT /spells/name failure - closed database connection", async () => {

//     await model.closeConnection();
//     const testResponse = await testRequest.put(`/spells/name`).send({fromName: 'name', toName: 'name'});

//     expect(testResponse.status).toBe(500);

// });