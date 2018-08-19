<?php
/**
 * The template for displaying the header
 *
 * Displays all of the head element and everything up until the "container" div.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */
 $classes = get_body_class();
 if (in_array('single-tour_post_type',$classes)) {
    $isTourPost = true;
 } else {
	 $isTourPost = false;
 }

?>
<!doctype html>
<html class="no-js" <?php language_attributes(); ?> >
	<head>
		<meta charset="<?php bloginfo('charset'); ?>" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<?php wp_head(); ?>
	</head>

	<body <?php body_class(); ?>>
		<div id="loader" class="loader">
      <div id="loaderMessage" class="loaderMessage">

      </div>
		</div>
	<?php do_action('foundationpress_after_body'); ?>

	<?php if (get_theme_mod('wpt_mobile_menu_layout') === 'offcanvas') : ?>
	<button class="menu-burger call burger show-for-small-only" type="button" data-toggle="offCanvas">
		<span></span>
		<span></span>
		<span></span>
	</button>

	<div class="off-canvas-wrapper">
		<div class="off-canvas-wrapper-inner" data-off-canvas-wrapper data-off-canvas-content>
		<?php get_template_part('template-parts/mobile-off-canvas'); ?>
	<?php endif; ?>

	<?php do_action('foundationpress_layout_start'); ?>



	<section class="container">
    <header id="masthead" class="site-header" role="banner">
       <?php get_template_part('template-parts/nav'); ?>
    </header>
    <?php get_template_part('template-parts/mobileform'); ?>
		<?php do_action('foundationpress_after_header');
