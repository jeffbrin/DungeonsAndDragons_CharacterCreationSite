var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl)
{
    return new bootstrap.Tooltip(tooltipTriggerEl);
});




let form = document.getElementById('hitpointsForm');
let numberInput = document.getElementById('hpValueInput');
let addBtn = document.getElementById('btnAdd');
let removeBtn = document.getElementById('btnRemove');
let roll20s = document.getElementsByClassName('roll20');
let levelupBtn = document.getElementById('levelupBtn');
let itemBtn = document.getElementById('itemBtn');
let addItemFormButton;
let updateCharacterButton = document.getElementById('btnUpdateCharacter');
let expButtonModify = document.getElementById('openExperienceInput');
expButtonModify.addEventListener('click', openFormExp);

let submitExp = document.getElementById('submitExp');
let deleteSpellBtn = document.getElementById('deleteSpellBtn');
deleteSpellBtn.addEventListener('click', e =>
{
    let tds = [...document.getElementsByClassName('hiddenDeleteSpell')];
    tds.forEach(td =>
    {
        td.hidden = false;
        td.childNodes.forEach(child =>
        {
            child.hidden = false;
            child.childNodes.forEach(child2 =>
            {
                child2.hidden = false;
            });
        });

    });
});

let deleteItemBtn = document.getElementById('deleteItemBtn');
deleteItemBtn.addEventListener('click', e =>
{
    let tdChangeColspan = [...document.getElementsByClassName('colspanChange')];
    tdChangeColspan.forEach(td =>
    {
        td.setAttribute('colspan', '1');
    });
    let tds = [...document.getElementsByClassName('hiddenDeleteItem')];
    tds.forEach(td =>
    {
        td.hidden = false;
        td.childNodes.forEach(child =>
        {
            child.hidden = false;
            child.childNodes.forEach(child2 =>
            {
                child2.hidden = false;
            });
        });

    });
});

let abilityScores = document.getElementsByClassName('abilityScore');
let abilityScoreModifiers = document.getElementsByClassName('abilityBonus');
let savingThrowModifiers = document.getElementsByClassName('abilityScoreModifierTd');

let abilityScoreUpdateFormBtn = document.getElementById('abilityScoreUpdateFormBtn');
let btnUpdateSheet = document.getElementById('btnUpdateSheet');
let clicked = false;
let scores = [];
btnUpdateSheet.addEventListener('click', e =>
{
    let abilityScoreValues = [...document.getElementsByClassName('abilityScoreValue')];
    let abilityScoreInputHidden = [...document.getElementsByClassName('abilityScoreInputHidden')];
    if (!clicked)
    {
        scores = [];
        abilityScoreValues.forEach(score =>
        {
            score.hidden = true;
            scores.push(score.innerHTML);
        });
        abilityScoreInputHidden.reverse();
        abilityScoreInputHidden.forEach(input =>
        {
            input.hidden = false;
            input.value = scores.pop();
        });
        clicked = true;
        btnUpdateSheet.innerHTML = 'Stop Edit';
        abilityScoreUpdateFormBtn.hidden = false;
        abilityScoreUpdateFormBtn.disabled = false;
    }
    else
    {
        abilityScoreValues.forEach(score =>
        {
            score.hidden = false;
        });

        abilityScoreInputHidden.forEach(input =>
        {
            input.hidden = true;
            input.value = '';
        });
        clicked = false;
        btnUpdateSheet.innerHTML = 'Edit Sheet';
        abilityScoreUpdateFormBtn.hidden = true;
        abilityScoreUpdateFormBtn.disabled = true;
    }
});


abilityScoreUpdateFormBtn.addEventListener('click', e =>
{
    let abilityScoreUpdateForm = document.getElementById('abilityScoreUpdateForm');

    //get all inputs
    let inputs = [];
    let abilityScoreInputHidden = [...document.getElementsByClassName('abilityScoreInputHidden')];
    abilityScoreInputHidden.forEach(input =>
    {
        if (isNaN(parseInt(input.value)))
            inputs.push(0);
        else
            inputs.push(parseInt(input.value));
    });
    inputs.reverse();
    let strength = document.createElement('input');
    strength.setAttribute('name', 'strength');
    strength.hidden = true;
    strength.value = inputs.pop();
    abilityScoreUpdateForm.append(strength);

    let dexterity = document.createElement('input');
    dexterity.setAttribute('name', 'dexterity');
    dexterity.hidden = true;
    dexterity.value = inputs.pop();
    abilityScoreUpdateForm.append(dexterity);

    let constitution = document.createElement('input');
    constitution.setAttribute('name', 'constitution');
    constitution.hidden = true;
    constitution.value = inputs.pop();
    abilityScoreUpdateForm.append(constitution);

    let intelligence = document.createElement('input');
    intelligence.setAttribute('name', 'intelligence');
    intelligence.hidden = true;
    intelligence.value = inputs.pop();
    abilityScoreUpdateForm.append(intelligence);

    let wisdom = document.createElement('input');
    wisdom.setAttribute('name', 'wisdom');
    wisdom.hidden = true;
    wisdom.value = inputs.pop();
    abilityScoreUpdateForm.append(wisdom);

    let charisma = document.createElement('input');
    charisma.setAttribute('name', 'charisma');
    charisma.hidden = true;
    charisma.value = inputs.pop();
    abilityScoreUpdateForm.append(charisma);

    abilityScoreUpdateForm.submit();
});

