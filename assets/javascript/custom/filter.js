// localStorage.selectedTrip = '{}';
function searchJson(that, data, sResultsDropdown) {
  var sSearchString = that.val();
  var aItems = [];
  // console.log(typeof sSearchString);

  var title = '';
  var mainActivety = "";
  var tripDescription = "";
  var season = "";
  var allActiveties = [];
  // var trips = data.trips;
  var trips = data;
  var allActivToLowerCase = "";

  // console.log(trips);
  var aTripTitles = [];
  var aTripDescription = [];
  var aAllCategories = [];
  for (var i = 0; i < trips.length; i++) {
    title = trips[i].title.rendered.toLowerCase();
    aTripTitles.push(title);
    tripDescription = trips[i].content.rendered.toLowerCase();
    aTripDescription.push(tripDescription);
    mainActivety = trips[i].acf.activety[0];
    allActiveties = trips[i].acf.activety;
    aAllCategories.push(allActiveties);

    season = trips[i].acf.season.toLowerCase();
    var filteredArray = [];
    // sResultsDropdown.innerHTML = "";
    // console.log(title);
    var searchResaults = aTripTitles.find(a => a.includes(sSearchString.toLowerCase())) ||
      aTripDescription.find(a => a.includes(sSearchString.toLowerCase())) ||
      aAllCategories.find(a => a.includes(sSearchString.toLowerCase())) ||
      season.includes(sSearchString.toLowerCase());

    if (searchResaults && sSearchString.length > 0) {
      // console.log(trips[i]);
      aItems.push(trips[i]);
      filteredArray = aItems.filter(function(item, pos) {
        return aItems.indexOf(item) == pos;
      });
      if (aItems.length > 0) {
        sResultsDropdown.classList.add('searchActive');
      }
      var resultTitle = '';
      var resultActivety = '';
      var sResultRender = "";
      // console.log(aItems);
      // console.log(filteredArray);
      for (var j = 0; j < filteredArray.length; j++) {
        // console.log(filteredArray[j].title);
        resultTitle = filteredArray[j].title.rendered;
        resultActivety = filteredArray[j].acf.season;
        // console.log(filteredArray[j].acf.bokun_int_id);
        sResultRender += '<div class="resultItem" data-tripid="' + filteredArray[j].acf.bokun_int_id + '"><span class="sSearchVal result_title">' + resultTitle + '</span><span class="result_season sSearchVal">' + resultActivety.replace(/_/g, " ") + '</span></div>';
      }
      sResultsDropdown.innerHTML = sResultRender;
      // return true;
    } else {
      // console.log(sSearchString.length);
      sResultsDropdown.classList.remove('searchActive');
      sResultsDropdown.innerHTML = '';
      // return false;
    }
  }
}

function checkAvailable(id) {
  $('#loaderMessage').html('<p>Looking up avilable dates!</p>');
  $("#loader").fadeIn(500);

  $.post(templateUrl + "/library/bokun.php?checkAvailable=true", {
      "tripId": id
    }, function(data) {
      // console.log(data);
      var aData = JSON.parse(data);
      // console.log(aData);
      var aTripDates = [];
      for (var i = 0; i < aData.length; i++) {

        aTripDates.push(flatpickr.parseDate(aData[i].date, "d. F Y"));
      }
      // console.log(data);
      var dataLenght = aData.length - 1;
      var parseTimeFirst = new Date(aData[0].date);
      var parseTimeLast = new Date(aData[dataLenght].date);

      if (fp.selectedDates.length > 0) {
        fp = flatpickr(pickTime, fpOptions);
      }

      fp.setDate([parseTimeFirst, parseTimeLast], true, "d. F Y");
      fp.set('enable', aTripDates);

      if (fpMobile) {
        if (fpMobile.selectedDates.length > 0) {
          fpMobile = flatpickr(hiddenCalMobile, fpOptionsMobile);
        }

        fpMobile.setDate([parseTimeFirst, parseTimeLast], true, "d. F Y");
        fpMobile.set('enable', aTripDates);
      }

      $("#loader").fadeOut(500);
      $('#loaderMessage').html();

    }

  );

}
// console.log(isEnglish);
switch (isEnglish) {
  case '1':
    var apiUrl = '/wp-json/wp/v2/tour_post_type?per_page=100&lang=en';
    break;
  case '0':
    var apiUrl = '/wp-json/wp/v2/tour_post_type?per_page=100&lang=is';
    break;
  default:
}
// console.log(apiUrl);

