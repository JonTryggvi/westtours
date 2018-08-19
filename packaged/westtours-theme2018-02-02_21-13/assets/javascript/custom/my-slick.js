function resize(event) {
  // console.log(event);
  owl.trigger('destroy.owl.carousel');
}
if (window.innerWidth <= 1024) {
  var owl = $('#cards');
  owl.owlCarousel({
    dots: false,
    responsive: {
      0: {
        items: 1,
        nav: false,
        loop: true,
        stagePadding: 30,
        dots: false
      },
      640: {
        items: 2,
        nav: false,
        loop: true,
        stagePadding: 10,
        dots: false
      },
      1024: {
        items: 2,
        nav: false,
        loop: true,
        stagePadding: 35,
        dots: false,
        onResize: resize
      }
    }
  });

}
var carpostOptions = {
  items: 1,
  nav: false,
  loop: true,
  stagePadding: 10,
  dots: false,
  autoplay: true,

  responsive: {
    0: {
      items: 1,
      nav: false,
      loop: true,
      stagePadding: 30,
      dots: false
    },
    640: {
      items: 2,
      nav: false,
      loop: true,
      stagePadding: 90,
      dots: false
    },
    1024: {
      items: 3,
      nav: false,
      loop: true,
      stagePadding: 10,
      dots: false
      // onResize: resize
    },
    1200: {
      items: 4,
      nav: false,
      loop: true,
      stagePadding: 10,
      dots: false
      // onResize: resize
    }
  }
};
var postOwl = $('#cardsPost');
var postOwlWiki = $('#cardsPostWiki');
postOwl.owlCarousel(carpostOptions);
postOwlWiki.owlCarousel(carpostOptions);
var postOwlFp = $('#cardsMobile');
postOwlFp.owlCarousel({
  items: 1,
  nav: false,
  loop: true,
  stagePadding: 10,
  dots: false,
  autoplay: true,

  responsive: {
    0: {
      items: 1,
      nav: false,
      loop: true,
      stagePadding: 30,
      dots: false
    },
    640: {
      items: 2,
      nav: false,
      loop: true,
      stagePadding: 90,
      dots: false
    },
    1024: {
      items: 3,
      nav: false,
      loop: true,
      stagePadding: 10,
      dots: false
      // onResize: resize
    },
    1200: {
      items: 4,
      nav: false,
      loop: true,
      stagePadding: 10,
      dots: false
      // onResize: resize
    }
  }
});





// $(window).resize(function(){
//   console.log('x');
//   if(window.innerWidth <= 1024) {
//      owl.trigger('destroy.owl.carousel');
//   }
//
// })