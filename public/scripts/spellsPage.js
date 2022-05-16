const customCastingTime = document.getElementById('customCastingTime');
const customDuration = document.getElementById('customDuration');
const customRange = document.getElementById('customRange');
const materialsDiv = document.getElementById('materialsDiv');
const materialButton = document.getElementById('materialButton');
const castingTimeSelect = document.getElementById('castingTime');
const durationSelect = document.getElementById('durationSelect');
const rangeSelect = document.getElementById('rangeInput');
const damageSelect = document.getElementById('damageDice');
const damageDiceQuantityInput = document.getElementById('damageDiceQuantity');
const hiddenFinalDamageInput = document.getElementById('damage');

materialButton.addEventListener('change', e => {
    if(materialButton.checked)
        materialsDiv.style.visibility = 'visible';
    else
        materialsDiv.style.visibility = 'hidden';
})

const originalDamageWidth = damageDiceQuantityInput.style.width;
damageSelect.addEventListener('change', e => {
    if(damageSelect.value == ''){
        damageDiceQuantityInput.style.visibility = 'hidden';
        damageDiceQuantityInput.style.width = 0;
        damageDiceQuantityInput.required = false;
    }
    else{
        damageDiceQuantityInput.style.visibility = 'visible';
        damageDiceQuantityInput.style.width = originalDamageWidth;
        damageDiceQuantityInput.required = true;
    }
})


castingTimeSelect.addEventListener('change', e => {
    if(castingTimeSelect.value == 'Custom')
        customCastingTime.style.visibility = "visible";
    else
        customCastingTime.style.visibility = "hidden";
})

rangeSelect.addEventListener('change', e => {
    if(rangeSelect.value == 'Custom')
        customRange.style.visibility = "visible";
    else
        customRange.style.visibility = "hidden";
})

durationSelect.addEventListener('change', e => {
    if(durationSelect.value == 'Custom')
        customDuration.style.visibility = "visible";
    else
        customDuration.style.visibility = "hidden";
})

// Replace customs upon submission
document.getElementById('additionForm').addEventListener('submit', e => {
    if(castingTimeSelect.value == 'Custom')
        castingTimeSelect.value = customCastingTime.value;
    if(rangeSelect.value == 'Custom')
        rangeSelect.value = customRange.value;
    if(durationSelect.value == 'Custom')
        durationSelect.value = customDuration.value;

    if(!materialButton.checked)
        document.getElementById('materials').value = null;
    
    if(damageSelect.value == '')
        hiddenFinalDamageInput.value = null
    else
        hiddenFinalDamageInput.value = damageDiceQuantityInput.value + damageSelect.value

    classCheckboxes = [...document.getElementsByClassName('classCheckbox')]
    classesThatCanCastSpell = []
    classCheckboxes.forEach(element => {
        if(element.checked)
            classesThatCanCastSpell.push(element.value);
    });

    document.getElementById('castableClasses').value = classesThatCanCastSpell;
})