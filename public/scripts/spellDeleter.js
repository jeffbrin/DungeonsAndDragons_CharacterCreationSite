const spellCardForms = [...document.getElementsByClassName('spellForm')];

spellCardForms.forEach(card => {
    const button = card.children[0].children[1];
    if(button){
    button.addEventListener('click', e => {

        const form = e.target.parentNode.parentNode.parentNode;
        form.children[2].value = '{"method": "delete"}';
        form.submit();
    })
}
})