for (let i = 0; i < abilityScoreModifiers.length; i++)
{
    let modifier = Math.floor((abilityScores[i].innerText - 10) / 2);
    if (modifier < 0)
    {
        abilityScoreModifiers[i].classList.add('red');
        abilityScoreModifiers[i].innerText = modifier;
        savingThrowModifiers[i].classList.add('red');
        savingThrowModifiers[i].innerText = modifier;

    }
    else if (modifier > 0)
    {
        abilityScoreModifiers[i].classList.add('green');
        abilityScoreModifiers[i].innerText = `+${ modifier }`;
        savingThrowModifiers[i].classList.add('green');
        savingThrowModifiers[i].innerText = `+${ modifier }`;
    }
    else
    {
        abilityScoreModifiers[i].innerText = modifier;
        savingThrowModifiers[i].innerText = modifier;
    }

}




let level0CantripCheck = [...document.getElementsByClassName('checkCantrip')];

level0CantripCheck.forEach(check =>
{
    if (check.innerHTML === "0")
    {
        check.innerHTML = "Cantrip";
    }
});

function openFormExp(event)
{
    document.getElementById('expInput').hidden = false;
    document.getElementById('submitExp').hidden = false;
}

function addProficiency(characterId, skillId)
{
    let form = document.getElementById('addProficiencyForm');
    let characterIdInput = document.createElement('input');
    characterIdInput.hidden = true;
    characterIdInput.value = characterId;
    characterIdInput.setAttribute('name', 'characterId');

    let skillIdInput = document.createElement('input');
    skillIdInput.hidden = true;
    skillIdInput.value = skillId;
    skillIdInput.setAttribute('name', 'skillId');

    form.append(characterIdInput);
    form.append(skillIdInput);

    form.submit();
}

function addExpertise(characterId, skillId)
{
    let form = document.getElementById('addExpertiseForm');

    let characterIdInput = document.createElement('input');
    characterIdInput.hidden = true;
    characterIdInput.value = characterId;
    characterIdInput.setAttribute('name', 'characterId');

    let skillIdInput = document.createElement('input');
    skillIdInput.hidden = true;
    skillIdInput.value = skillId;
    skillIdInput.setAttribute('name', 'skillId');

    form.append(characterIdInput);
    form.append(skillIdInput);
    form.submit();
}

function removeAll(characterId, skillId)
{
    let form = document.getElementById('removeAllForm');

    let characterIdInput = document.createElement('input');
    characterIdInput.hidden = true;
    characterIdInput.value = characterId;
    characterIdInput.setAttribute('name', 'characterId');

    let skillIdInput = document.createElement('input');
    skillIdInput.hidden = true;
    skillIdInput.value = skillId;
    skillIdInput.setAttribute('name', 'skillId');

    form.append(characterIdInput);
    form.append(skillIdInput);

    form.submit();
}

addBtn.addEventListener('click', addHp);
removeBtn.addEventListener('click', removeHp);
levelupBtn.addEventListener('click', levelup);
itemBtn.addEventListener('click', addItemInternal);
updateCharacterButton.addEventListener('click', sendToUpdate);

$(document).on('click', '#addItemFormButton', function (e) { addItemChangeValuesBeforeSending(e); });



function sendToUpdate()
{
    let id = document.getElementById('characterIdHidden').value;

    location.href = `/characters/forms/${ id }`;
}


