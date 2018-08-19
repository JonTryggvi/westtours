<?php
/*
Template Name: westtours front php
*/
get_header(); ?>

<?php
  $hero_image = get_field('hero-img');
  $img = array();
  foreach ($hero_image as $value) {

    $img[] = $value;
  }
   $randNumber =  mt_rand(0,count($img)-1);
   // var_dump($randNumber);
  $alt = $nutrition_image['alt'];
  // $mymenu1 = wp_get_nav_menu_object('main');
  // $menuID = (int) $mymenu1->term_id;
  // $myPage = get_page_by_title('trips');
  // $mymenu = wp_get_nav_menu_items('main');
  // var_dump($mymenu[1]->title);

  $selectedLang = pll_current_language();

   switch ($selectedLang) {
     case 'en':
       $mostPopH1 = 'Our most popular hiking tours';
       $interestingH1 = 'Interesting activeties';
       $activetyHiking = 'hiking';
       $activetySailing = 'sailing';
       $btnShowMore = 'Show more trips';
       break;
     case 'is':
       $mostPopH1 = 'Vinsælustu ferðirnar';
       $interestingH1 = 'Áhugaverðar ferðir';
       $activetyHiking = 'ganga';
       $activetySailing = 'sigling';
       $btnShowMore = 'Sýna fleiri ferðir';

       break;

     default:
     $mostPopH1 = 'Our most popular hiking tours';
     $interestingH1 = 'Interesting activeties';
     $activetyHiking = 'hiking';
     $activetySailing = 'sailing';
     $btnShowMore = 'Show more trips';
       break;
   }


?>

<div class="hero-bannerinn" data-interchange="[<?php echo $img[$randNumber]['sizes']['fp-small'] ?>, small], [<?php echo $img[$randNumber]['sizes']['fp-medium'] ?>, medium], [<?php echo $img[$randNumber]['sizes']['fp-large'] ?>, large], [<?php echo $img[$randNumber]['sizes']['fp-large'] ?>, xlarge], [<?php echo $img[$randNumber]['sizes']['fp-retina'] ?>, xxlarge]">
<?php get_template_part('template-parts/main-filter'); ?>
</div>
<div id="page-full-width" role="main">
<?php do_action('foundationpress_before_content'); ?>
<?php
  $argsBig = array( 'post_type' => 'tour', 'posts_per_page' => -1 );
  $queryBig = new WP_Query($argsBig);
  $tripId = get_field('bokun_id');