// templateUrl + "/library/detailedtrips.json"
$.getJSON(rootUrl + apiUrl, function(data) {
  // console.log(data);
  // rootUrl + '/wp-json/wp/v2/tour_post_type?per_page=100'
  $('#activitiesSearch').on('keyup', function() {
    var that = $(this);
    $('#showFilteredTrip').text('Show me');
    searchJson(that, data, sResultsDropdown);

  });

  // $('#activetySearchPost').on('keyup', function() {
  //   var that2 = $(this);
  //   searchJson(that2, data, sResultsDropdown);
  // });
  $('#mobileActivety').on('keyup', function() {
    var that3 = $(this);
    searchJson(that3, data, mobileActivetyDD);
  });
});
// mobileMany
function renderCounter(acounter, txtAdult, txtChild, txtInfant) {
  // console.log(isEnglish);
  var adult,
    adultPlr,
    child,
    children,
    infant,
    infants;
  // console.log(isEnglish);
  switch (isEnglish) {
    case '1':
      adult = ' adult';
      adultPlr = ' adults';
      child = ' child';
      children = ' children';
      infant = ' infant';
      infants = ' infants';
      break;
    case '0':
      adult = ' fullorðin';
      adultPlr = ' fullorðnir';
      child = ' barn';
      children = ' börn';
      infant = ' smábarn';
      infants = ' smábörn';
      break;
    default:

  }
  // console.log(adultPlr);

  var sCounterResult = '';
  var counter = $('#' + acounter);
  var iAdultVal = Number($('#' + txtAdult).val());
  var iChildVal = Number($('#' + txtChild).val());
  var iInfantVal = Number($('#' + txtInfant).val());
  if (iAdultVal > 0 && iAdultVal < 2) {
    sCounterResult = iAdultVal + adult;
    // console.log(sCounterResult);
    counter.val(sCounterResult);
  } else if (iAdultVal > 1) {
    sCounterResult = iAdultVal + adultPlr;
    counter.val(sCounterResult);
  }
  if ((iChildVal > 0 && iChildVal < 2) && iAdultVal > 0) {
    if (iAdultVal < 1) {
      counter.val('min 1 adult');
      return;
    }
    sCounterResult = sCounterResult + ', ' + iChildVal + child;
    counter.val(sCounterResult);
  } else if (iChildVal > 1 && iAdultVal > 0) {
    sCounterResult = sCounterResult + ', ' + iChildVal + children;
    counter.val(sCounterResult);
  }

  if ((iInfantVal > 0 && iInfantVal < 2) && iAdultVal > 0) {
    if (iAdultVal < 1) {
      counter.val('min 1 adult');
      return;
    }
    sCounterResult = sCounterResult + ', ' + iInfantVal + infant;
    counter.val(sCounterResult);
  } else if (iInfantVal > 1 && iAdultVal > 0) {
    sCounterResult = sCounterResult + ', ' + iInfantVal + infants;
    counter.val(sCounterResult);
  }
}


var iCount = 0;

