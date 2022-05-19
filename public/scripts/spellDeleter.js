const spellCardForms = [...document.getElementsByClassName('spellForm')];



spellCardForms.forEach(card => {

    try{
    const deleteButton = card.children[0].children[1].children[0];
    if(deleteButton){
    deleteButton.addEventListener('click', e => {

        const form = e.target.parentNode.parentNode.parentNode.parentNode;
        form.children[2].value = '{"method": "delete"}';
        form.submit();
    })
}
    }catch(error){

    }
})

spellCardForms.forEach(card => {
    try{
    const editButton = card.children[0].children[1].children[1];
    if(editButton){
    editButton.addEventListener('click', e => {

        const form = e.target.parentNode.parentNode.parentNode.parentNode;
        form.children[2].value = `{"action": "/spells/editform/${editButton.dataset.src}"}`;
        form.submit();
    })
}
    }catch(error){
        
    }
})