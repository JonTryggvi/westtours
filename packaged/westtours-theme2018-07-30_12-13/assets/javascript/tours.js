var sStoredTrip = localStorage.selectedTrip;
// console.log(sStoredTrip);
if (sStoredTrip) {
  var jStoredTrip = JSON.parse(sStoredTrip);

}
var lang = '';
var availableDates = '';
var btnGotToBorgun = '';
switch (isEnglish) {
  case '1':
    lang = 'default';
    availableDates = 'Available dates';
    btnGotToBorgun = 'Go pay';
    break;
  case '0':
    lang = 'is';
    availableDates = 'Mögulegir dagar';
    btnGotToBorgun = 'Greiða núna';

    break;
  default:

}

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
    fp.set('enable', aTripDates);
    $("#loader").fadeOut(500);
    $('#loaderMessage').html();
  });

}
fpOptions.defaultDate = from.value;
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
      $cal.append('<div class="flatpickr-clear"><span class="greenDot"></span> <span class="calAvailText">' + availableDates + '</span></div>');

    }
  },
  onChange: function(dateObj, dateStr, instance) {
    // console.log(formatDate(dateObj, "d. M Y"));
    sumWhen.value = dateStr;
    from.value = dateStr;
  }

}

var tourId = widget_id.value;

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
  checkAvailableInPost(tourId, fp);


  sumActivety.value = activitiesSearch.value;
  sumWhen.value = from.value;
  sumParty.value = counter.value;

  var totalAdults = txtAdult.value; //txtAdult.value;
  var costAdult = Number(bknCostAdult.value) * totalAdults;
  var totalYouth = txtChild.value;
  var costYouth = Number(bknCostChild.value) * totalYouth;
  var totalInfants = txtInfant.value;
  var costInfants = Number(bknCostInfant.value) * totalInfants;
  var sumTotal = costAdult + costYouth + costInfants;
  // console.log(sumTotal);
  var rawAmount = {
    rawAmount: sumTotal
  };
  // inpKortaAmount.value = sumTotal;
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
      rawAmount.rawAmount = sumTotal;
      $('#testKortaAmount').value = sumTotal;
      $.post()
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
      rawAmount.rawAmount = sumTotal;
      $('#testKortaAmount').value = sumTotal;
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


var modalSlides = $('#modalSlides');
var modalSlidesOptions = {
  items: 1,
  center: true,
  loop: true,
  stagePadding: -20

}


$('.nextSlide').click(function() {
  modalSlides.trigger('next.owl.carousel');
})
// Go to the previous item
$('.prevSlide').click(function() {
  // With optional speed parameter
  // Parameters has to be in square bracket '[]'
  modalSlides.trigger('prev.owl.carousel', [300]);
})


var postImage = $('.tooltiper');
var tourModal = $('.tourModal');
var closeModal = $('#closeModal');
var body = $('body');
postImage.click(function() {
  modalSlides.owlCarousel(modalSlidesOptions);
  tourModal.addClass('scaleupModal');
  body.css('position', 'fixed');
});

closeModal.click(function() {
  tourModal.removeClass('scaleupModal');
  modalSlides.trigger('destroy.owl.carousel');
  body.css('position', 'relative');
});



$(document).keydown(function(e) {
  // console.log(e.key);
  switch (e.key) {
    case 'ArrowLeft': // left
      modalSlides.trigger('prev.owl.carousel', [300]);
      break;

    case 'ArrowUp': // up
      modalSlides.trigger('next.owl.carousel');
      break;

    case 'ArrowRight': // right
      modalSlides.trigger('next.owl.carousel');

      break;

    case 'ArrowDown': // down
      modalSlides.trigger('prev.owl.carousel', [300]);
      break;
    case 'Escape': // down
      tourModal.removeClass('scaleupModal');
      modalSlides.trigger('destroy.owl.carousel');
      body.css('position', 'relative');
      break;

    default:

      return; // exit this handler for other keys
  }
  e.preventDefault(); // prevent the default action (scroll / move caret)
});




jaPay = {
  "activityRequest": {
    "activityId": 1,
    "startTimeId": 1,
    "date": "2016-02-20",
    "flexibleDayOption": null,
    "pickup": false,
    "pickupPlaceId": null,
    "pickupPlaceDescription": null,
    "pickupPlaceRoomNumber": null,
    "dropoff": false,
    "dropoffPlaceId": null,
    "dropoffPlaceDescription": null,
    "pricingCategoryBookings": [{
        "pricingCategoryId": 1,
        "extras": []
      },
      {
        "pricingCategoryId": 1,
        "extras": []
      },
      {
        "pricingCategoryId": 2,
        "extras": []

      },
      {
        "pricingCategoryId": 3,
        "extras": []
      }
    ],
    "extras": []
  },
  "externalBookingReference": "AB-123",
  "note": "Hello world!",
  "sendCustomerNotification": false,
  "discountPercentage": null,
  "paymentOption": "ENTER_MANUALLY",
  "manualPayment": {
    "amount": 15000,
    "currency": "ISK",
    "paymentType": "WEB_PAYMENT",
    "confirmed": true,
    "paymentProviderType": "VALITOR",
    "cardBrand": "VISA",
    "cardNumber": "1234********5678",
    "authorizationCode": "12345",
    "paymentReferenceId": "00101010234",
    "paymentType": "WEB_PAYMENT",
    "comment": "This is a comment"
  },
  "chargeRequest": null,
  "vesselId": null,
  "harbourId": null,
  "customer": {
    "id": null,
    "created": null,
    "email": null,
    "firstName": "John",
    "lastName": "Doe",
    "language": null,
    "nationality": null,
    "sex": null,
    "dateOfBirth": null,
    "phoneNumber": null,
    "phoneNumberCountryCode": null,
    "address": null,
    "postCode": null,
    "state": null,
    "place": null,
    "country": null,
    "organization": null,
    "passportId": null,
    "passportExpMonth": null,
    "passportExpYear": null
  }
};

