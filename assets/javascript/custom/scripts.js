var onScroll = function(container, theclass, amount) {
		var wrap = $(container);
		$(window).scroll(function(){
			if ($(document).scrollTop() > amount) {
				wrap.addClass(theclass);
			} else {
			  wrap.removeClass(theclass);
			}
		});
	};

onScroll('.main-nav-container','set-nav-position', 1 );


$('.call').click(function(){
	$('.burger').toggleClass('thex');
	$('body').toggleClass('stop-scrolling');
});

// $('.lang').click(function(){
// 	if($('.open')){
// 		$('.main-nav-container').addClass('anti-transparent-background-2000');
// 	}else {
// 		$('.main-nav-container').removeClass('anti-transparent-background-2000');
// 	}
//
// });

$('.is-accordion-submenu-parent').click(function(){
	// $('body').toggleClass('stop-scrolling');
});

$('.is-dropdown-submenu-parent').mouseover(function(){
	$('.first-sub').toggleClass('menu-animation');
});

 $(".chosen-select").chosen({disable_search_threshold: 10});

// $( function() {
//     $( "#datepicker" ).datepicker({
//       numberOfMonths: 2,
//       showButtonPanel: false,
// 			showAnim: "fadeIn",
// 			showOptions: { direction: "down" }
//     });
//   } );

	$( function() {
	 var dateFormat = "dd MMMM yy",
		 from = $( "#from" )
			 .datepicker({
				 changeMonth: false,
				 numberOfMonths: 2,
				 showButtonPanel: false,
				 showAnim: "fadeIn",
				 showOptions: { direction: "down" }
			 })
			 .on( "change", function() {
				 to.datepicker( "option", "minDate", getDate( this ) );
			 }),
		 to = $( "#to" ).datepicker({
			 changeMonth: false,
			 numberOfMonths: 2,
			 showButtonPanel: false,
			 showAnim: "fadeIn",
			 showOptions: { direction: "down" }
		 })
		 .on( "change", function() {
			 from.datepicker( "option", "maxDate", getDate( this ) );
		 });

	 function getDate( element ) {
		 var date;
		 try {
			 date = $.datepicker.parseDate( dateFormat, element.value );
		 } catch( error ) {
			 date = null;
		 }

		 return date;
	 }
 } );

//
// var elem = $('.dropdown');
//
// Foundation.Motion.animateIn(elem, animationClass [, callback]);
// Foundation.Motion.animateOut(elem, animationClass [, callback]);
