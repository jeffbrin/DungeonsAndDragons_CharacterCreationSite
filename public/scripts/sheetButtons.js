let form = document.getElementById('hitpointsForm');
let numberInput = document.getElementById('hpValueInput');
let addBtn = document.getElementById('btnAdd');
let removeBtn = document.getElementById('btnRemove');
let roll20s = document.getElementsByClassName('roll20');
let levelupBtn = document.getElementById('levelupBtn');
let itemBtn = document.getElementById('itemBtn');
let addItemFormButton;
let updateCharacterButton = document.getElementById('btnUpdateCharacter');

addBtn.addEventListener('click', addHp);
removeBtn.addEventListener('click', removeHp);
levelupBtn.addEventListener('click', levelup);
itemBtn.addEventListener('click', addItemInternal);
updateCharacterButton.addEventListener('click', sendToUpdate);

$(document).on('click','#addItemFormButton',function(e){addItemChangeValuesBeforeSending(e)});



function sendToUpdate(){
    let id = document.getElementById('characterIdHidden').value;

    location.href = `/characters/forms/${id}`;
}


function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function addItemChangeValuesBeforeSending(event){
    let hiddenName = document.getElementById('hiddenItemName');
    let hiddenQuantity = document.getElementById('hiddenItemQuantity');

    let qty = document.getElementById('formItemQuantity').value;
    let name = document.getElementById('formItemName').value;

    if(qty === "" && name === ""){
        let nameForm = document.getElementById('formItemName');
        let qtyForm = document.getElementById('formItemQuantity');
        qtyForm.classList.add("shakeshakeshake");
        nameForm.classList.add("shakeshakeshake");
        await timeout(2000);
        nameForm.classList.remove("shakeshakeshake");
        qtyForm.classList.remove("shakeshakeshake");
        return;
    }
    if(qty === ""){
        //shake
        let qtyForm = document.getElementById('formItemQuantity');
        qtyForm.classList.add("shakeshakeshake");
        await timeout(2000);
        qtyForm.classList.remove("shakeshakeshake");
        return;
    }
    if(name === ""){
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


function addItemInternal(event){
    if($("#addRow").length) {
        //object already exists
        return;
    }
    //create elements
    let tableRow = `<tr id="addRow"><td class="mw-50"><input type="text" id="formItemName" required maxlength="200" name="itemName" class="bg-elevated2 colorText mw-90"></td><td class="mw-25"><input required type="number" id="formItemQuantity" name="itemQuantity" class="bg-elevated2 colorText mw-50"></td><td class="mw-25"><input id="addItemFormButton" type="button" class="btn btn-primary" form="addItemForm" value="Add Item"></td></tr>`;
    let tableBody = document.getElementById('itemTBody');
    tableBody.insertAdjacentHTML('beforeend', tableRow);
    addItemFormButton = document.getElementById('addItemFormButton');
}
function addHp(event) {
    let hpValueChange = document.getElementById('hpValueInput').value;
    if (hpValueChange === "")
        hpValueChange = 1;

    document.getElementById('hpValueInput').value = hpValueChange;
    form.submit();
}

function removeHp(event) {
    let hpValueChange = document.getElementById('hpValueInput').value;
    if (hpValueChange > 0) {
        hpValueChange = Math.abs(hpValueChange) * -1;
    }
    if (hpValueChange === "")
        hpValueChange = -1;

    document.getElementById('hpValueInput').value = hpValueChange;

    form.submit();
}
function levelup(event) {
    let formLvl = document.getElementById('levelupForm');
    formLvl.submit();
}




// Copyright (c) 2022 by Vicente Mundim (https://codepen.io/vicentemundim/pen/nXNvBw)
var $die = $('.die'),
    sides = 20,
    initialSide = 1,
    lastFace,
    timeoutId,
    transitionDuration = 500,
    animationDuration = 3000

$('ul > li > a').click(function () {
    reset()
    rollTo($(this).attr('href'))

    return false
})

function randomFace() {
    var face = Math.floor((Math.random() * sides)) + initialSide
    lastFace = face == lastFace ? randomFace() : face

    
    return face;
}

function rollTo(face) {
    clearTimeout(timeoutId)

    $('ul > li > a').removeClass('active')
    $('[href=' + face + ']').addClass('active')

    $die.attr('data-face', face)
    //SAM
    //Now we can inject the face (int) into the DOM
    let h5 = document.createElement('h5');
    h5.innerHTML = `You Rolled a <b class="bolded fs-2rem">${face}</b>`;
    let rollDiv = document.getElementById('rollBody');
    rollDiv.append(h5);
}

function reset() {
    $die.attr('data-face', null).removeClass('rolling')
}

$('.randomize, .die').click(function () {
    $die.addClass('rolling')
    clearTimeout(timeoutId)

    timeoutId = setTimeout(function () {
        $die.removeClass('rolling')

        rollTo(randomFace())
    }, animationDuration)

    return false
})