var formPay = $('#payTrip');

var forPaySer = formPay.serializeArray();
var btnPay = $('#pay');
var customerDetails = $('#customerDetails');
var custTel = $('#custTel');
var custFirstName = $('#firstname');
var custLastName = $('#lastname');
var custEmail = $('#email');
var custNation = $('#searchNations');
var tripTitle = $('#tripTitle').val();
var test = tripPostData.tourExtId;
// console.log(tripTitle);
$(document).click(function(e) {
  // console.log(e.target.classList);
  if (e.target.classList.contains('clickAgain')) {

    rawAmount.title = tripTitle;
    rawAmount.email = custEmail[0].value;
    rawAmount.tel = custTel[0].value;
    rawAmount.firstname = custFirstName[0].value;
    rawAmount.lastname = custLastName[0].value;
    rawAmount.nation = custNation[0].value;
    // console.log($('#tripTitle').val());

    var telData = $('.selected-flag')["0"].attributes[2].textContent.split('+')[1];
    rawAmount.phoneNumberCountryCode = telData;
    // console.log(telData);
    var cookieCustomer = Object.assign({}, rawAmount, {});

    document.cookie = "customerDetails=" + JSON.stringify(cookieCustomer) + "; expires=0; path=/";

    $.post(templateUrl + '/library/api/korta.php', rawAmount, function(bokunPayData) {
      var jbokunPayData = JSON.parse(bokunPayData);
      console.log(jbokunPayData);

      $('#checkvaluemd5').val(jbokunPayData.key);
      $('#inpKortaAmount').val(jbokunPayData.amount);
      $('#kortaInpName').val(jbokunPayData.customer.firstname + ' ' + jbokunPayData.customer.lastname);
      $('#kortaEmail').val(jbokunPayData.customer.email);
      $('#kortaEmail2').val(jbokunPayData.customer.email);
      $('#kortaCountry').val(jbokunPayData.customer.nation);
      $('#KortaPhone').val(jbokunPayData.customer.tel);


      $('#frmTestKorta').submit();

    });
  }
  if (e.target.classList.contains('nation-list-item')) {
    // console.log(e.target.getAttribute('data-value'));
    var selectedNation = e.target.getAttribute('data-value');
    e.target.parentElement.previousElementSibling.value = selectedNation;
    e.target.parentElement.classList.remove('countryVisible');
  }
  if (e.target.parentElement.classList.contains('nation-list-item')) {
    // console.log(e.target.parentElement.getAttribute('data-value'));
    var selectedNation = e.target.parentElement.getAttribute('data-value');
    e.target.parentElement.parentElement.previousElementSibling.value = selectedNation;
    e.target.parentElement.parentElement.remove('countryVisible');
  }

  var searchInputNations = document.querySelector('#searchNations');
  var countriesList = document.querySelector('#countriesList');
  if (searchInputNations) {

    var isClickInsideSearchNat = searchInputNations.contains(e.target) || isDescendant(countriesList, e.target);
    if (!isClickInsideSearchNat && countriesList.classList.contains('countryVisible')) {
      countriesList.classList.toggle('countryVisible');
      searchInputNations.value = '';
    }
  }

  // console.log(e.target);
  // console.dir(e.target.parentElement.previousElementSibling.id);
});

btnPay.click(function() {
  customerDetails.removeClass('heightnull');
  setTimeout(function() {
    btnPay.addClass('clickAgain');
    btnPay.text(btnGotToBorgun).fadeIn(300);
  }, 1000);

});



custTel.intlTelInput();


var countriesList = $('#countriesList');
if ($('#searchNations').val() == '') {
  countriesList.removeClass('countryVisible');
} else {
  countriesList.addClass('countryVisible');
}

$('#searchNations').on('keyup', function() {
  var that = $(this);
  // console.log(that.val());
  var countries = $('#countries');
  var countriesList = $('#countriesList');
  countriesList.html('');
  if (that.val().length > 2) {
    $.getJSON('https://restcountries.eu/rest/v2/name/' + that.val(), function(data) {
      // console.log(data);
      var listOptions = '';
      $.each(data, function(key, value) {
        // console.log(value.flag);
        listOptions += '<div class="nation-list-item" data-value="' + value.name + '"><span class="nation-flag" style="background-image:url(' + value.flag + ');" ></span><span class="nation-name">' + value.name + '</span></div>';
      });
      countriesList.html(listOptions);
    });
    if (that.val() == '') {
      countriesList.removeClass('countryVisible');
    } else {

      countriesList.addClass('countryVisible');
    }
  }

});


$('.closeFunction').click(function() {
  console.log('x');
  $('.failedTranAction').removeClass('scaleupModal');
})



// forPaySer.push({name: "NonFormValue", value: NonFormValue});
// console.log(forPaySer);
