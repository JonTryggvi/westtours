<?php
  session_start();
  $sSession = stripslashes($_COOKIE['selectedTrip']);
  $oSession = json_decode( $sSession );
/**
 * The template for displaying all single posts and attachments
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */
get_header(); ?>

<div id="single-post" role="main" class="row">

<?php do_action('foundationpress_before_content');
  $selectedLang = pll_current_language();

  // var_dump($oSession->infantCount);

  $filter = $_GET;
  $sDate = $_GET['date'];
  $sBookingdate = date("d. F Y", $oSession->tripDate/1000);
  // var_dump($sBookingdate);
  $sBookingPriceAdult = $oSession->adultCount;
  $sBookingPriceChild = $oSession->childCount;
  $sBookingPriceInfant = $oSession->infantCount;

  $totalPassengers = $sBookingPriceAdult + $sBookingPriceChild + $sBookingPriceInfant;

  switch ($selectedLang) {
    case 'en':
      $transSeason = 'Season';
      $transDeparture = 'Departue';
      $transDuration = 'Duration';
      $transHours = 'Hours';
      $transIncluded = 'Included';
      $transMinimun = 'Minimum';
      $transMaximun = 'Maximum';
      $transAdults = 'Adults';
      $transYouths = 'Youths';
      $transChildren = 'Children';
      $transVat = '(incl. 11% VAT)';
      $transAprox = 'Approximately';
      $transFree = 'FREE';
      $transActivety = 'Activety';
      $transWhen = 'When';
      $transParticipants = 'Participants';
      $transTotalAmount = 'Total Amount';
      $transBtnPayment = 'Payment';
      $transPerAdult = 'per adult person';
      $transMapView = 'Map View';
      break;
    case 'is':
      $transSeason = 'Árstíð';
      $transDeparture = 'Brottför';
      $transDuration = 'Tími';
      $transHours = 'Klst';
      $transIncluded = 'Innifalið';
      $transMinimun = 'Lágmark';
      $transMaximun = 'Hámark';
      $transAdults = 'Fullorðnir';
      $transYouths = 'Börn';
      $transChildren = 'Smábörn';
      $transVat = '(innif. 11% VSK)';
      $transAprox = 'U.þ.b.';
      $transFree = 'Ókeypis';
      $transActivety = 'Ferðir';
      $transWhen = 'Hvenær';
      $transParticipants = 'Þátttakendur';
      $transTotalAmount = 'Samtals';
      $transBtnPayment = 'Greiða';
      $transPerAdult = 'fyrir fullorðin';
      $transMapView = 'Yfirlits kort';

      break;
    default:
      # code...
      break;
  }
 ?>

