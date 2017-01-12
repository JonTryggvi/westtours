  <div id="site-navigation" class="main-navigation top-bar row" role="navigation">
    <div class="top-bar-left large-3">
      <ul class="menu">
        <li class="home"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><img src="<?php echo get_template_directory_uri() . '/assets/images/icons/logo.svg' ?>" alt=""/></a></li>
      </ul>
    </div>
    <div class="top-bar-left centerMenu large-4">
      <?php foundationpress_top_bar_l(); ?>

      <?php if ( ! get_theme_mod( 'wpt_mobile_menu_layout' ) || get_theme_mod( 'wpt_mobile_menu_layout' ) === 'topbar' ) : ?>
        <?php get_template_part( 'template-parts/mobile-top-bar' ); ?>
      <?php endif; ?>
    </div>
    <div class="top-bar-left large-4 large-offset-1">
      <ul class="nav-filter align-right">
        <li class="lang">
          <select class="easy-dropdown" name="">
            <option value="icelandic">Íslenska</option>
            <option value="english">English</option>
          </select>
        </li>
        <li class="menu-item"><a href="#"><img src="<?php echo get_template_directory_uri() . '/assets/images/icons/spyGlass.svg' ;?>" alt=""></a></li>
      </ul>
    </div>
  </div>
