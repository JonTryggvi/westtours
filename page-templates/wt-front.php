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
  <article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">
      <header>
          <h1 class="entry-title"><?php // the_title(); ?></h1>
      </header>

      <?php do_action( 'foundationpress_page_before_entry_content' ); ?>
      <div class="entry-content">
          <?php the_content(); ?>
      </div>
      <footer>
          <?php wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
          <p><?php the_tags(); ?></p>
      </footer>
      <?php do_action( 'foundationpress_page_before_comments' ); ?>
      <?php comments_template(); ?>
      <?php do_action( 'foundationpress_page_after_comments' ); ?>
      <div id="big-cards" class="row">

      </div>
  </article>
<?php endwhile;?>

<?php do_action( 'foundationpress_after_content' ); ?>

</div>

<?php get_footer();
