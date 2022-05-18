let spellCardForms = [...document.getElementsByClassName('spellForm')];


spellCardForms.forEach(card =>
{
    card.addEventListener('click', e =>
    {
        card.submit();
    });
});