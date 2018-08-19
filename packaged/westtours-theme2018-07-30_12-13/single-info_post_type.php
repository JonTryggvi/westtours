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
  $nutrition_image = get_field('info-img');
  $img = $nutrition_image['sizes']['fp-xlarge'];
  $imgX2 = $nutrition_image['sizes']['hero-img-sizer'];
  $alt = $nutrition_image['alt'];
  // $iconImg = get_template_directory_uri().'/assets/images/icons/info.svg';



 ?>

	<article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">
		<header>
			<h1 class="entry-title"><?php the_title(); ?></h1>
		</header>


		<?php do_action( 'foundationpress_post_before_entry_content' ); ?>
		<div class="entry-content">
			<section class="post-image info-posts">
				<img src="<?php echo $img; ?>" srcset="<?php echo $imgx2;?>" alt="">
			</section>

      <section class="post-paragraph info-post-paragraph">
        <?php the_content(); ?>
      
      </section>


		</div>
    	<?php  edit_post_link( __( 'Edit', 'foundationpress' ), '<span class="edit-link">', '</span>' ); ?>


		<footer>
			<?php wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
			<p><?php the_tags(); ?></p>
		</footer>
		<?php # the_post_navigation(); ?>

	</article>
<?php endwhile;?>



<?php do_action( 'foundationpress_after_content' ); ?>
<?php  //get_sidebar(); ?>
</div>



<section class="front-smallCards-container">
  <h1>Interesting activeties</h1>
  <div id="cardsPostWiki" class="cards owl-carousel test">
    <?php # echo do_shortcode('[ajax_load_more id="smallCardId" posts_per_page="4" container_type="div" post_type="tour_post_type" scroll_container="#cards" button_label="Show more trips" button_loading_label="Hang on!"]');?>
    <?php
      $args2 = array( 'post_type' => 'tour_post_type' );
      $query_smallCards = new WP_Query($args2);
      if ($query_smallCards->have_posts()): while ($query_smallCards->have_posts()) : $query_smallCards->the_post();
        get_template_part( 'template-parts/smallcards', get_post_format() );
      endwhile; endif; wp_reset_query(); ?>
  </div>

</section>


<?php get_footer();
