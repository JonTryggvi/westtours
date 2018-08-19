var onScroll = function(container, theclass, amount) {
  var wrap = $(container);
  $(window).scroll(function() {
    if ($(document).scrollTop() > amount) {
      wrap.addClass(theclass);
    } else {
      wrap.removeClass(theclass);
    }
  });
};

onScroll('.main-nav-container', 'set-nav-position', 1);

$('.call').click(function() {
  $('.burger').toggleClass('thex');
  $('body').toggleClass('stop-scrolling');
  // $('#offCanvas').toggleClass('position-left');
  //  $(document).foundation();
});

$('.is-accordion-submenu-parent').click(function() {
  // $('body').toggleClass('stop-scrolling');
});

$('.is-dropdown-submenu-parent').mouseover(function() {
  $('.first-sub').toggleClass('menu-animation');
});

$('.filterbutton').on('click', function() {
  $('#navActivety').addClass('showNavActivety');
  $('body').addClass('stop-scrolling');
});

$('#closeActivetyNav').on('click', function() {
  $('#navActivety').removeClass('showNavActivety');
  $('body').removeClass('stop-scrolling');
});

$('.spyglass').click(function() {
  $('.search-dropdown').toggleClass('show-search');
  $('.main-nav-container').toggleClass('anti-transparent-background-2000');
});





// console.dir(sM);
var mobileSearchBtn = $('#searchformMobile');
var mobileSearchInput = $('#sM');
$(document).keyup(function(e) {

  if (e.which == 13 && mobileSearchInput.val().length > 0) {
    mobileSearchBtn.submit();
  }
});


$("#fpFilter").click(function() {
  $('html, body').animate({
    scrollTop: $("#fpFilter").offset().top - 200
  }, 1000);
});