function sendTripForm(fpFilter) {
  $('#loaderMessage').html('<p>Here we go!</p>');
  $("#loader").fadeIn(500);
  $.post(templateUrl + "/library/bokun.php?checktrip=true", $(fpFilter).serialize(), function(data) {
    console.log('1 checktrip');
    $.get(templateUrl + '/library/detailedtrips.json', function(wpData) {
      console.log('1 wp detailedtrips');
      var ajData = JSON.parse(data);

      if (ajData[0].length > 0) {
        localStorage.fpResults = ajData[1];
        var tripId = ajData[1].tripId;
        var adults = ajData[1].adult;
        var children = ajData[1].children;
        var infant = ajData[1].infant;
        var dRange = ajData[1].date_range;
        // console.log(ajData);
        // fpFilterResults.classList.add('scaleUp');
        var sHtmlAvailableTrips = '';
        for (var i = 0; i < ajData[0].length; i++) {
          // console.log(ajData[0][i]);

          for (var c = 0; c < wpData.trips.length; c++) {
            var wpTripId = wpData.trips[c].id;
            // console.log(wpTripId);
            var iActId = ajData[0][i].activityId;
            if (wpTripId == iActId) {
              // console.log(wpData.trips[c]);
              // var postPermaLink = wpData[c].link;
              // console.log(wpData.trips[c]);
              // console.log(ajData[0][i]);
              var activetyId = ajData[0][i].activityId;
              var sActDate = ajData[0][i].localizedDate;
              var sStartTime = ajData[0][i].startTime;
              var sTartTimeId = ajData[0][i].startTimeId;
              var sActiveUnix = ajData[0][i].date;
              var sFormatDate = new Date(sActiveUnix).toISOString();
              // console.log(sFormatDate);
              var toObjDate = moment(sFormatDate).format("YYYY-MM-DD");
              var boolPickUp = wpData.trips[c].pickupService;
              var priceCat = wpData.trips[c].pricingCategories;
              var aPriceCats = [];
              var aPricWithNames = [];
              for (var p = 0; p < priceCat.length; p++) {
                var priceId = priceCat[p].id;
                var priceType = priceCat[p].ticketCategory;
                // aPriceCats.push({
                //   "id": priceId,
                //   "type": priceType
                // });
                switch (priceType) {
                  case "ADULT":
                    var iAdults = Number(adults);
                    for (var a = 0; a < iAdults; a++) {
                      aPriceCats.push({
                        "pricingCategoryId": Number(priceId)
                      });
                      aPricWithNames.push({
                        "pricingCategoryId": Number(priceId),
                        "type": priceType
                      });
                    }
                    break;
                  case "CHILD":
                    var iChild = Number(children);
                    for (var z = 0; z < iChild; z++) {
                      aPriceCats.push({
                        "pricingCategoryId": Number(priceId)
                      });
                      aPricWithNames.push({
                        "pricingCategoryId": Number(priceId),
                        "type": priceType
                      });
                    }
                    break;
                  case "INFANT":
                    var iInfant = Number(infant);
                    for (var b = 0; b < iInfant; b++) {
                      aPriceCats.push({
                        "pricingCategoryId": Number(priceId)
                      });
                      aPricWithNames.push({
                        "pricingCategoryId": Number(priceId),
                        "type": priceType
                      });
                    }
                    break;
                  default:
                }
              }
              // console.log(aPriceCats);

              var costQuery = {
                "activityId": Number(activetyId),
                "startTimeId": Number(sTartTimeId),
                "date": toObjDate,
                "pricingCategoryBookings": aPriceCats,
                "pickup": boolPickUp,
                "pickupPlaceId": null,
                "pickupPlaceRoomNumber": "",
                "extras": [{
                  "extraId": null,
                  "unitCount": null
                }]
              };

              var sCostQuery = JSON.stringify(costQuery);
              var saPricWithNames = JSON.stringify(aPricWithNames);
              // console.log(costQuery);
              $.post(templateUrl + "/library/bokun.php?checkprice=true", {
                "trip": costQuery,
                "ticket": aPricWithNames
              }, function(sajData) {
                console.log('3 checkprice');
                // console.log(sajData);
                var ajFiltered = JSON.parse(sajData);
                // console.log(ajFiltered);

                var jFilteredPrice = ajFiltered[0][0];
                var ajFilteredTicket = ajFiltered[1];
                // console.log(jFilteredPrice);

                var ajFilteredPriceTicket = jFilteredPrice.pricingCategoryBookings;
                var jFilteredDate = ajFiltered[0][0].date;
                var startHour = ajFiltered[0][0].startTime.hour;
                var startMinute = ajFiltered[0][0].startTime.minute;
                if (startMinute < 10) {
                  startMinute = startMinute.toString() + '0';
                }
                var startTime = startHour + ':' + startMinute;
                // console.log(startTime);
                // console.log(jFilteredDate);
                // console.log(ajFilteredPriceTicket);
                // console.log(ajFilteredTicket);
                // console.log(ajFiltered);
                var ticketName = "",
                  ticketCountAdult,
                  ticketCountChild,
                  ticketCountInfant,
                  adultTicketid,
                  childTicketId,
                  infantTicketId,
                  adultAmount,
                  childAmount,
                  infantAmount;

                for (var i = 0; i < ajFilteredPriceTicket.length; i++) {
                  if (ajFilteredPriceTicket[i].pricingCategoryId == ajFilteredTicket[i].pricingCategoryId) {
                    // console.log(ajData);
                    ticketName = ajFilteredTicket[i].type;
                    switch (ticketName) {
                      case "ADULT":
                        ticketCountAdult = Number(ajData[1].adult);
                        // console.log(ticketCountAdult);
                        adultTicketid = ajFilteredPriceTicket[i].pricingCategoryId;
                        adultAmount = ajFilteredPriceTicket[i].bookedPrice;
                        break;
                      case "CHILD":
                        ticketCountChild = Number(ajData[1].children);
                        // console.log(ticketCountChild);
                        childTicketId = ajFilteredPriceTicket[i].pricingCategoryId;
                        childAmount = ajFilteredPriceTicket[i].bookedPrice;
                        break;
                      case "INFANT":
                        ticketCountInfant = Number(ajData[1].infant);
                        // console.log(ticketCountInfant);
                        infantTicketId = ajFilteredPriceTicket[i].pricingCategoryId;
                        infantAmount = ajFilteredPriceTicket[i].bookedPrice;
                        break;
                      default:
                        ticketCountAdult = 0;
                        ticketCountChild = 0;
                        ticketCountInfant = 0;
                    }
                  }
                }
                // console.log('adtul: ' + ticketCountAdult,'child: ' + ticketCountChild);
                var totalPrice = jFilteredPrice.totalPrice;
                // console.log(ajFiltered);
                // console.log(ajData);
                // console.log(totalPrice);
                console.log(ajFiltered);

                var jTrip = {
                  "tourID": jFilteredPrice.activity.id,
                  "startTimeId": jFilteredPrice.startTime.id,
                  "epochDate": jFilteredPrice.date,
                  "pricingCategoryBookings": ajFilteredTicket,
                  "externalBookingReference": "",
                  "totalPrice": totalPrice,
                  "adultPrice": adultAmount,
                  "childPrice": childAmount,
                  "infantPrice": infantAmount,
                  "adultCount": ticketCountAdult,
                  "childCount": ticketCountChild,
                  "infantCount": ticketCountInfant,
                  "tripDate": jFilteredDate,
                  "startTime": startTime,
                  "minParticipants": ajData[0][0].minParticipants
                };

                $.get(rootUrl + apiUrl, function(wpPostData) {
                  console.log('4 get the url permalink');
                  var permaLink = "";
                  for (var w = 0; w < wpPostData.length; w++) {
                    // console.log(wpPostData[w]);
                    if (jFilteredPrice.activity.id == wpPostData[w].acf.bokun_int_id) {
                      // console.log(wpPostData[w]);
                      jTrip.externalBookingReference = wpPostData[w].acf.bokun_id
                      permaLink = wpPostData[w].link;
                    }
                  }
                  // console.log(jTrip);
                  localStorage.selectedTrip = JSON.stringify(jTrip);
                  document.cookie = "selectedTrip=" + JSON.stringify(jTrip) + "; expires=0; path=/";
                  window.location.href = permaLink + '?total=' + jTrip.totalPrice + '&adult=' + jTrip.adultPrice + '&child=' + jTrip.childPrice + '&infant=' + jTrip.infantPrice + '&adulti=' + jTrip.adultCount + '&childi=' + jTrip.childCount + '&infanti=' + jTrip.infantCount + '&date=' + jTrip.tripDate + '&time=' + jTrip.startTime + '&minPart=' + jTrip.minParticipants;
                });
                // console.log(permaLink);
              });

              break;
            }
          }
        }

        // console.log(sHtmlAvailableTrips);
      }

    });
  });
}

