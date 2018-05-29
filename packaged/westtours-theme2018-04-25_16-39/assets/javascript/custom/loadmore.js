var addToOffset = 0;

function loadMoreTrips(postQuery, currentPage, theTHis) {
  var btnLoadTxt = '';
  var btnGettingTxt = '';
  switch (isEnglish) {
    case '1':
      btnLoadTxt = 'Show more trips';
      btnGettingTxt = 'Geting more trips...';
      break;
    case '0':
      btnLoadTxt = 'Sýna fleiri ferðir';
      btnGettingTxt = 'Sæki fleiri...';
      break;
    default:

  }
  // console.log(btnGettingTxt);
  // var n = postsFpTrip.slice(5);
  addToOffset += 4;
  // console.log(addToOffset);

  var button = theTHis,
    data = {
      'action': 'loadmore',
      'query': postQuery, // that's how we get params from wp_localize_script() function
      'page': currentPage,
      'offsetMod': addToOffset
    };
  // console.log(data.query);

  $.ajax({
    url: themeUrl.ajaxurl, // AJAX handler
    data: data,
    type: 'POST',
    beforeSend: function(xhr) {
      // console.log(xhr);
      button.text(btnGettingTxt); // change the button text, you can also add a preloader image
    },
    success: function(data) {
      if (data) {
        button.text(btnLoadTxt).prev().before(data); // insert new posts
        current_pagetFpTrip++;
        console.log(current_pagetFpTrip);
        if (current_pagetFpTrip == max_pageFpTrip)
          button.remove(); // if last page, remove the button
      } else {
        button.remove(); // if no data, remove the button as well
      }
    }
  });
}

$('#btnShowMore').click(function() {
  loadMoreTrips(postsFpTrip, current_pagetFpTrip, $(this));
});
$('#btnShowMoreFp').click(function() {
  loadMoreTrips(postsFpTrip, current_pagetFpTrip, $(this));
});