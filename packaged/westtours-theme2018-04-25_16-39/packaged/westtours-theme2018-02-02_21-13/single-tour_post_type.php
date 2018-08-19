<?php
/**
 * The template for displaying all single posts and attachments
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */
get_header(); ?>

<div id="single-post" role="main" class="row">

<?php do_action('foundationpress_before_content');
  $filter = $_GET;
  $sDate = $_GET['date'];
  $sBookingdate = date("d. F Y", (int)$sDate/1000);
  // var_dump($sBookingdate);
  $sBookingPriceAdult = (int)$_GET['adulti'];
  $sBookingPriceChild = (int)$_GET['childi'];
  $sBookingPriceInfant = (int)$_GET['infanti'];
  $sBooking = "";
  if ($sBookingPriceAdult <= 1) {
      $sBooking = $sBookingPriceAdult . " Adult";
  } elseif ($sBookingPriceAdult > 1) {
      $sBooking = $sBookingPriceAdult . " Adults";
  }

  if ($sBookingPriceChild <= 1  && $sBookingPriceChild != 0) {
      $sBooking .= ", " . $sBookingPriceChild . " Child";
  } elseif ($sBookingPriceChild > 1 && $sBookingPriceChild != 0) {
      $sBooking .= ", " . $sBookingPriceChild . " Children";
  }

  if ($sBookingPriceInfant <= 1  && $sBookingPriceInfant != 0) {
      $sBooking .= ", " . $sBookingPriceInfant . " Infant";
  } elseif ($sBookingPriceInfant > 1 && $sBookingPriceInfant != 0) {
      $sBooking .= ", " . $sBookingPriceInfant . " Infants";
  }
  $totalPassengers = $sBookingPriceAdult + $sBookingPriceChild + $sBookingPriceInfant;
 ?>

