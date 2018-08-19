function checkAvailableInPost(id) {
  $('#loaderMessage').html('<p>Looking up avilable dates!</p>');
  $("#loader").fadeIn(500);
  $.post(templateUrl + "/library/bokun.php?checkAvailable=true", {
    "tripId": id
  }, function(data) {
    var aData = JSON.parse(data);

    var aTripDates = [];
    for (var i = 0; i < aData.length; i++) {
      aTripDates.push(flatpickr.parseDate(aData[i].date, "d. M Y"));
    }

    // console.log(aTripDates);
    var dataLenght = aData.length - 1;
    var parseTimeFirst = new Date(aData[0].date);
    var parseTimeLast = new Date(aData[dataLenght].date);



    fpT.set('enable', aTripDates);
    $("#loader").fadeOut(500);
    $('#loaderMessage').html();
  });

}

var fpOptionsTour = {
  dateFormat: "d. M Y",
  static: true,
  arrowBottom: false,
  inline: true,
  appendTo: 'flatpickr-wrapper',
  defaultDate: from.value,
  onReady: function(dateObj, dateStr, instance) {
    var $cal = $(instance.calendarContainer);
    if ($cal.find('.flatpickr-clear').length < 1) {
      $cal.append('<div class="flatpickr-clear"><span class="greenDot"></span> <span class="calAvailText">Available dates</span></div>');

    }
  },
  onChange: function(dateObj, dateStr, instance) {
    // console.log(formatDate(dateObj, "d. M Y"));
    from.value = dateStr;
  }

}

var tourId = widget_id.value;
console.log(from.value);
var fpPostFilter = document.querySelectorAll('.fpFilter');
var bknEngInput = document.querySelector('#bknEngInput');
if (bknEngInput) {
  function currencyFormatDE(num) {
    return num
      .toFixed(0) // always two decimal digits
      .replace(".", ",") // replace decimal point character with ,
      .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.") + " ISK" // use . as a separator
  }
  var fpT = flatpickr(bknEngInput, fpOptionsTour);
  fpT.setDate(from.value, true, "d. F Y");
  checkAvailableInPost(tourId);
  sumActivety.value = activitiesSearch.value;
  sumWhen.value = from.value;
  sumParty.value = counter.value;

  var totalAdults = txtAdult.value;
  var costAdult = Number(bknCostAdult.value) * totalAdults;
  var totalYouth = txtChild.value;
  var costYouth = Number(bknCostChild.value) * totalYouth;
  var totalInfants = txtInfant.value;
  var costInfants = Number(bknCostInfant.value) * totalInfants;
  var sumTotal = costAdult + costYouth + costInfants;

  total.value = currencyFormatDE(sumTotal);
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('sSearchVal')) {
      sumActivety.value = e.target.innerHTML;
    }
    if (e.target.classList.contains('btnPlus')) {

      totalAdults = txtAdult.value;
      totalYouth = txtChild.value;
      totalInfants = txtInfant.value;
      costAdult = Number(bknCostAdult.value) * totalAdults;
      costYouth = Number(bknCostChild.value) * totalYouth;
      costInfants = Number(bknCostInfant.value) * totalInfants;
      sumTotal = costAdult + costYouth + costInfants;
      sumParty.value = counter.value;
      total.value = currencyFormatDE(sumTotal);
    }
    if (e.target.classList.contains('btnMinus')) {

      totalAdults = txtAdult.value;
      totalYouth = txtChild.value;
      totalInfants = txtInfant.value;
      costAdult = Number(bknCostAdult.value) * totalAdults;
      costYouth = Number(bknCostChild.value) * totalYouth;
      costInfants = Number(bknCostInfant.value) * totalInfants;
      sumTotal = costAdult + costYouth + costInfants;
      sumParty.value = counter.value;
      total.value = currencyFormatDE(sumTotal);
    }

  });


  mobileWhen.addEventListener('change', function() {
    sumWhen.value = this.value;
    fpT.setDate(from.value, true, "d. F Y");
  });

  from.addEventListener('change', function() {
    sumWhen.value = from.value;
    fpT.setDate(from.value, true, "d. F Y");
  });
  counter.addEventListener('change', function() {
    sumParty.value = counter.value;
  });

} else {
  checkAvailable(tourId);
}

// checkAvailable(tourId);

$('p').each(function() {
  if ($(this).text() === '') {
    $(this).remove();
  }
});