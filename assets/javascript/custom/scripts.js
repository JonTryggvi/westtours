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




$('.is-accordion-submenu-parent').click(function(){
	// $('body').toggleClass('stop-scrolling');
});

$('.is-dropdown-submenu-parent').mouseover(function(){
	$('.first-sub').toggleClass('menu-animation');
});
