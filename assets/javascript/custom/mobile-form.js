var btnNavForm = document.querySelectorAll('.btnFrm');
var frm = document.querySelectorAll('.frm');
var frmAll = document.querySelector('#frmAll');
for (var i = 0; i < btnNavForm.length; i++) {
  btnNavForm[i].addEventListener('click', function() {
    var frmId = this.getAttribute('data-frm');
    var frmContainerToShow = document.querySelector('#' + frmId);
    for (var i = 0; i < frm.length; i++) {
      frm[i].classList.remove('showFrm');
    }
    frmContainerToShow.classList.add('showFrm');
  });
}
//
// var flatpickrday = document.querySelectorAll('.flatpickr-day');
// for (var i = 0; i < flatpickrday.length; i++) {
//   flatpickrday[i].addEventListener('click', function() {
//     for (var i = 0; i < frm.length; i++) {
//       frm[i].classList.remove('showFrm');
//     }
//     frmAll.classList.add('showFrm');
//   });
// }