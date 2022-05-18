const spellCardForms = [...document.getElementsByClassName('spellForm')];

spellCardForms.forEach(card => {
    const deleteButton = card.children[0].children[1].children[0];
    if(deleteButton){
    deleteButton.addEventListener('click', e => {

        const form = e.target.parentNode.parentNode.parentNode.parentNode;
        form.children[2].value = '{"method": "delete"}';
        form.submit();
    })
}
})

spellCardForms.forEach(card => {
    const editButton = card.children[0].children[1].children[1];
    if(editButton){
    editButton.addEventListener('click', e => {

        const form = e.target.parentNode.parentNode.parentNode.parentNode;
        form.action = '/spells/editform/' + editButton.dataset.src;
        form.submit();
    })
}
})