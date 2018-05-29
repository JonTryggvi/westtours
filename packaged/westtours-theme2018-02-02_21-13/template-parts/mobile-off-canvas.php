<?php
/**
 * Template part for off canvas menu
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

?>

<nav class="off-canvas position-left" id="offCanvas" data-off-canvas data-auto-focus="false" data-position="left" role="navigation">
  <div class="title-bar" data-responsive-toggle="site-navigation">
    <div class="title-bar-title">
      <a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><img src="<?php echo get_template_directory_uri() . '/assets/images/icons/logo-single.svg' ?>" alt=""/></a>
    </div>
  </div>
  <div class="mobile-menu-container">
    <div class="mobile-nav-search">
      <!-- <input class="mobile-search" type="search" name="" value="" placeholder="test"> -->
      <?php get_template_part('searchform'); ?>
    </div>
    <?php foundationpress_mobile_nav(); ?>
  </div>

</nav>

<div class="off-canvas-content" data-off-canvas-content>
