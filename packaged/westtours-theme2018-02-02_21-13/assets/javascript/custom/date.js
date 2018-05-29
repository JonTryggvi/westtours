var from = document.querySelector('#from');
var fpOptions = {
  dateFormat: "d. F Y",
  mode: "single",
  static: true,
  arrowBottom: false,
  // altInput: true,
  onReady: function(dateObj, dateStr, instance) {
    var $cal = $(instance.calendarContainer);
    if ($cal.find('.flatpickr-clear').length < 1) {
      $cal.append('<div class="flatpickr-clear"><span class="greenDot"></span> <span class="calAvailText">Available dates</span></div>');
    }
  }
};
// var availableDates = document.querySelector('#availableDates');
var pickTime = document.querySelectorAll('.pickTime');
if (pickTime) {
  var fp = flatpickr(pickTime, fpOptions);
}


// mobile calendar

function setForm() {
  // var frm = document.querySelectorAll('.frm');
  for (var i = 0; i < frm.length; i++) {
    frm[i].classList.remove('showFrm');
  }
  frmAll.classList.add('showFrm');

}
var mobileWhen = document.querySelector('#mobileWhen');
var hiddenCalMobile = document.querySelector('#hiddenCalMobile');
var fpOptionsMobile = {
  dateFormat: "d. M Y",
  static: true,
  arrowBottom: false,
  inline: true,
  appendTo: 'flatpickr-wrapper',
  // defaultDate: from.value,
  onReady: function(dateObj, dateStr, instance) {
    var $cal = $(instance.calendarContainer);
    if ($cal.find('.flatpickr-clear').length < 1) {
      $cal.append('<div class="flatpickr-clear"><span class="greenDot"></span> <span class="calAvailText">Available dates</span></div>');

    }
  },
  onChange: function() {
    setForm();
    mobileWhen.value = hiddenCalMobile.value;
  }

}
var fpMobile = flatpickr(hiddenCalMobile, fpOptionsMobile);