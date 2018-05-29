<?php
/**
 * The template for displaying all single posts and attachments
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */
get_header(); ?>

<div id="single-post" role="main" class="row">

<?php do_action( 'foundationpress_before_content' ); ?>
<?php while ( have_posts() ) : the_post();
  $nutrition_image = get_field('img');
  $img = $nutrition_image['sizes']['fp-xlarge'];
  $imgX2 = $nutrition_image['sizes']['hero-img-sizer'];
  $alt = $nutrition_image['alt'];
  $iconImg = '';
    if(get_field('activety')=='Sailing') {
      $iconImg = '/assets/images/icons/catIcons/sailing.svg';
    }elseif(get_field('activety')=='Food'){
      $iconImg = '/assets/images/icons/catIcons/food.svg';
    }elseif(get_field('activety')=='Cycling'){
      $iconImg = '/assets/images/icons/catIcons/cycling.svg';
    }elseif(get_field('activety')=='Animal life'){
      $iconImg = '/assets/images/icons/catIcons/animal-life.svg';
    }elseif(get_field('activety')=='Hiking'){
      $iconImg = '/assets/images/icons/catIcons/hiking.svg';
    }
    $activety = get_field('activety');
    $season = get_field('season');

    $date_start = get_field('season-start', false, false);
    $date_start = new DateTime($date_start);
    $season_start = $date_start->format('j/m/Y');

    $date_end = get_field('season-end', false, false);
    $date_end = new DateTime($date_end);
    $season_end = $date_end->format('j/m/Y');

    $date_departure = get_field('departure', false, false);
    // $date_departure = new DateTime($date_departure);
    // $date_departure = $date_departure->format('j/m/Y');

    $number = get_field('cost_per_adult');
    if($number < 9999){
      $format_number = number_format($number, 0 ,',','.');
    }elseif($number >= 10000){
      $format_number = number_format($number, 0 ,',','.');
    }

    if(!empty(get_field('cost_per_children'))){
      $number_child = get_field('cost_per_children'); if($number_child < 9999) {$format_child = number_format($number_child, 3,',','.');}elseif($number_child >= 10000){$format_number = number_format($number_child, 0 ,',','.');}
    }elseif(!empty(get_field('cost_per_infant'))){
        $number_infant = get_field('cost_per_infant'); if($number_infant < 9999){$format_infant = number_format($number_infant,3,',','.');}elseif($number_infant >= 10000){$format_infant = number_format($number_infant,3,',','.');}
     }
    $location = get_field('location');
 ?>

	<article <?php post_class('main-content'); ?> id="post-<?php the_ID(); ?>">
		<header>
			<h1 class="entry-title"><?php the_title(); ?></h1>
		</header>


		<?php do_action( 'foundationpress_post_before_entry_content' ); ?>
		<div class="entry-content">
			<section class="post-image">
				<img src="<?php echo $img; ?>" srcset="<?php echo $imgx2;?>" alt="">
        <div class="single-booked">
          <div class="medium-10 medium-offset-1 single-booked-placeholder">

          </div>
        </div>
			</section>
      <div class="activety-icon">
        <img src="<?php echo get_template_directory_uri().$iconImg; ?>" alt=""/>
        <p class='single-cat'> <?php echo $activety . ' / ' . $season; ?> </p>
      </div>
      <section class="post-paragraph">
        <?php the_content(); ?>
      
          <?php  if (!empty(get_field('special-anounsment'))) : ?>
            <p class="special-anounsment"><strong><?php the_field('special-anounsment'); ?></strong>  </p>
          <?php endif; ?>
        <ul>
          <li><strong> Season:</strong> <?php echo $season_start.' - '. $season_end;  ?></li>
          <li><strong>Departure:</strong> <?php echo $date_departure; ?></li>
          <li><strong>Duration:</strong> <?php the_field('duration'); ?></li>
          <li><strong>Included:</strong> <?php the_field('included'); ?></li>
          <li><strong>Minimum:</strong> <?php the_field('minimum'); ?></li>
          <li><strong>Maximum:</strong> <?php the_field('maximum'); ?></li>
          <li><strong>Price:</strong> <?php echo $format_number; ?> ISK per person <?php if (!empty(get_field('cost_per_children'))): ?>, <?php echo $format_child; ?><p>ISK per child</p>  <?php elseif (!empty(get_field('cost_per_infant'))) :?>, <?php echo $format_infant;?><p>ISK per infant</p>  <?php endif; ?></li>
        </ul>

        </section>
        <section class="map-container">
          <h2>Map view</h2>
        </section>
        <section id="theMap" class="acf-map">
          <div class="marker" data-lat="<?php echo $location['lat']; ?>" data-lng="<?php echo $location['lng']; ?>"></div>
        </section>

		</div>
    	<?php edit_post_link( __( 'Edit', 'foundationpress' ), '<span class="edit-link">', '</span>' ); ?>


		<footer>

		</footer>
		<?php // the_post_navigation(); ?>

	</article>
<?php endwhile; wp_reset_query(); ?>



<?php do_action( 'foundationpress_after_content' ); ?>

</div>

<?php $loop = new WP_Query( array( 'post_type' => 'info_post_type', 'posts_per_page' => 1, 'orderby' => 'rand' ) ); $count = mt_rand(1,2); $color; ?>
<?php while ( $loop->have_posts() ) : $loop->the_post();
$nutrition_image = get_field('info-img');
$img_info = $nutrition_image['sizes']['info-img-sizer'];
$alt = $nutrition_image['alt'];
 if($count == 1){$color = 'red';}elseif($count == 2){$color='blue';}  ?>
<section class="fw chapter-parent chapter-single-page">
  <h2 style="text-align: center;">Did you know?</h2>
  <div class="row align-center small-12 medium-12 large-6 chapter-<?php echo $color; ?>">
    <div class="small-8 small-offset-2">
      <h2><?php the_title(); ?></h2>
      <p>
        <?php the_field('excerpt'); ?>
      </p>

    </div>
    <a class="chapter-<?php echo $color; ?>-btn" href="<?php echo get_permalink(); ?>">Read More</a>
  </div>

  <div class="small-12 medium-12 large-6 chapter-<?php echo $color; ?>-img" style="background-image:url(<?php echo $img_info ?>);">

  </div>

</section>
<?php endwhile; wp_reset_query(); ?>

<section class="front-smallCards-container smallCards-single">
  <h1>Interesting activeties</h1>
  <div id="cards" class=""></div>
  <button type="button" class="show-more" name="button">Show more trips</button>
</section>


<?php get_footer();