document.addEventListener('click', function(e) {
  // console.log(e.target);
  var searchValue = '';
  var searchValueId = '';
  var searchTripId = '';
  var widgetid = document.querySelectorAll('.widget_id');
  var activitiesSearch = document.querySelector('#activitiesSearch');
  var activetySearchPost = document.querySelector('#activetySearchPost');
  var mobileActivetyDD = document.querySelector('#mobileActivetyDD');
  if (e.target.classList.contains('resultItem')) {
    // console.dir(e.target.children[0].innerHTML);
    searchValue = e.target.children[0].innerHTML;
    searchTripId = e.target.getAttribute('data-tripid');
    // console.log('x');
    checkAvailable(searchTripId);
    // activitiesSearch.value = searchValue;
    sResultsDropdown.classList.remove('searchActive');
    mobileActivetyDD.classList.remove('searchActive');

  }
  if (e.target.classList.contains('result_season')) {
    // console.dir(e.target.previousElementSibling.innerHTML);
    searchValue = e.target.previousElementSibling.innerHTML;
    searchTripId = e.target.parentNode.getAttribute('data-tripid');


    checkAvailable(searchTripId);
    activitiesSearch.value = searchValue;
    sResultsDropdown.classList.remove('searchActive');
  }
  if (e.target.classList.contains('result_title')) {
    // console.dir(e.target.previousElementSibling.innerHTML);
    searchValue = e.target.innerHTML;
    searchTripId = e.target.parentNode.getAttribute('data-tripid');
    // console.log(searchTripId);

    checkAvailable(searchTripId);
    if (activitiesSearch) {
      activitiesSearch.value = searchValue;

      checkAvailable(searchTripId);


    }
    if (activetySearchPost) {
      activetySearchPost.value = searchValue;
      checkAvailable(searchTripId);
    }
    if (mobileActivetyDD) {
      // console.log(searchValue);
      mobileActivety.value = searchValue;
      checkAvailable(searchTripId);
    }

    // checkAvailable(searchTripId);
    sResultsDropdown.classList.remove('searchActive');
    mobileActivetyDD.classList.remove('searchActive');
  }
  // console.log(e.target);
  if (e.target.classList.contains('sSearchVal')) {
    // console.log('x');
    var parentID = e.target.parentElement.getAttribute('data-tripid');
    // $('#activitiesSearch').val() = parentID;
    for (var i = 0; i < widgetid.length; i++) {
      // console.log(widgetid[i]);
      widgetid[i].value = parentID;
    }
    var filterbutton = document.querySelectorAll('.filterbutton');
    for (var t = 0; t < filterbutton.length; t++) {
      filterbutton[t].innerHTML = mobileActivety.value;
    }
    // widget_id.value = parentID;
    // console.log(parentID);
  }
  // var counterContainer = document.querySelectorAll('.counterContainer');
  if (e.target.id == 'counter') {
    // console.log(counterContainer);
    counterContainer.classList.add('setFlex');
  }
  if (e.target.classList.contains('btnCloseCount')) {
    counterContainer.classList.remove('setFlex');
    renderCounter('counter', 'txtAdult', 'txtChild', 'txtInfant');
    renderCounter('mobileMany', 'txtAdultM', 'txtChildM', 'txtInfantM');
  }

  // console.log(isDescendant(counterContainer, e.target));
  var btnCounterCount = document.querySelector('#counter');
  if (btnCounterCount) {

    var isClickInside = btnCounterCount.contains(e.target) || isDescendant(counterContainer, e.target);
    if (!isClickInside && counterContainer.classList.contains('setFlex')) {
      counterContainer.classList.toggle('setFlex');
      renderCounter('counter', 'txtAdult', 'txtChild', 'txtInfant');
    }
  }

  var searchInput = document.querySelector('#activitiesSearch');
  if (searchInput) {
    // console.log('x');
    var isClickInsideSearch = btnCounterCount.contains(e.target) || isDescendant(sResultsDropdown, e.target);
    if (!isClickInsideSearch && sResultsDropdown.classList.contains('searchActive')) {
      sResultsDropdown.classList.toggle('searchActive');
      searchInput.value = '';
    }
  }

  var inputCount = "";
  if (e.target.classList.contains('btnPlus')) {
    inputCount = e.target.parentNode.parentNode.children[0].children[0];
    iCount = Number(inputCount.value) + 1;
    if (Number(inputCount.value) < 5) {
      inputCount.value = iCount;
      renderCounter('counter', 'txtAdult', 'txtChild', 'txtInfant');
      renderCounter('mobileMany', 'txtAdultM', 'txtChildM', 'txtInfantM');
    }

  }
  if (e.target.classList.contains('btnMinus')) {
    inputCount = e.target.parentNode.parentNode.children[0].children[0];
    iCount = Number(inputCount.value) - 1;
    if (Number(inputCount.value) > 0) {
      inputCount.value = iCount;
      renderCounter('counter', 'txtAdult', 'txtChild', 'txtInfant');
      renderCounter('mobileMany', 'txtAdultM', 'txtChildM', 'txtInfantM');
    }
  }

  if (e.target.classList.contains('close') || e.target.classList.contains('fa-times')) {
    fpFilterResults.classList.remove('scaleUp');
  }
  if (e.target.id == 'activitiesSearch') {
    e.target.value = '';
  }
  if (e.target.id == 'mobileActivety') {
    e.target.value = '';
  }
});



$('#showFilteredTrip').click(function() {
  sendTripForm('.fpFilter');



  // if ($('.resultItem').length > 0)
  // {
  //   sendTripForm('.fpFilter');
  // }
  // else {
  //   $(this).text('No match');
  // }

});


$('#mobShow').click(function() {

  sendTripForm('.frmNavActivety');
});

//
// var pageBody = document.querySelectorAll('.entry-content');
//
// if (pageBody) {
//   if (pageBody.classList.contains('setCalendar')) {
//     var tourId = widget_id.value;
//     checkAvailable(tourId);
//     // console.log(tourId);
//   }
//
// }