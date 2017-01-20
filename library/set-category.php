<?php
$catArr = array(
  array('catName'=>'Booking', 'slug'=>'booking', 'parentName'=>'', 'description' => 'parent for bookings' ),
    array('catName'=>'Food', 'slug'=>'food', 'parentName'=>'booking', 'description' => 'category for food' ),
    array('catName'=>'Sailing', 'slug'=>'sailing', 'parentName'=>'booking', 'description' => 'category for saling' ),
    array('catName'=>'Animal life', 'slug'=>'animal-life', 'parentName'=>'booking', 'description' => 'category for animal-life' ),
    array('catName'=>'Cycling', 'slug'=>'cycling', 'parentName'=>'booking', 'description' => 'category for cycling' ),
    array('catName'=>'Hiking', 'slug'=>'hiking', 'parentName'=>'booking', 'description' => 'category for hiking' ),


  array('catName'=>'Season','slug'=> 'season','parentName'=>'', 'description' => 'parent for seasons' ),
    array('catName'=>'Summer','slug'=> 'summer','parentName'=>'season', 'description' => '' ),
    array('catName'=>'Spring','slug'=> 'spring','parentName'=>'season', 'description' => '' ),
    array('catName'=>'Fall','slug'=> 'fall','parentName'=>'season', 'description' => '' ),
    array('catName'=>'Winter','slug'=> 'winter','parentName'=>'season', 'description' => '' ),
    array('catName'=>'All year','slug'=> 'all-year','parentName'=>'season', 'description' => '' ),

  array('catName'=>'Information','slug'=> 'information', 'parentName'=>'', 'description' => 'parent for information blog posts' ),
    array('catName'=>'Red','slug'=> 'red', 'parentName'=>'information', 'description' => 'information that apears on a red background' ),
    array('catName'=>'Blue','slug'=> 'blue', 'parentName'=>'information', 'description' => 'information that apears on a red backgrounds' )
);

function insert_category($catName, $slug, $parentInt, $description) {
  wp_insert_term(
    $catName,
    'category',
    array(
     'description' => $description,
     'parent'      => $parentInt,
     'slug'        => $slug
    )
  );
}

function start_category($arr){
  foreach ($arr as $key => $item) {
    if (empty($item['parentName'])) {
      $parentID = 0;
      insert_category($item['catName'], $item['slug'], $parentID, $item['description']);
      $term = get_term_by('slug', $item['slug'], 'category');
      $slug = $term->slug;

    } else if (isset($item['parentName'])){
      $term = get_term_by('slug', $item['parentName'], 'category');
      $slug = $term->slug;
      $parentID = $term->term_id;
      insert_category($item['catName'], $item['slug'], $parentID, $item['description']);
    }
  }
}
add_action( 'after_setup_theme', start_category($catArr));

 ?>