?>
  <section class="front-bigCards-container hide-for-small-only">
    <h1><?php echo $mostPopH1; ?></h1>
      <div id="big-cards" class="big-cards navCards">
        <?php
          $postCount = 0;
          if ($queryBig->have_posts()): while ($queryBig->have_posts()) : $queryBig->the_post();


          $isPopular = get_field('is_popular');
          $bokunImg = get_field('bokun_img');
          $activeties = get_field('activety');
          $activetys = get_field('activety');
          ;
          if (gettype($activeties)=="array") {
              $activety = $activeties;
              $activety_big = $activeties;
          } elseif (gettype($activeties)=="string") {
              $activety = json_decode($activeties);
              $activety_big = json_decode($activeties);
          }

          // var_dump($activety_big);
          if ($activety_big[0]=='WALKING_TOUR' || $activety_big[0]=='HIKING') {
            switch ($selectedLang) {
              case 'en':
                $mainActivety = 'hiking';
                break;
              case 'is':
                $mainActivety = 'ganga';
                break;
              default:
                # code...
                break;
            }
            // $mainActivety = 'hiking';
            $mainActivetyIcon = 'hiking';
          } elseif ($activety_big[0]=='SAILING_OR_BOAT_TOUR' || $activety_big[0]== 'DOLPHIN_OR_WHALEWATCHING') {
            switch ($selectedLang) {
              case 'en':
                $mainActivety = 'sailing';
                break;
              case 'is':
                $mainActivety = 'sigling';
                break;
              default:
                # code...
                break;
            }
            $mainActivetyIcon = 'sailing';
          } elseif ($activety_big[0]=='SAFARI_AND_WILDLIFE' || $activety_big[0]== 'BIRD_WATCHING' || $activety_big[0]== 'WALKING_TOUR') {
            switch ($selectedLang) {
              case 'en':
                $mainActivety = 'animal life';
                break;
              case 'is':
                $mainActivety = 'dýrlíf';
                break;
              default:
                # code...
                break;
            }
            $mainActivetyIcon = 'animal-life';
          } elseif ($activety_big[0]=='BIKE_TOUR') {
            switch ($selectedLang) {
              case 'en':
                $mainActivety = 'cycling';
                break;
              case 'is':
                $mainActivety = 'hjólreiðar';
                break;
              default:
                # code...
                break;
            }
            $mainActivetyIcon = 'cycling';
          } elseif (empty($activety_big)) {
            $mainActivety = 'cycling';
            $mainActivetyIcon = $mainActivety;
          }


          // print_r($mainActivetyIcon);
          $season = get_field('season');
          // if($mainActivety == 'animal life'){
          //   $mainActivety = 'animal-life';
          // }else{
          //   $mainActivety = $mainActivety;
          // }
          $excerpt = get_the_excerpt();
          $excerpt = substr($excerpt, 0, 180);
          $cardImg = get_field('info_img');
          $img = $cardImg['sizes']['info-img-sizer'];
          if ($isPopular != null)  :
          $postCount++;
          // var_dump($postCount);
          $exclude_posts[] = $post->ID;
          if ($postCount <= 2):

        ?>
        <div class="card-large navCard" role="article" data-tripid="<?php echo $tripId ?>">
          <a href="<?php the_permalink(); ?>">
            <?php if (!$cardImg): ?>
            <div class="image" style="background-image:url('<?php echo $bokunImg; ?>');"></div>
            <?php else: ?>
            <div class="image" data-interchange="[<?php echo $cardImg['sizes']['fp-small'] ?>, small], [<?php echo $cardImg['sizes']['fp-medium'] ?>, medium], [<?php echo $cardImg['sizes']['fp-large'] ?>, large], [<?php echo $cardImg['sizes']['fp-large'] ?>, xlarge], [<?php echo $cardImg['sizes']['fp-retina'] ?>, xxlarge]""></div>
            <?php endif; ?>
            <div class="icon" style="background-image:url(<?php echo get_template_directory_uri().'/assets/images/icons/catIcons/'.$mainActivetyIcon.'.svg'; ?>);"></div>
            <p class="cat-string"> <?php echo str_replace('_', ' ', $mainActivety); ?> / <?php echo $season; ?> </p>
            <header class="card-content article-header">
              <h2 class="entry-title single-title" itemprop="headline"><?php the_title(); ?></h2>
              <p><?php echo $excerpt . ' ...'; ?></p>
            </header>
            <button type="button" class="readMoreBtn">Read more</button>
          </a>
        </div>
      <?php endif; endif; endwhile; endif; wp_reset_query();?>
    </div>
  </section>

  <section class="front-smallCards-container">
    <h1><?php echo $interestingH1; ?></h1>
    <div id="cards" class="cards owl-carousel owl-theme show-for-medium">
      <?php # echo do_shortcode('[ajax_load_more id="smallCardId" posts_per_page="4" container_type="div" post_type="tour_post_type" scroll_container="#cards" button_label="Show more trips" button_loading_label="Hang on!"]');?>
      <?php
        // var_dump(get_query_var('paged'));
        $paged = ( get_query_var('paged') ) ? get_query_var('paged') : 1;
        $customCat = get_term_by( 'slug', 'interesting', 'tours');

        $customCatId = $customCat->term_id;
        $customTermArr =  array(
              'taxonomy' => 'tours', // If you're using a custom taxonomy this needs to be changed
              'terms' => $customCatId,
              'field' => 'term_id'
            );
        // var_dump($exclude_posts);
        $args2 = array( 'post_type' => 'tour', 'posts_per_page'=> 4, 'offset'=>0, 'paged' => 1, 'tax_query' => array($customTermArr));
        $query_smallCards = new WP_Query($args2);
        $int = 0;
        if ($query_smallCards->have_posts()): while ($query_smallCards->have_posts()) : $query_smallCards->the_post();
          get_template_part( 'template-parts/smallcards', get_post_format() );
          $int++;
        endwhile; endif; /*wp_reset_query();*/ ?>

      <script>
      // {ID} is any unique name, example: b1, q9, qq, misha etc, it should be uniq
      var postsFpTrip = '<?php echo json_encode($query_smallCards->query_vars); ?>',
          current_pagetFpTrip = <?php echo $query_smallCards->query_vars['paged']; ?>,
          max_pageFpTrip = <?php echo $query_smallCards->max_num_pages; ?>;
          // console.log(current_pagetFpTrip);
      </script>
      <?php if($int > 4): ?>
      <button id="btnShowMoreFp" type="button" class="show-more" name="button"><?php echo $btnShowMore; ?></button>
    <?php endif; ?>
    </div>

    <div id="cardsMobile" class="cards owl-carousel hide-for-medium isDiv">
      <?php
      $customCatMob = get_term_by( 'slug', 'interesting', 'tours' );

      $customCatIdMob = $customCatMob->term_id;
      $customTermArrMob =  array(
            'taxonomy' => 'tours', // If you're using a custom taxonomy this needs to be changed
            'terms' => $customCatIdMob,
            'field' => 'term_id'
          );
        $argsMobile = array( 'post_type' => 'tour', 'tax_query' => array($customTermArrMob) );
        $query_smallCards = new WP_Query($argsMobile);

        if ($query_smallCards->have_posts()): while ($query_smallCards->have_posts()) : $query_smallCards->the_post();
          get_template_part( 'template-parts/smallcards', get_post_format() );

        endwhile; endif; wp_reset_query();
       ?>

    </div>
  </section>

  <!-- <section class="front-smallCards-container">
    <h1><?php echo $interestingH1; ?></h1>
    <div id="cards" class="cards owl-carousel owl-theme show-for-medium">
      <?php # echo do_shortcode('[ajax_load_more id="smallCardId" posts_per_page="4" container_type="div" post_type="tour_post_type" scroll_container="#cards" button_label="Show more trips" button_loading_label="Hang on!"]');?>
      <?php
        // var_dump(get_query_var('paged'));
        $paged = ( get_query_var('paged') ) ? get_query_var('paged') : 1;
        // var_dump($exclude_posts);
        $customCat = get_term_by( 'slug','group_friendly', 'tours' );
        // var_dump($customCat->term_id);
        $customCatId = $customCat->term_id;
        $customTermArr =  array(
        			'taxonomy' => 'tours', // If you're using a custom taxonomy this needs to be changed
        			'terms' => $customCatId,
        			'field' => 'term_id'
            );
            // var_dump($customCatId);
        $args3 = array( 'post_type' => 'tour', 'posts_per_page'=> -1, 'offset'=>0, 'paged' => 1, 'tax_query' => array($customTermArr));
        $query_smallCards = new WP_Query($args3);

        if ($query_smallCards->have_posts()): while ($query_smallCards->have_posts()) : $query_smallCards->the_post();
          get_template_part( 'template-parts/smallcards', get_post_format() );

        endwhile; endif; /*wp_reset_query();*/ ?>

      <script>
      // {ID} is any unique name, example: b1, q9, qq, misha etc, it should be uniq
      var postsFpTrip = '<?php echo json_encode($query_smallCards->query_vars); ?>',
          current_pagetFpTrip = <?php echo $query_smallCards->query_vars['paged']; ?>,
          max_pageFpTrip = <?php echo $query_smallCards->max_num_pages; ?>;
          // console.log(current_pagetFpTrip);
      </script>
      <button id="btnShowMore" type="button" class="show-more" name="button"><?php echo $btnShowMore; ?></button>
    </div>

    <div id="cardsMobile" class="cards owl-carousel hide-for-medium isDiv">
      <?php
        $argsMobile = array( 'post_type' => 'tour' );
        $query_smallCards = new WP_Query($argsMobile);

        if ($query_smallCards->have_posts()): while ($query_smallCards->have_posts()) : $query_smallCards->the_post();
          get_template_part( 'template-parts/smallcards', get_post_format() );

        endwhile; endif; wp_reset_query();
       ?>

    </div>
  </section> -->



