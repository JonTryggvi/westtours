<?php
/**
 * The template for displaying archive pages
 *
 * Used to display archive-type pages if nothing more specific matches a query.
 * For example, puts together date-based pages if no date.php file exists.
 *
 * If you'd like to further customize these archive views, you may create a
 * new template file for each one. For example, tag.php (Tag archives),
 * category.php (Category archives), author.php (Author archives), etc.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

  get_header(); ?>

<div class="archive-page" role="main">
<!-- <div id="page" class="page" role="main"> -->
  <section class="front-smallCards-container trips-page">
    <h1>All Trips</h1>
    <div id="cards" class="cards owl-carousel owl-theme show-for-medium">
      <?php # echo do_shortcode('[ajax_load_more id="smallCardId" posts_per_page="4" container_type="div" post_type="tour_post_type" scroll_container="#cards" button_label="Show more trips" button_loading_label="Hang on!"]');?>
      <?php
        // var_dump(get_query_var('paged'));
        $paged = ( get_query_var('paged') ) ? get_query_var('paged') : 1;
        // var_dump($exclude_posts);
        $args2 = array( 'post_type' => 'tour_post_type', 'posts_per_page'=> 4, 'offset'=>0, 'paged' => 1);
        $query_smallCards = new WP_Query($args2);

        if ($query_smallCards->have_posts()): while ($query_smallCards->have_posts()) : $query_smallCards->the_post();
          get_template_part( 'template-parts/smallcards', get_post_format() );

        endwhile; ?><?php endif; /*wp_reset_query();*/ ?>

      <script>
      // {ID} is any unique name, example: b1, q9, qq, misha etc, it should be uniq
      var postsFpTrip = '<?php echo json_encode($query_smallCards->query_vars); ?>',
          current_pagetFpTrip = <?php echo $query_smallCards->query_vars['paged']; ?>,
          max_pageFpTrip = <?php echo $query_smallCards->max_num_pages; ?>;
          // console.log(current_pagetFpTrip);
      </script>
      <button id="btnShowMore" type="button" class="show-more" name="button">Show more trips</button>
    </div>
    <div id="cardsMobile" class="cards owl-carousel hide-for-medium isDiv">
      <?php
        $argsMobile = array( 'post_type' => 'tour_post_type' );
        $query_smallCards = new WP_Query($argsMobile);

        if ($query_smallCards->have_posts()): while ($query_smallCards->have_posts()) : $query_smallCards->the_post();
          get_template_part( 'template-parts/smallcards', get_post_format() );

        endwhile; endif; wp_reset_query();
       ?>

    </div>
  </section>


</div>

<?php get_footer();