<?php while (have_posts()) : the_post();
  $tourId = get_field('bokun_int_id');
  $bokunImg = get_field('bokun_img');
  $nutrition_image = get_field('info_img');
  $img = $nutrition_image['sizes']['fp-xlarge'];
  $imgX2 = $nutrition_image['sizes']['hero-img-sizer'];
  $alt = $nutrition_image['alt'];
  $iconImg = '';
    if (get_field('activety')=='sailing') {
        $iconImg = '/assets/images/icons/catIcons/sailing.svg';
    } elseif (get_field('activety')=='food') {
        $iconImg = '/assets/images/icons/catIcons/food.svg';
    } elseif (get_field('activety')=='cycling') {
        $iconImg = '/assets/images/icons/catIcons/cycling.svg';
    } elseif (get_field('activety')=='animal life') {
        $iconImg = '/assets/images/icons/catIcons/animal-life.svg';
    } elseif (get_field('activety')=='hiking') {
        $iconImg = '/assets/images/icons/catIcons/hiking.svg';
    }elseif (get_field('activety')=='') {
        $iconImg = '/assets/images/icons/catIcons/cycling.svg';
    }
    $activetys = get_field('activety');
    // var_dump(gettype($activetys));
    if (gettype($activetys)=="array") {
        $activety = $activetys;
    } elseif (gettype($activetys)=="string") {
        $activety = json_decode($activetys);
    }
    // var_dump(get_field('activety'));
    // $activety_small = get_field('activety');
    if ($activety[0]=='WALKING_TOUR' || $activety[0]=='HIKING') {
        $mainActivety = 'hiking';
        $mainActivetyIcon = $mainActivety;
    } elseif ($activety[0]=='SAILING_OR_BOAT_TOUR' || $activety[0]== 'DOLPHIN_OR_WHALEWATCHING') {
        $mainActivety = 'sailing';
        $mainActivetyIcon = $mainActivety;
    } elseif ($activety[0]=='SAFARI_AND_WILDLIFE' || $activety[0]== 'BIRD_WATCHING') {
        $mainActivety = 'animal life';
        $mainActivetyIcon = 'animal-life';
    } elseif ($activety[0]=='BIKE_TOUR') {
        $mainActivety = 'cycling';
        $mainActivetyIcon = $mainActivety;
    } elseif (empty($activety)) {
        $mainActivety = 'cycling';
        $mainActivetyIcon = $mainActivety;
    }

    // var_dump($mainActivety);
    $season = get_field('season');

    $date_start = get_field('season-start', false, false);
    $date_start = new DateTime($date_start);
    $season_start = $date_start->format('j/m/Y');

    $date_end = get_field('season-end', false, false);
    $date_end = new DateTime($date_end);
    $season_end = $date_end->format('j/m/Y');

    $date_departure = get_field('departure', false, false);
    // $date_departure = new DateTime($date_departure);
    // $date_departure = $date_departure->format('j/m/Y');
    $location = get_field('location');
    $minAdult = get_field('adult_min_age');
    $minChild = get_field('child_min_age');
    $minInfant = get_field('infant_min_age');
    $costInfant = get_field('cost_per_infant');
    $costChild = get_field('cost_per_children');
    $number = get_field('cost_per_adult');
    $included = get_field('included');
    // var_dump($number .' vs '. $filter['adult']);
    if ($number < 9999) {
        $format_number = number_format($number, 0, ',', '.');
    } elseif ($number >= 10000) {
        $format_number = number_format($number, 0, ',', '.');
    }

    if (!empty(get_field('cost_per_children'))) {
        $number_child = get_field('cost_per_children');
        if ($number_child < 9999) {
            $format_child = number_format($number_child, 3, ',', '.');
        } elseif ($number_child >= 10000) {
            $format_childr = number_format($number_child, 0, ',', '.');
        }
    } elseif (!empty($costInfant)) {
        $number_infant = $costInfant;
        if ($number_infant < 9999) {
            $format_infant = number_format($number_infant, 3, ',', '.');
        } elseif ($number_infant >= 10000) {
            $format_infant = number_format($number_infant, 3, ',', '.');
        }
        if($costInfant == "0") {
          $format_infant = 'FREE';
        }
    }

 ?>

	<article <?php post_class('main-content'); ?> id="post-<?php the_ID(); ?>" data-tourid="<?php echo $tourId; ?>">
		<header>
			<h1 class="entry-title"><?php the_title(); ?></h1>
      <?php if ($filter): ?>
        <div class="totalPrice">
          <span><?php echo number_format((int)$number, 0, ',', '.'); ?> ISK</span>
          <p>per adult person</p>
        </div>

      <?php endif; ?>
		</header>


		<?php do_action('foundationpress_post_before_entry_content'); ?>
		<div class="entry-content <?php if(!$filter){echo 'setCalendar';} ?>">
			<section class="post-image" style="background-image: url(<?php if(!$nutrition_image){ echo $img; }else {echo $imgX2;} ?>);">


        <div class="single-booked">
          <?php get_template_part('template-parts/main-filter'); ?>
        </div>

			</section>
      <div class="activety-icon">
        <img src="<?php echo get_template_directory_uri().'/assets/images/icons/catIcons/'.$mainActivetyIcon.'.svg'; ?>" alt=""/>
        <p class='single-cat'> <?php echo $mainActivety . ' / ' . $season; ?> </p>
      </div>
      <section class="flex-section-row" >
        <div class="<?php if($filter){echo 'post-paragraph-pay';}else{echo 'post-paragraph';} ?>">
          <?php the_content(); ?>
          <div class="special-anounsment">
          <?php if(!empty(get_field('requirements'))): ?>
            <?php the_field('requirements'); ?>
            <?php endif; if(!empty(get_field('specia_anouncement'))) : ?>
              <?php the_field('specia_anouncement'); ?>

            <?php endif;?>
          </div>
          <?php if(!$filter): ?>
          <ul class="noBooking">
            <li><strong>Season:</strong> <?php echo date('F jS',$season_start).' - '. date('F jS',strtotime("-1 day",$season_end));  ?></li>
            <li><strong>Departure:</strong> <?php echo $date_departure; ?></li>
          <?php $duration = get_field('duration'); if($duration): ?>
            <li><strong>Duration:</strong> <?php echo $duration; ?> hours</li>
          <?php endif; ?>
            <li><strong>Included:</strong> <?php the_field('included'); ?></li>
            <li><strong>Minimum:</strong> <?php if(empty(get_field('min_customers'))){ echo 1;} else{ the_field('min_customers');} ?></li>
            <li><strong>Maximum:</strong> <?php the_field('max_customers'); ?></li>
            <li><strong>ADULTS <?php echo $minAdult; ?>+</strong><br>ISK <?php echo number_format($number, 0, ',', '.'); ?> (incl. 11% VAT)</li>
            <li><strong>YOUTHS <?php $youthFix = (int)$minAdult-1; echo $minChild.'-'.$youthFix; ?></strong><br>ISK <?php echo number_format($costChild, 0, ',', '.'); ?> (incl. 11% VAT)</li>
            <li><strong>CHILDREN 0-<?php $childFix = (int)$minChild - 1; echo $childFix; ?></strong><br><?php ;if($costInfant == "0" || $costInfant == NULL ): echo 'FREE'; else: echo number_format($costInfant, 0, ',', '.');?> ISK  (incl. 11% VAT) <?php endif; ?></li>

          </ul>
        <?php else:?>
          <ul class="booking">
            <li><strong>ADULTS <?php echo $minAdult; ?>+</strong><br>ISK <?php echo number_format($number, 0, ',', '.'); ?> (incl. 11% VAT)</li>
            <?php if($minChild): ?>
            <li><strong>YOUTHS <?php echo $minChild.'-'.$minAdult ?></strong><br>ISK <?php echo number_format($costChild, 0, ',', '.'); ?> (incl. 11% VAT)</li>
          <?php endif; if(!empty($minInfant) || $minInfant == "0"): ?>
            <li><strong>CHILDREN 0-<?php echo $minChild; ?></strong><br><?php ;if($costInfant == "0" || $costInfant == NULL ): echo 'FREE'; else: echo number_format($costInfant, 0, ',', '.');?> ISK  (incl. 11% VAT) <?php endif; ?></li>
          <?php endif; if($included): ?>
            <li><strong>INCLUDED</strong><br> <?php echo $included; ?></li>
          <?php endif; ?>
            <li><strong>Season:</strong><br><?php echo date('F jS',$season_start).' - '. date('F jS',strtotime("-1 day",$season_end));  ?></li>
            <li><strong>Duration:</strong><br>Approximately <?php the_field('duration'); ?> hours</li>
          <?php if(get_field('disclaimer')): ?>
            <li> <?php the_field('disclaimer'); ?> </li>
          <?php endif; ?>
          </ul>
        <?php endif; ?>
        </div>
        <?php if($filter): ?>
          <div class="booking-engine">
            <div id="availableDates" class="availableDates">
              <input id="bknEngInput" type="hidden" name="" value="" style="display:none;">
              <input id="bknCostAdult" type="hidden" name="" value="<?php echo $number; ?>" style="display:none;">
              <input id="bknCostChild" type="hidden" name="" value="<?php echo $costChild; ?>" style="display:none;">
              <input id="bknCostInfant" type="hidden" name="" value="<?php echo $costInfant; ?>" style="display:none;">
            </div>
          </div>
        <?php endif; ?>
      </section>
      <?php if($filter): ?>
        <section class="theSum">
          <form id="payTrip" class="booking-engine-sum">
            <div class="booking-engine-sum__details">
              <label for="sumActivety">Activety<br><input id="sumActivety" name="sumActivety" readonly></label>
              <label for="sumWhen">When<br><input id="sumWhen" name="sumWhen" readonly></label>
              <label for="sumParty">Participants<br><input id="sumParty" name="sumParty" readonly></label>
            </div>
            <div class="booking-engine-sum__total">
              <div class="flexFix" aria-hidden></div>
              <div class="flexFix" aria-hidden></div>
              <div class="totalPlaceholder">
                <label for="total">Total Amount<input id="total" name="total" readonly></label>
                <button id="pay" class="btn btnPay" type="button" name="pay">Payment</button>
              </div>

            </div>
          </form>
        </section>

      <?php endif; ?>
      <section class="map-container">
        <h2>Map view</h2>
      </section>
      <section id="theMap" class="acf-map">
        <div class="marker" data-lat="<?php echo $location['lat']; ?>" data-lng="<?php echo $location['lng']; ?>"></div>
      </section>

		</div>
    	<?php edit_post_link(__('Edit', 'foundationpress'), '<span class="edit-link">', '</span>'); ?>


		<footer>

		</footer>
		<?php // the_post_navigation();?>

	</article>
