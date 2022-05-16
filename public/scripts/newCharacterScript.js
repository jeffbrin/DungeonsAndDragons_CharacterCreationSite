var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl)
{
    return new bootstrap.Tooltip(tooltipTriggerEl);
});



let card1 = document.getElementById('Card1');
let card2 = document.getElementById('Card2');
let card3 = document.getElementById('Card3');
let card4 = document.getElementById('Card4');
let card1Next = document.getElementById('Card1Next');
let card2Next = document.getElementById('Card2Next');
let card3Next = document.getElementById('Card3Next');
let card2Prev = document.getElementById('Card2Prev');
let card3Prev = document.getElementById('Card3Prev');
let card4Prev = document.getElementById('Card4Prev');
let btnCloseAlert = document.getElementById('btnCloseAlert');
let progress0 = document.getElementById('progress0');
let progress25 = document.getElementById('progress25');
let progress50 = document.getElementById('progress50');
let progress75 = document.getElementById('progress75');
let progress100 = document.getElementById('progress100');
let submit = document.getElementById('toolTipSubmit');
let pbInput = document.getElementById('characterProficiencyBonus');


card1Next.addEventListener('click', goToCard2);
card2Next.addEventListener('click', goToCard3);
card3Next.addEventListener('click', goToCard4);
card2Prev.addEventListener('click', goToCard1Prev);
card3Prev.addEventListener('click', goToCard2Prev);
card4Prev.addEventListener('click', goToCard3Prev);
btnCloseAlert.addEventListener('click', hideAlertDiv);
submit.addEventListener('submit', submitCharacter);
pbInput.addEventListener('input', enableSubmit);



function enableSubmit()
{
    if (pbInput.value.length > 0)
    {
        document.getElementById('disabledSubmit').disabled = false;
        document.getElementById('toolTipSubmit').setAttribute('data-bs-original-title', 'Click to Create');
    }
    else
    {
        document.getElementById('disabledSubmit').disabled = true;
        document.getElementById('toolTipSubmit').setAttribute('data-bs-original-title', 'Cannot Submit until character is fully created!');
    }
}

function submitCharacter()
{


}

function hideAlertDiv()
{
    document.getElementById('bsBannerInputNotFilled').hidden = true;
}

function goToCard1Prev()
{
    card2.hidden = true;
    card1.hidden = false;
}
function goToCard2Prev()
{
    card3.hidden = true;
    card2.hidden = false;
}

function goToCard3Prev()
{
    card4.hidden = true;
    card3.hidden = false;
}
function goToCard2()
{
    if (card1IsComplete())
    {
        card1.hidden = true;
        card2.hidden = false;
        progress0.hidden = true;
        progress25.hidden = false;

    }
    else
    {
        document.getElementById('bsBannerInputNotFilled').hidden = false;
    }

}
function goToCard3()
{
    if (card2IsComplete())
    {
        card2.hidden = true;
        card3.hidden = false;
        progress25.hidden = true;
        progress50.hidden = false;
    }
    else
    {
        document.getElementById('bsBannerInputNotFilled').hidden = false;
    }

}
function goToCard4()
{
    if (card3IsComplete())
    {
        card3.hidden = true;
        card4.hidden = false;
        progress50.hidden = true;
        progress75.hidden = false;

    }
    else
    {
        document.getElementById('bsBannerInputNotFilled').hidden = false;
    }

}

function card3IsComplete()
{
    const divElem = document.querySelector("#Card3");
    const inputElements = divElem.querySelectorAll("input, select, number, checkbox, textarea");

    for (let i = 0; i < inputElements.length; i++)
    {
        if (inputElements[i].value.length === 0)
        {
            return false;
        }
    }
    return true;
}
function card2IsComplete()
{
    const divElem = document.querySelector("#Card2");
    const inputElements = divElem.querySelectorAll("input, select, number, checkbox, textarea");

    for (let i = 0; i < inputElements.length; i++)
    {
        if (inputElements[i].value.length === 0)
        {
            return false;
        }
    }
    return true;
}
function card1IsComplete()
{
    const divElem = document.querySelector("#Card1");
    const inputElements = divElem.querySelectorAll("input, select, number, checkbox, textarea");

    for (let i = 0; i < inputElements.length; i++)
    {
        if (inputElements[i].value.length === 0)
        {
            return false;
        }
    }
    return true;
}