let deleteForm = document.getElementById('deleteBtnForm');

let deleteBtn = document.getElementById('deleteCharacterButton');

deleteBtn.addEventListener('click', sendToDelete);


function sendToDelete() {
    deleteForm.submit();
}

