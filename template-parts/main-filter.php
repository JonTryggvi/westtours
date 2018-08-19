<?php
session_start();
// $sSession = stripslashes($_COOKIE['selectedTrip']);
// $oSession = json_decode( $sSession );
$classes = get_body_class();
if (in_array('single-tour',$classes)) {
    $tourPost = 'filter-container-post';

} else {
    $tourPost = '';

}

$hasGet = false;

// English to Icelandic
$selectedLang = pll_current_language();
switch ($selectedLang) {
case 'en':
  $isEnglish = true;
  // form labels
  $sActivety = 'Activety';
  $sWhen = 'When';
  $sParticipants = 'Participants';
  // input placeholders
  $sActivPlchldr = 'What do you like?';
  $sWhenPlchldr = 'Pick a date';
  $sPartPlchldr = 'How many';
  $btnShowMe = 'Show me';

  // participants bubble
  $sAdult = 'adult';
  $sAdults = 'adults';
  $sChild = 'child';
  $sChildren = 'children';
  $sInfant = 'infant';
  $sInfants = 'infants';
  break;
case 'is':
  $isEnglish = false;
  // form labels
  $sActivety = 'Ferðir';
  $sWhen = 'Hvenær';
  $sParticipants = 'Þátttakendur';

  // input placeholders
  $sActivPlchldr = 'Hvað má bjóða þér?';
  $sWhenPlchldr = 'Veldu dag';
  $sPartPlchldr = 'Hversu margir?';
  $btnShowMe = 'Sýndu mér!';
  $sAdult = 'fullorðin';
  $sAdults = 'fullorðnir';
  $sChild = 'barn';
  $sChildren = 'börn';
  $sInfant = 'smábarn';
  $sInfants = 'smábörn';
  break;

default:
$isEnglish = true;
// form labels
$sActivety = 'Activety';
$sWhen = 'When';
$sParticipants = 'Participants';
// input placeholders
$sActivPlchldr = 'What do you like?';
$sWhenPlchldr = 'Pick a date';
$sPartPlchldr = 'How many';
$btnShowMe = 'Show me';

// participants bubble
$sAdult = 'adult';
$sAdults = 'adults';
$sChild = 'child';
$sChildren = 'children';
$sInfant = 'infant';
$sInfants = 'infants';
  break;
}

// var_dump($isEnglish);

if(!empty($_GET)) {
  $hasGet = true;
  $filter = $_GET;
  $sDate = $_GET['date'];
  $sBookingdate = date("d. F Y", (int)$sDate/1000);
  // var_dump($sBookingdate);
  $sBookingPriceAdult = (int)$_GET['adulti'];
  $sBookingPriceChild = (int)$_GET['childi'];
  $sBookingPriceInfant = (int)$_GET['infanti'];
  $sBooking = "";
  if ($sBookingPriceAdult <= 1) {
      $sBooking = $sBookingPriceAdult . " ".$sAdult;
  } elseif ($sBookingPriceAdult > 1) {

      $sBooking = $sBookingPriceAdult ." ".$sAdults;

  }

  if ($sBookingPriceChild <= 1  && $sBookingPriceChild != 0) {
      $sBooking .= ", " . $sBookingPriceChild . " ". $sChild;
  } elseif ($sBookingPriceChild > 1 && $sBookingPriceChild != 0) {
      $sBooking .= ", " . $sBookingPriceChild . " ". $sChildren;
  }

  if ($sBookingPriceInfant <= 1  && $sBookingPriceInfant != 0) {
      $sBooking .= ", " . $sBookingPriceInfant . " ". $sInfant;
  } elseif ($sBookingPriceInfant > 1 && $sBookingPriceInfant != 0) {
      $sBooking .= ", " . $sBookingPriceInfant . " ". $sInfants;
  }
  $totalPassengers = $sBookingPriceAdult + $sBookingPriceChild + $sBookingPriceInfant;
}
?>


<div id="fpFilterResults" class="fp-filter-results">
  <div id="fpFilteredOptions" class="fp-filter-results__options">
    <div class="close">
      <span class="fa fa-times" aria-hidden="true"></span>
    </div>
    <div id="fpFilteredOptionsContainer" class="fp-filter-results__options__container"></div>
  </div>
</div>

<form id="fpFilter" class="filter-container <?php echo $tourPost; if(empty($tourPost)){ echo ' setTop';} ?> fpFilter">
  <input id="widget_id" class="widget_id" type="hidden" name="tripId" value="<?php if(!empty($tourPost)){ echo get_field('bokun_int_id');} ?>">
  <div id="activety-autocompleat" class="activities-container">
    <label for="activities-search"><?php echo $sActivety; ?></label>
    <button class="filterbutton show-for-small-only" type="button" name="button"><?php echo $sActivPlchldr; ?></button>
    <input id="activitiesSearch" class="search-field hide-for-small-only" type="text" name="tripTitle" value="<?php if(!empty($tourPost)){ the_title();} ?>" placeholder="<?php echo $sActivPlchldr; ?>">
    <div id="sResultsDropdown" class="search-field__results"></div>
  </div>
  <div class="when-container hide-for-small-only">
    <label id="whenId" for="when"><?php echo $sWhen; ?>
      <input type="text" id="from" name="date_range" class="pickTime" value="<?php if ($sBookingdate) {
           echo $sBookingdate;
       } else {
           echo "";
       } ?>" readonly placeholder="<?php echo $sWhenPlchldr; ?> ">
    </label>
  </div>
  <div class="party-container hide-for-small-only">
    <label for="counter"><?php echo $sParticipants; ?></label>
    <input id="counter" type="text" placeholder="<?php echo $sPartPlchldr; ?>" value="<?php echo $sBooking; ?>" readonly/>
    <div id="counterContainer" class="counterContainer">
      <label for="adult">
        <span><input id="txtAdult" type="text" name="adult" value="<?php if ($sBookingPriceAdult) { echo $sBookingPriceAdult; } else { echo 0; } ?>" readonly><?php echo $sAdult; ?></span>
        <div>
          <button class="btnMinus" type="button" name="button"></button><button class="btnPlus" type="button" name="button"></button>
        </div>
      </label>
      <label for="children">
        <span><input id="txtChild" type="text" name="children" value="<?php if ($sBookingPriceChild) { echo $sBookingPriceChild;} else { echo 0;} ?>" readonly><?php echo $sChildren; ?> <span>2 - 14</span></span>
        <div>
          <button class="btnMinus" type="button" name="button"></button><button class="btnPlus" type="button" name="button"></button>
        </div>
      </label>
      <label for="infant">
        <span><input id="txtInfant" type="text" name="infant" value="<?php if ($sBookingPriceInfant) { echo $sBookingPriceInfant; } else { echo 0; } ?>" readonly>
        <?php echo $sInfants; ?> <span>0 - 2</span></span>
        <div>
          <button class="btnMinus" type="button" name="button"></button><button class="btnPlus" type="button" name="button"></button>
        </div>
      </label>
      <button class="btnCloseCount" type="button">ok</button>
    </div>
  </div>
  <div class="button-container hide-for-small-only">
    <button id="showFilteredTrip" class="btn showFilteredTrip" type="button" name="button"><?php echo $btnShowMe; ?></button>
  </div>
</form>