<?php while (have_posts()) : the_post();
  $tourId = get_field('bokun_int_id');
  $externalId = get_field('bokun_id');
  $bokunImg = get_field('bokun_img');
  $nutrition_image = get_field('info_img');
  $img = $nutrition_image['sizes']['fp-xlarge'];
  $imgX2 = $nutrition_image['sizes']['hero-img-sizer'];
  $alt = $nutrition_image['alt'];
  $translation_array = array(
    'tourExtId' => $externalId,
    'tourTitle' => get_the_title
	 );
  wp_localize_script( 'foundation', 'tripPostData', $translation_array );
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
    if (in_array('WALKING_TOUR', $activety) || in_array('HIKING', $activety) || in_array('SIGHTSEEING', $activety)) {
      switch ($selectedLang) {
        case 'en':
          $mainActivety = 'hiking';
          break;
        case 'is':
          $mainActivety = 'ganga';
          break;
        default:
          $mainActivety = 'hiking';
          break;
      }
      // $mainActivety = 'hiking';
      $mainActivetyIcon = 'hiking';
    } elseif (in_array('WATER', $activety) || in_array('SAILING_OR_BOAT_TOUR', $activety) || in_array('DOLPHIN_OR_WHALEWATCHING', $activety)) {
      switch ($selectedLang) {
        case 'en':
          $mainActivety = 'sailing';
          break;
        case 'is':
          $mainActivety = 'sigling';
          break;
        default:
            $mainActivety = 'sailing';
          break;
      }
      $mainActivetyIcon = 'sailing';
    } elseif (in_array('SAFARI_AND_WILDLIFE', $activety) || in_array('BIRD_WATCHING', $activety) || in_array('WALKING_TOUR', $activety) ) {
      switch ($selectedLang) {
        case 'en':
          $mainActivety = 'animal life';
          break;
        case 'is':
          $mainActivety = 'dýrlíf';
          break;
        default:
          $mainActivety = 'animal life';
          break;
      }
      $mainActivetyIcon = 'animal-life';
    } elseif (in_array('BIKE_TOUR', $activety)) {
      switch ($selectedLang) {
        case 'en':
          $mainActivety = 'cycling';
          break;
        case 'is':
          $mainActivety = 'hjólreiðar';
          break;
        default:
          $mainActivety = 'cycling';
          break;
      }
      $mainActivetyIcon = 'cycling';
    } elseif (empty($activety)) {
      $mainActivety = 'hiking';
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
    $tourGallery = get_field('tour_gallery');
    $tourGallerySize = 'large';
 ?>
  <div class="tourModal">
    <div id="closeModal" class="tourModal__btnClose">
      <span></span>
      <span></span>
    </div>
    <div id="modalSlides" class="owl-carousel tourModal__slides">
      <?php foreach( $tourGallery as $image ): ?>
           <div class="tourModal__slides__slide" style="background-image:url(<?php echo $image['sizes']['large'] ?>)">

           </div>
       <?php endforeach; ?>
    </div>
    <div class="nextSlide">

    </div>
    <div class="prevSlide">

    </div>

  </div>
	<article <?php post_class('main-content'); ?> id="post-<?php the_ID(); ?>" data-tourid="<?php echo $tourId; ?>">
		<header>
			<h1 class="entry-title"><?php the_title(); ?></h1>
      <?php if ($filter): ?>
        <div class="totalPrice">
          <span><?php echo number_format((int)$number, 0, ',', '.'); ?> ISK</span>
          <p><?php echo $transPerAdult; ?></p>
        </div>

      <?php endif; ?>
		</header>


		<?php do_action('foundationpress_post_before_entry_content'); ?>
		<div class="entry-content <?php if(!$filter){echo 'setCalendar';} ?>">
			<section id="postImage" class="post-image" style="background-image: url(<?php if(!$nutrition_image){ echo $img; }else {echo $imgX2;} ?>);">
        <span class="tooltiper has-tip top right" data-tooltip aria-haspopup="true" data-click-open="false" data-disable-hover="false" tabindex="1" title="Click for slideshow."></span>

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

          <?php if(!empty(get_field('requirements'))): ?>
            <?php the_field('requirements'); ?>
            <?php endif; if(!empty(get_field('specia_anouncement'))) : ?>
              <div class="special-anounsment">
                <?php the_field('specia_anouncement'); ?>
              </div>
            <?php endif;?>

          <?php
           if(!$filter): ?>
          <ul class="noBooking">
            <li><strong><?php echo $transSeason; ?>:</strong> <?php echo date('F jS',$season_start).' - '. date('F jS',strtotime("-1 day",$season_end));  ?></li>
            <li><strong><?php echo $transDeparture; ?>:</strong> <?php echo $date_departure; ?></li>
          <?php $duration = get_field('duration'); if($duration): ?>
            <li><strong><?php echo $transDuration; ?>:</strong> <?php echo $duration; ?> <?php echo $transHours; ?></li>
          <?php endif; ?>
            <li><strong><?php echo $transIncluded; ?>:</strong> <?php the_field('included'); ?></li>
            <li><strong><?php echo $transMinimun; ?>:</strong> <?php if(empty(get_field('min_customers'))){ echo 1;} else{ the_field('min_customers');} ?></li>
            <li><strong><?php echo $transMaximun; ?>:</strong> <?php the_field('max_customers'); ?></li>
            <li><strong><?php echo $transAdults. ' '. $minAdult; ?>+</strong><br>ISK <?php echo number_format($number, 0, ',', '.') .' '. $transVat; ?> </li>
            <li><strong><?php echo $transYouths; ?> <?php $youthFix = (int)$minAdult-1; echo $minChild.'-'.$youthFix; ?></strong><br>ISK <?php echo number_format($costChild, 0, ',', '.').' '. $transVat; ?></li>
            <li><strong><?php echo $transChildren; ?> 0-<?php $childFix = (int)$minChild - 1; echo $childFix; ?></strong><br><?php ;if($costInfant == "0" || $costInfant == NULL ): echo $transFree; else: echo 'ISK '. number_format($costInfant, 0, ',', '.') .' '. $transVat; endif; ?></li>

          </ul>
        <?php else:?>
          <ul class="booking">
            <li><strong><?php echo $transAdults.' '. $minAdult; ?>+</strong><br>ISK <?php echo number_format($number, 0, ',', '.') . ' ' . $transVat; ?></li>
            <?php if($minChild): ?>
            <li><strong><?php echo $transYouths; ?> <?php echo $minChild.'-'.$minAdult ?></strong><br>ISK <?php echo number_format($costChild, 0, ',', '.') . ' ' . $transVat; ?></li>
          <?php endif; if(!empty($minInfant) || $minInfant == "0"): ?>
            <li><strong><?php echo $transChildren; ?> 0-<?php echo $minChild; ?></strong><br><?php ;if($costInfant == "0" || $costInfant == NULL ): echo $transFree; else: echo number_format($costInfant, 0, ',', '.');?> ISK   <?php echo $transVat; endif; ?></li>
          <?php endif; if($included): ?>
            <li><strong><?php echo $transIncluded; ?></strong><br> <?php echo $included; ?></li>
          <?php endif; ?>
            <li><strong><?php echo $transSeason; ?>:</strong><br><?php echo date('F jS',$season_start).' - '. date('F jS',strtotime("-1 day",$season_end));  ?></li>
            <li><strong><?php echo $transDuration; ?>:</strong><br><?php echo $transAprox; ?> <?php the_field('duration'); ?> <?php echo $transHours; ?></li>
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

          <div id="payTrip" class="booking-engine-sum">
            <div class="booking-engine-sum__details">
              <label for="sumActivety"><?php echo $transActivety; ?><br><input id="sumActivety" name="sumActivety" readonly></label>
              <label for="sumWhen"><?php echo $transWhen; ?><br><input id="sumWhen" name="sumWhen" readonly></label>
              <label for="sumParty"><?php echo $transParticipants; ?><br><input id="sumParty" name="sumParty" readonly></label>
            </div>
            <div id="customerDetails" class="booking-engine-sum__customer heightnull">
              <label for="firstname">
                First name
                <input type="text" id="firstname" name="firstname" value="Jón" placeholder="First Name">
              </label>
              <label for="lastname">
                Last name
                <input type="text" id="lastname" name="lastname" value="Unnarsson" placeholder="Last Name">
              </label>
              <label for="email">
                Email
                <input id="email" type="email" name="email" value="jontryggvi@jontryggvi.is" placeholder="Email">
              </label>
              <label for="phone">
                Phone number
                <input id="custTel" type="tel" name="phone" value="+354887766" placeholder="Phone number">
              </label>
              <label for="nationality">
                Nationality
                <input id="searchNations" type="text" name="nationality" value="" placeholder="Nationality">
                <!-- <datalist id="countries">

                </datalist> -->
                <div id="countriesList" class="countries-list">

                </div>
              </label>
            </div>
            <div class="booking-engine-sum__total">
              <div class="flexFix" aria-hidden></div>
              <div class="flexFix" aria-hidden></div>
              <div class="totalPlaceholder">
                <label for="total"><?php echo $transTotalAmount; ?><input id="total" name="total" readonly></label>
                <button id="pay" class="btn btnPay" type="button" name="pay"><?php echo $transBtnPayment; ?></button>
              </div>
            </div>
            <input id="tripTitle" type="hidden" name="tripTitle" value="<?php echo get_the_title(); ?>">
          </form>
        </section>
        <?php
            $root = (!empty($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . '/';

            if( $_SERVER['SERVER_NAME'] == 'localhost' ) {
              $address ='westtours';
            }else {
              $address = '';
            }
            $backoutUrl = $root. $address. $_SERVER['REQUEST_URI'] . '&success=failed';
            $your_downloadurl = $root . $address . '/success/';
            $callbackUrl = $root . $address . '/korta-callback/'


        ?>




        <div id="webpayment" style="display:none">
          <form id="frmTestKorta" action="https://netgreidslur.korta.is/testing/" method="POST" >
            <!-- <input type="hidden" name="look" value="SIMPLE"> -->
            <input id="inpKortaAmount" name="amount" type="hidden" value="">
            <input name="currency" type="hidden" value="ISK">
            <input name="merchant" type="hidden" value="8181233">
            <input name="terminal" type="hidden" value="4452">
            <input id="checkvaluemd5" name="checkvaluemd5" type="hidden" value="">
            <input id="inpKortaDescription" name="description" type="hidden" value="<?php echo get_the_title(); ?>">

            <input name="lang" type="hidden" value='<?php echo $selectedLang ?>' >



            <!-- <input type="hidden" name="continueurl" value="<?php echo $backoutUrl; ?>"> -->
            <input type="hidden" id="kortaInpName" name="name" value="">
            <input type="hidden" id="kortaEmail" name="email" value="">
            <input type="hidden" id="kortaEmail2" name="email2" value="">
            <input type="hidden" id="kortaCountry" name="country" value="">
            <input type="hidden" id="KortaPhone" name="phone" value="">
            <input type='hidden' name='refermethod' value='POST' >
            <input type='hidden' name='refertarget' value='_top' >
            <input type='hidden' name='downloadurl' value='<?php echo $your_downloadurl; ?>' >
            <input type="hidden" name="callbackurl" value="<?php echo $callbackUrl; ?>">
            <input type="hidden" name="refermethod" value="POST">
            <input type="hidden" name="refertarget" value="_top">
          </form>

        </div>


      <?php endif; ?>
      <section class="map-container">
        <h2><?php echo $transMapView; ?></h2>
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
     $color = 'blue';
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
  <?php var_dump($_GET); if($_GET['success'] == 'false'): ?>
  <div class="failedTranAction scaleupModal">
    <div class="close_scaleup closeFunction">
      <span></span>
      <span></span>
    </div>
    <div class="trans-fail-msg-container">
      <h3>Something went wrong with the transaction!</h3>
      <button class="btn closeFunction" type="button" name="button">back</button>
    </div>

  </div>
<?php endif; ?>

<?php get_footer();
