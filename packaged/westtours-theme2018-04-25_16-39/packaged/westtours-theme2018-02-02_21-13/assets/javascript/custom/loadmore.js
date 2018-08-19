$('#btnShowMore').click(function() {
  // postsFpTrip = JSON.stringify(postsFpTrip);
  // postsFpTrip = JSON.parse(postsFpTrip);
  // console.log(postsFpTrip);

  // var n = postsFpTrip.slice(5);
  var button = $(this),
    data = {
      'action': 'loadmore',
      'query': postsFpTrip, // that's how we get params from wp_localize_script() function
      'page': current_pagetFpTrip
    };

  $.ajax({
    url: themeUrl.ajaxurl, // AJAX handler
    data: data,
    type: 'POST',
    beforeSend: function(xhr) {
      // console.log(xhr);
      button.text('Geting more trips...'); // change the button text, you can also add a preloader image
    },
    success: function(data) {
      if (data) {
        button.text('Show more trips').prev().before(data); // insert new posts
        current_pagetFpTrip++;
        // console.log(data);
        if (current_pagetFpTrip == max_pageFpTrip)
          button.remove(); // if last page, remove the button
      } else {
        button.remove(); // if no data, remove the button as well
      }
    }
  });
});