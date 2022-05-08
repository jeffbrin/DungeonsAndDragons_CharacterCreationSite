let cards = document.getElementsByClassName('bg-card');

console.log('hi');

[...cards].forEach(card => {
    card.addEventListener('click', pickCard);
})

function pickCard(event){
    link = event.currentTarget;
    link.submit();
    
}