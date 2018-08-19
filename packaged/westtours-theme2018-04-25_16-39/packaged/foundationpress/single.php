<?php
/**
 * The template for displaying all single posts and attachments
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

get_header(); ?>

<?php get_template_part( 'template-parts/featured-image' );

 ?>

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
  $date_departure = new DateTime($date_departure);
  $date_departure = $date_departure->format('j/m/Y');
  $number = get_field('cost_per_adult'); $format_number = number_format($number, 0,'','.');
 ?>

	<article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">
		<header>
			<h1 class="entry-title"><?php the_title(); ?></h1>
			<!-- <ul>
				<li id="price"><?php // $number = get_field('cost_per_adult'); $format_number = number_format($number, 0,'','.'); echo $format_number ?> isk</li>
				<li id="per-passanger">Price pr. passenger</li>
			</ul> -->
			<?php //foundationpress_entry_meta(); ?>
		</header>


		<?php do_action( 'foundationpress_post_before_entry_content' ); ?>
		<div class="entry-content">
			<section class="post-image">
				<img src="<?php echo $img ?>" srcset="<?php echo $imgX2 ?>" alt="">
			</section>
      <div class="activety-icon">
        <img src="<?php echo get_template_directory_uri().$iconImg; ?>" alt=""/>
        <p class='single-cat'> <?php echo $activety . ' / ' . $season ?> </p>
      </div>
      <section class="post-paragraph">
        <?php the_content(); ?>
        <br>
        <ul>
          <li><strong> Season:</strong> <?php echo $season_start.' - '. $season_end;  ?></li>
          <li><strong>Departure:</strong> <?php echo $date_departure ?></li>
          <li><strong>Duration:</strong> <?php the_field('duration'); ?></li>
          <li><strong>Included:</strong> <?php the_field('included'); ?></li>
          <li><strong>Minimum:</strong> <?php the_field('minimum'); ?></li>
          <li><strong>Maximum:</strong> <?php the_field('maximum'); ?></li>
          <li><strong>Price:</strong> <?php echo $format_number; ?> ISK per person</li>
        </ul>
        </section>

			<?php edit_post_link( __( 'Edit', 'foundationpress' ), '<span class="edit-link">', '</span>' ); ?>
		</div>
		<footer>
			<?php wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
			<p><?php the_tags(); ?></p>
		</footer>
		<?php the_post_navigation(); ?>
		<?php do_action( 'foundationpress_post_before_comments' ); ?>
		<?php // comments_template(); ?>
		<?php do_action( 'foundationpress_post_after_comments' ); ?>
	</article>
<?php endwhile;?>

<?php do_action( 'foundationpress_after_content' ); ?>
<?php  //get_sidebar(); ?>
</div>
<?php get_footer();
