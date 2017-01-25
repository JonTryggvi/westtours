
<?php
$body_classes = get_body_class();
if(in_array('single', $body_classes))
{
   $bodyColor = "anti-transparent-background-2000";
} else {
  $bodyColor = "";
}
 ?>

  <div class="title-bar" data-responsive-toggle="site-navigation">
    <div class="title-bar-title">
      <a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><img src="<?php echo get_template_directory_uri() . '/assets/images/icons/logo-single.svg' ?>" alt=""/></a>
    </div>
  </div>

<div class="main-nav-container <?php echo $bodyColor ?>">
  <nav id="site-navigation" class="main-navigation top-bar row" role="navigation">
    <div class="top-bar-left">
      <ul class="menu">
        <li class="home"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><img src="<?php echo get_template_directory_uri() . '/assets/images/icons/logo.svg' ?>" alt=""/></a></li>
      </ul>
    </div>
    <div class="top-bar-center ">
      <?php foundationpress_top_bar_c(); ?>

      <?php if ( ! get_theme_mod( 'wpt_mobile_menu_layout' ) || get_theme_mod( 'wpt_mobile_menu_layout' ) === 'topbar' ) : ?>
        <?php get_template_part( 'template-parts/mobile-top-bar' ); ?>
      <?php endif; ?>
    </div>
    <div class="search-bar float-right">
      <ul>
        <li class="lang">
          <select class="easy-dropdown" name="">
            <option value="">Íslenska</option>
            <option value="">English</option>
          </select>
        </li>
        <li class="spyglass">
          <img src="<?php echo get_template_directory_uri().'/assets/images/icons/spyglass.svg'?>" alt="">
        </li>
      </ul>
    </div>
  </nav>
</div>
