// Inspired by https://stackoverflow.com/questions/23101966/bootstrap-alert-auto-close
$(".alert").delay(4000).slideUp(750, function () {
    $(this).alert('close');
});