<?php do_action('foundationpress_after_content'); ?>

</div>

 <!-- information chapters -->
<section class="fw chapter-section">
<?php
$taxonomy = 'info_category';
$terms = get_terms($taxonomy);
$categories = $terms;
$howManyCats = count($categories);
// var_dump($howManyCats);
$post_ids = get_unique_term_recent_posts( 'info_post_type', 'info_category' , $howManyCats);
// var_dump($post_ids);
if($post_ids):
$args = [
       'post__in' => $post_ids,
       'post_type' => 'info_post_type',
       'posts_per_page' => -1
   ];
// $do_not_duplicate = array();
// $taxonomy = 'info_category';
// $terms = get_terms($taxonomy);
// $categories = $terms;
//
// foreach ( $categories as $category ) {
//   $args = array(
//     'taxonomy' => $category->term_id,
//     'post_type' => 'info_post_type',
//     'posts_per_page' => '-1',
//     'post__not_in' => $do_not_duplicate
//   );
// }
// var_dump($args);
$loop = new WP_Query($args);
$count =0; $color;
while ($loop->have_posts()) : $loop->the_post(); $do_not_duplicate[] = $post->ID;
$nutrition_image = get_field('info-img');
$count++;
$excerpt = get_field('excerpt');
$postColor = get_field('background_color');
$postAlign = get_field('align_left');
$leftRight = $count % 2 == 0 ? 'left' : 'right';
// var_dump($leftRight);
if (strlen($excerpt) > 200) {
    $excerptShort = substr($excerpt, 0, 200);
} else {
    $excerptShort = $excerpt;
}

 ?>
<div class="chapter-parent <?php echo $leftRight ?>">
  <div class="row align-center small-12 medium-12 large-6 chapter-<?php echo $postColor; ?>">
    <div class="small-10 small-offset-1">
      <h2><?php the_title(); ?></h2>
      <p>
        <?php echo $excerptShort . ' ...'; ?>
      </p>
    </div>
    <a class="chapter-<?php echo $postColor; ?>-btn" href="<?php echo get_permalink(); ?>">Read More</a>
  </div>

  <div class="small-12 medium-12 large-6 chapter-<?php echo $postColor; ?>-img" data-interchange="[<?php echo $nutrition_image['sizes']['fp-small'] ?>, small], [<?php echo $nutrition_image['sizes']['fp-medium'] ?>, medium], [<?php echo $nutrition_image['sizes']['fp-large'] ?>, large], [<?php echo $nutrition_image['sizes']['fp-large'] ?>, xlarge], [<?php echo $nutrition_image['sizes']['fp-retina'] ?>, xxlarge]">

  </div>
</div>



<?php endwhile; wp_reset_query(); endif; ?>
</section>
<?php  # get_template_part('template-parts/emaillist'); ?>
<?php get_footer();
