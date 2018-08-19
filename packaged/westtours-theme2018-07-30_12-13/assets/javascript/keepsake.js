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

  console.log(trips);
  var aTripTitles = [];
  var aTripDescription = [];
  var aAllCategories = [];
  for (var i = 0; i < trips.length; i++) {
    title = trips[i].title.toLowerCase();
    aTripTitles.push(title);
    tripDescription = trips[i].description.toLowerCase();
    aTripDescription.push(tripDescription);
    mainActivety = trips[i].activityCategories[0];
    allActiveties = trips[i].activityCategories;
    aAllCategories.push(allActiveties);

    season = trips[i].season.toLowerCase();
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
        resultTitle = filteredArray[j].title;
        resultActivety = filteredArray[j].season;
        sResultRender += '<div class="resultItem" data-tripid="' + filteredArray[j].id + '"><span class="sSearchVal result_title">' + resultTitle + '</span><span class="result_season sSearchVal">' + resultActivety.replace(/_/g, " ") + '</span></div>';
      }
      sResultsDropdown.innerHTML = sResultRender;
    } else {
      // console.log(sSearchString.length);
      sResultsDropdown.classList.remove('searchActive');
      sResultsDropdown.innerHTML = '';
    }
  }
}