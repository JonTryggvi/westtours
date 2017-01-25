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
$img = $nutrition_image['sizes']['fp-large'];
$alt = $nutrition_image['alt'];
 ?>

	<article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">
		<header>
			<h1 class="entry-title"><?php the_title(); ?></h1>
			<ul>
				<li id="price"><?php $number = get_field('cost_per_adult'); $format_number = number_format($number, 0,'','.'); echo $format_number ?> isk</li>
				<li id="per-passanger">Price pr. passenger</li>
			</ul>
			<?php //foundationpress_entry_meta(); ?>
		</header>


		<?php do_action( 'foundationpress_post_before_entry_content' ); ?>
		<div class="entry-content">
			<section class="post-image">
				<img src="<?php echo $img ?>" alt="">
			</section>
			<?php the_content(); ?>
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