function timeout(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function addItemChangeValuesBeforeSending(event)
{
    let hiddenName = document.getElementById('hiddenItemName');
    let hiddenQuantity = document.getElementById('hiddenItemQuantity');

    let qty = document.getElementById('formItemQuantity').value;
    let name = document.getElementById('formItemName').value;

    if (qty === "" && name === "")
    {
        let nameForm = document.getElementById('formItemName');
        let qtyForm = document.getElementById('formItemQuantity');
        qtyForm.classList.add("shakeshakeshake");
        nameForm.classList.add("shakeshakeshake");
        await timeout(2000);
        nameForm.classList.remove("shakeshakeshake");
        qtyForm.classList.remove("shakeshakeshake");
        return;
    }
    if (qty === "")
    {
        //shake
        let qtyForm = document.getElementById('formItemQuantity');
        qtyForm.classList.add("shakeshakeshake");
        await timeout(2000);
        qtyForm.classList.remove("shakeshakeshake");
        return;
    }
    if (name === "")
    {
        //shake 
        let nameForm = document.getElementById('formItemName');
        nameForm.classList.add("shakeshakeshake");
        await timeout(4000);
        nameForm.classList.remove("shakeshakeshake");
        return;
    }
    hiddenName.value = name;
    hiddenQuantity.value = qty;
    let form = document.getElementById('addItemForm');
    form.submit();
}


function addItemInternal(event)
{
    if ($("#addRow").length)
    {
        //object already exists
        return;
    }
    //create elements
    let tableRow = `<tr id="addRow"><td class="mw-50"><input type="text" id="formItemName" required maxlength="200" name="itemName" class="bg-elevated2 colorText mw-90"></td><td class="mw-25"><input required type="number" id="formItemQuantity" name="itemQuantity" class="bg-elevated2 colorText mw-50"></td><td class="mw-25"><input id="addItemFormButton" type="button" class="btn btn-primary" form="addItemForm" value="Add Item"></td></tr>`;
    let tableBody = document.getElementById('itemTBody');
    tableBody.insertAdjacentHTML('beforeend', tableRow);
    addItemFormButton = document.getElementById('addItemFormButton');
}
function addHp(event)
{
    let hpValueChange = document.getElementById('hpValueInput').value;
    if (hpValueChange === "")
        hpValueChange = 1;

    document.getElementById('hpValueInput').value = hpValueChange;
    form.submit();
}

function removeHp(event)
{
    let hpValueChange = document.getElementById('hpValueInput').value;
    if (hpValueChange > 0)
    {
        hpValueChange = Math.abs(hpValueChange) * -1;
    }
    if (hpValueChange === "")
        hpValueChange = -1;

    document.getElementById('hpValueInput').value = hpValueChange;

    form.submit();
}
function levelup(event)
{
    let formLvl = document.getElementById('levelupForm');
    formLvl.submit();
}


let rollBonus = 0;
// Add saving throw proficiency to the dice rolls
[...document.getElementsByClassName('savingThrowButton')].forEach(btn => {
    btn.addEventListener('click', e =>{
        rollBonus = Math.floor((Number(btn.dataset.bonus) - 10) / 2);
        console.log(rollBonus);
    })
})

// Copyright (c) 2022 by Vicente Mundim (https://codepen.io/vicentemundim/pen/nXNvBw)
var $die = $('.die'),
    sides = 20,
    initialSide = 1,
    lastFace,
    timeoutId,
    transitionDuration = 500,
    animationDuration = 3000;

$('ul > li > a').click(function ()
{
    reset();
    rollTo($(this).attr('href'));

    return false;
});

function randomFace()
{
    var face = Math.floor((Math.random() * sides)) + initialSide;
    lastFace = face == lastFace ? randomFace() : face;


    return face;
}

function rollTo(face)
{
    // Clear the dice rolls that are already present
    let rollDiv = document.getElementById('rollBody');
    rollDiv.innerHTML = '';

    clearTimeout(timeoutId);

    $('ul > li > a').removeClass('active');
    $('[href=' + face + ']').addClass('active');

    $die.attr('data-face', face);
    //SAM
    //Now we can inject the face (int) into the DOM
    let h5 = document.createElement('h5');
    h5.innerHTML = `You Rolled a <b class="bolded fs-2rem">${ face } + ${ rollBonus } = ${ Number(face) + Number(rollBonus) }</b>`;
    
    rollDiv.append(h5);
}

function reset()
{
    $die.attr('data-face', null).removeClass('rolling');
}

$('.randomize, .die').click(function ()
{
    $die.addClass('rolling');
    clearTimeout(timeoutId);

    timeoutId = setTimeout(function ()
    {
        $die.removeClass('rolling');

        rollTo(randomFace());
    }, animationDuration);

    return false;
});