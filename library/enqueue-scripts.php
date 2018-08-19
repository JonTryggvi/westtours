<?php
/**
 * Enqueue all styles and scripts
 *
 * Learn more about enqueue_script: {@link https://codex.wordpress.org/Function_Reference/wp_enqueue_script}
 * Learn more about enqueue_style: {@link https://codex.wordpress.org/Function_Reference/wp_enqueue_style }
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */



if ( ! function_exists( 'foundationpress_scripts' ) ) :
	function foundationpress_scripts() {




		$selectedLanguage = pll_current_language();

			if($selectedLanguage == 'en' || $selectedLanguage == undefined ) {
				$isEnglish = 1;
			} else {
				$isEnglish = 0;
			}




	// wp_enqueue_style( 'flatpick',  '//cdnjs.cloudflare.com/ajax/libs/jquery-date-range-picker/0.16.1/daterangepicker.min.css', array(), '2.9.0', 'all' );
  wp_enqueue_style( 'dataTables-css',  '//cdn.datatables.net/1.10.16/css/jquery.dataTables.min.css', array(), '2.9.0', 'all' );
	wp_enqueue_style( 'flatpickr', get_template_directory_uri() .  '/assets/javascript/flapickr/flatpickr.min.css', array(), '2.9.0', 'all' );
	wp_enqueue_style( 'telInpuut', get_template_directory_uri() .  '/assets/components/phoneInput/css/intlTelInput.css', array(), '2.9.0', 'all' );


	// Enqueue the main Stylesheet.
	wp_enqueue_style( 'main-stylesheet', get_template_directory_uri() . '/assets/stylesheets/foundation.css', array(), '2.9.0', 'all' );

	// Deregister the jquery version bundled with WordPress.
	wp_deregister_script( 'jquery' );

	// CDN hosted jQuery placed in the header, as some plugins require that jQuery is loaded in the header.
	wp_enqueue_script( 'jquery', '//ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js', array(), '2.1.0', false );

	wp_enqueue_script( 'moment', '//cdnjs.cloudflare.com/ajax/libs/moment.js/2.19.1/moment.min.js', array('jquery'), '', true );



	wp_enqueue_script( 'flatpickr', get_template_directory_uri() . '/assets/javascript/flapickr/flatpickr.min.js', array('jquery'), '', true );
	wp_enqueue_script( 'flatpickr-lang', get_template_directory_uri() . '/assets/javascript/flapickr/l10n/is.js', array('jquery'), '', true );
	wp_enqueue_script( 'phoneInputJs', get_template_directory_uri() . '/assets/components/phoneInput/js/intlTelInput.min.js', array('jquery'), '', true );

	// wp_enqueue_script( 'select2', '//cdnjs.cloudflare.com/ajax/libs/select2/4.0.3/js/select2.min.js', array('jquery'), '', true );

	// wp_enqueue_script( 'easydropdown', get_template_directory_uri() . '/assets/javascript/jquery.easydropdown.js', array('jquery'), '2.9.0', true );

	wp_enqueue_script( 'dataTables', '//cdn.datatables.net/1.10.16/js/jquery.dataTables.min.js', array('jquery'), '2.9.0', true );

	// If you'd like to cherry-pick the foundation components you need in your project, head over to gulpfile.js and see lines 35-54.
	// It's a good idea to do this, performance-wise. No need to load everything if you're just going to use the grid anyway, you know :)
	// wp_enqueue_script( 'api', get_template_directory_uri() . '/assets/javascript/api.js', array('jquery'), '2.9.0', true );

	wp_enqueue_script( 'foundation', get_template_directory_uri() . '/assets/javascript/foundation.js', array('jquery'), '2.9.0', true );
	global $wp_query;
	// var_dump($isEnglish);
	$trips = get_post_type_object( 'tour' );
	$translation_array = array(
		'templateUrl' => get_stylesheet_directory_uri(),
		'ajaxurl' => site_url() . '/wp-admin/admin-ajax.php',
		'isEnglish' => $isEnglish
		
	 );
//after wp_enqueue_script
	wp_localize_script( 'foundation', 'themeUrl', $translation_array );

	if(is_singular('tour')) {
		wp_enqueue_script( 'tour-post-type', get_template_directory_uri() . '/assets/javascript/tours.js', array('jquery'), '2.9.0', true );
	}

	wp_enqueue_script('googlemaps', '//maps.googleapis.com/maps/api/js?key=AIzaSyAn15iQCL6oH7e4gCQzmJW03WKpzpxKRuo',null,null,true);

	// Add the comment-reply library on pages where it is necessary
	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}

	}

	add_action( 'wp_enqueue_scripts', 'foundationpress_scripts' );




endif;
