
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

    onScroll('.dropdown-main-container','set-nav-position', 24 );
