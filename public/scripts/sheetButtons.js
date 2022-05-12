let form = document.getElementById('hitpointsForm');
let numberInput = document.getElementById('hpValueInput');
let addBtn = document.getElementById('btnAdd');
let removeBtn = document.getElementById('btnRemove');
let roll20s = document.getElementsByClassName('roll20');
let levelupBtn = document.getElementById('levelupBtn');

addBtn.addEventListener('click', addHp);
removeBtn.addEventListener('click', removeHp);
levelupBtn.addEventListener('click', levelup);

[...roll20s].forEach(roll => {
    roll.addEventListener('click', roll20);
})





function roll20(event) {

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