<?php endwhile; wp_reset_query(); ?>



<?php do_action('foundationpress_after_content'); ?>

</div>

<?php if(!$filter): $loop = new WP_Query(array( 'post_type' => 'wiki_post_type', 'posts_per_page' => 1, 'orderby' => 'rand' )); $count = mt_rand(1, 2); $color; ?>
<?php while ($loop->have_posts()) : $loop->the_post();
$nutrition_image = get_field('info-img');
$img_info = $nutrition_image['sizes']['info-img-sizer'];
$alt = $nutrition_image['alt'];
 if ($count == 1) {
     $color = 'red';
 } elseif ($count == 2) {
     $color='blue';
 }
 $excerpt = get_field('excerpt');

 if (strlen($excerpt) > 200) {
     $excerptShort = substr($excerpt, 0, 200);
 } else {
     $excerptShort = $excerpt;
 }
?>
<h2 style="text-align: center;">Did you know?</h2>
<section class="fw chapter-parent chapter-single-page">

  <div class="row align-center small-12 medium-12 large-6 chapter-<?php echo $color; ?>">
    <div class="small-10 small-offset-1">
      <h2><?php the_title(); ?></h2>
      <p>
        <?php echo $excerptShort . ' ...'; ?>
      </p>

    </div>
    <a class="chapter-<?php echo $color; ?>-btn" href="<?php echo get_permalink(); ?>">Read More</a>
  </div>

  <div class="small-12 medium-12 large-6 chapter-<?php echo $color; ?>-img" style="background-image:url(<?php echo $img_info ?>);">

  </div>

</section>
<?php endwhile; wp_reset_query(); ?>

<section class="front-smallCards-container smallCards-single">
  <h1>Interesting activeties</h1>

    <div id="cardsPost" class="cards owl-carousel test">
      <?php # echo do_shortcode('[ajax_load_more id="smallCardId" posts_per_page="4" container_type="div" post_type="tour_post_type" scroll_container="#cards" button_label="Show more trips" button_loading_label="Hang on!"]');?>
      <?php
        $args2 = array( 'post_type' => 'tour_post_type' );
        $query_smallCards = new WP_Query($args2);
        if ($query_smallCards->have_posts()): while ($query_smallCards->have_posts()) : $query_smallCards->the_post();
          get_template_part( 'template-parts/smallcards', get_post_format() );
        endwhile; endif; wp_reset_query(); endif; ?>
    </div>
    <!-- <button id="btnShowMore" type="button" class="show-more" name="button">Show more trips</button> -->
  </section>



<?php get_footer();
