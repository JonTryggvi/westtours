<?php
$tripId = get_field('bokun_id');
$isPopular = get_field('is_popular');
$bokunImg = get_field('bokun_img');
$nutrition_image = get_field('info_img');
$img = $nutrition_image['sizes']['info-img-sizer'];
$alt = $nutrition_image['alt'];

$activeties = get_field('activety');
if (gettype($activeties)=="array") {
    $activety_small = $activeties;
} elseif (gettype($activeties)=="string") {
    $activety_small = json_decode($activeties);
}
// var_dump($activety_small);

if ($activety_small[0]=='WALKING_TOUR' || $activety_small[0]=='HIKING') {
  $mainActivety = 'hiking';
  $mainActivetyIcon = $mainActivety;
} elseif ($activety_small[0]=='SAILING_OR_BOAT_TOUR' || $activety_small[0]== 'DOLPHIN_OR_WHALEWATCHING') {
  $mainActivety = 'sailing';
  $mainActivetyIcon = $mainActivety;
} elseif ($activety_small[0]=='SAFARI_AND_WILDLIFE' || $activety_small[0]== 'BIRD_WATCHING' || $activety_small[0]== 'WALKING_TOUR') {
  $mainActivety = 'animal life';
  $mainActivetyIcon = 'animal-life';
} elseif ($activety_small[0]=='BIKE_TOUR') {
  $mainActivety = 'cycling';
  $mainActivetyIcon = $mainActivety;
} elseif (empty($activety_small)) {
  $mainActivety = 'cycling';
  $mainActivetyIcon = $mainActivety;
}

$season = get_field('season');
// if($mainActivety == 'animal life'){
//   $mainActivety = 'animal-life';
// }else{
//   $mainActivety = $mainActivety;
// }
 // if ($isPopular == null) :
  // var_dump($activety_small);

  $title = get_the_title();
  // var_dump(strlen($title));
  if (strlen($title) > 19) {
    $smallerH2 = 'smallerH2';
  } else {
    $smallerH2 = '';
  }
  $excerpt_small = get_the_excerpt();
  $excerpt_small = substr($excerpt_small, 0, 50);
  $cardImg = get_field('info_img');

?>
<div class="small-12 medium-6 large-4 xlarge-3 card-container">
  <div class="card" role="article" >
    <a href="<?php the_permalink(); ?>">
      <?php if (!$cardImg): ?>
      <div class="image" style="background-image:url('<?php echo $bokunImg; ?>');"></div>
      <?php else: ?>
      <div class="image" style="background-image:url('<?php echo $img; ?>');"></div>
      <?php endif; ?>
      <div class="icon icon-<?php echo $mainActivety; ?>" style="background-image:url(<?php echo get_template_directory_uri().'/assets/images/icons/catIcons/'.$mainActivetyIcon.'.svg'; ?>);" ></div>
      <p class="cat-string"> <?php echo str_replace('_', ' ', $mainActivety); ?> / <?php echo $season; ?> </p>
      <header class="card-content article-header">
        <h2 class="entry-title single-title <?php echo $smallerH2; ?>" itemprop="headline"><?php echo $title; ?></h2>
        <p><?php echo $excerpt_small.' ...'; ?></p>
      </header>
      <button href="<?php the_permalink(); ?>" type="button" class="bookBtn btnCard" data-tripid="<?php echo $tripId ?>">Book</button>
    </a>
  </div>
</div>
<?php /* endif; */ ?>
