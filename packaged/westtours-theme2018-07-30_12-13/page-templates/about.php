<?php

/*
Template Name: about
*/

get_header();
$iconImg = '/assets/images/icons/excl.svg';
// general
$generalHeading = get_field('general_heading');
$aboutusText = get_field('about_text');
// Contact
$contactHeading = get_field('contact');
$contactText = get_field('contact_text');
// Opening hours
$openHoursHeading = get_field('opening_hours');
$openHoursText = get_field('opening_hours_text');
// Booking conditions
$bookingConHeading = get_field('booking_conditions');
$bookingConText = get_field('booking_conditions_text');

$frontpageId = url_to_postid( site_url('frontpage') );

$hero_image = get_field('hero-img', $frontpageId);
$img = array();
foreach ($hero_image as $value) {
  $img[] = $value;
}
 $randNumber =  mt_rand(0,count($img)-1);

?>

<div id="single-post" role="main" class="row">

	<article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">
		<header>
			<h1 class="entry-title"><?php the_title(); ?></h1>

		</header>


		<?php do_action( 'foundationpress_post_before_entry_content' ); ?>
		<div class="entry-content">
      <div class="hero-bannerinn about-banner" data-interchange="[<?php echo $img[$randNumber]['sizes']['fp-small'] ?>, small], [<?php echo $img[$randNumber]['sizes']['fp-medium'] ?>, medium], [<?php echo $img[$randNumber]['sizes']['fp-large'] ?>, large], [<?php echo $img[$randNumber]['sizes']['fp-large'] ?>, xlarge], [<?php echo $img[$randNumber]['sizes']['fp-retina'] ?>, xxlarge]">
      <?php # get_template_part('template-parts/main-filter'); ?>
      </div>
      <div class="activety-icon about-icon">
        <?php echo get_template_part('assets/images/icons/about-usp'); ?>
        <p class='single-cat'>  </p>
      </div>

      <ul class="tabs" data-tabs id="example-tabs">
      <?php if($generalHeading): ?>
        <li class="tabs-title is-active"><a href="#panel1" aria-selected="true"><?php echo $generalHeading; ?></a></li>
      <?php endif; if($contactHeading): ?>
        <li class="tabs-title"><a data-tabs-target="panel2" href="#panel2"><?php echo $contactHeading; ?></a></li>
      <?php endif; if($openHoursHeading): ?>
        <li class="tabs-title"><a data-tabs-target="panel3" href="#panel3"><?php echo $openHoursHeading; ?></a></li>
      <?php endif; if($bookingConHeading): ?>
        <li class="tabs-title"><a data-tabs-target="panel4" href="#panel4"><?php echo $bookingConHeading; ?></a></li>
      <?php endif; ?>
      </ul>

      <div class="tabs-content" data-tabs-content="example-tabs">
        <div class="tabs-panel is-active" id="panel1">
          <h2 class="h2-wrapper"><?php echo $generalHeading; ?></h2>
          <section class="post-paragraph">
            <?php  echo $aboutusText; ?>
          </section>
        </div>
        <div class="tabs-panel" id="panel2">
          <h2 class="h2-wrapper"><?php echo $contactHeading; ?></h2>
          <section class="post-paragraph">
            <?php  echo $contactText; ?>
          </section>
        </div>
        <div class="tabs-panel" id="panel3">
          <h2 class="h2-wrapper"><?php echo $openHoursHeading; ?></h2>
          <section class="post-paragraph">
            <?php  echo $openHoursText; ?>
          </section>
        </div>
        <div class="tabs-panel" id="panel4">
          <h2 class="h2-wrapper"><?php echo $bookingConHeading; ?></h2>
          <section class="post-paragraph">
            <?php  echo $bookingConText; ?>
          </section>
        </div>
      </div>






		</div>
    	<?php # edit_post_link( __( 'Edit', 'foundationpress' ), '<span class="edit-link">', '</span>' ); ?>


		<footer>
			<?php # wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
			<p><?php # the_tags(); ?></p>
		</footer>
		<?php # the_post_navigation(); ?>

	</article>




</div>



<?php get_footer();
