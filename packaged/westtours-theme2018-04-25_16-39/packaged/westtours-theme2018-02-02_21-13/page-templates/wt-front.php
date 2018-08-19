<?php
/*
Template Name: westtours front
*/
get_header(); ?>


<?php
  $nutrition_image = get_field('hero-img');
  $img = $nutrition_image['sizes']['hero-img-sizer'];
  $alt = $nutrition_image['alt'];
?>
<div class="hero-bannerinn" style="background-image:url('<?php echo $img ?>')">
<?php get_template_part('template-parts/main-filter'); ?>
</div>
<div id="page-full-width" role="main">

<?php do_action( 'foundationpress_before_content' ); ?>

<?php while ( have_posts() ) : the_post(); ?>
  <section class="front-bigCards-container hide-for-small-only">
    <h1>Our most popular hiking tours</h1>
      <div id="big-cards" class="">
        
      </div>
  </section>

  <section class="front-smallCards-container">
    <h1>Interesting activeties</h1>
    <div id="cards" class=""></div>
    <button type="button" class="show-more" name="button">Show more trips</button>
  </section>

  </article>




<?php endwhile;?>

<?php do_action( 'foundationpress_after_content' ); ?>

</div>


 <!-- information chapters -->

<?php $loop = new WP_Query( array( 'post_type' => 'info_post_type', 'posts_per_page' => 2, 'orderby' => 'rand' ) ); $count =0; $color; ?>
<?php while ( $loop->have_posts() ) : $loop->the_post();
$nutrition_image = get_field('info-img');
$img_info = $nutrition_image['sizes']['info-img-sizer'];
$alt = $nutrition_image['alt']; $count++;
 if($count == 1){$color = 'red';}else{$color='blue';} ?>
<section class="fw chapter-parent">
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
<?php get_template_part('template-parts/emaillist'); ?>
<?php get_footer();
