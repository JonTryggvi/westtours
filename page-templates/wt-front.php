<?php
/*
Template Name: custom front
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

  <div id="big-cards" class="row">

  </div>
  <div id="cards" class="row">

  </div>

      <?php do_action( 'foundationpress_page_before_comments' ); ?>

      <?php do_action( 'foundationpress_page_after_comments' ); ?>

  </article>
<?php endwhile;?>

<?php do_action( 'foundationpress_after_content' ); ?>

</div>

<?php get_footer();
