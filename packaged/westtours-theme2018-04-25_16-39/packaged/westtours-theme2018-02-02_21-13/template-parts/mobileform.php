<?php
$classes = get_body_class();
if (in_array('single-tour_post_type',$classes)) {
    $tourPost = 'filter-container-post';
} else {
    $tourPost = '';
}
$hasGet = false;
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
}
?>

<nav id="navActivety" class="navActivety">
  <div class="top">
    <button id="closeActivetyNav" type="button" name="button"><span></span><span></span></button>
    <img src="<?php echo get_template_directory_uri().'/assets/images/icons/logo-single.svg'?>" alt="">
    <div class="flexfix" aria-hidden> </div>
  </div>
  <form class="frmNavActivety">
    <div id="mobileActivetyDD" class="search-field__results">

    </div>
    <div id="frmAll" class="frmAll frm showFrm">

      <label class="lblMobileActivety" for="mobileActivety">
        <input id="widget_id_mobile" class="widget_id" type="hidden" name="tripId" value="<?php if(!empty($tourPost)){ echo get_field('bokun_int_id');} ?>">
        Activety
        <input id="mobileActivety" type="text" name="mobileActivety" value="<?php if(!empty($tourPost)){ the_title();} ?>" placeholder="What do you like?">

      </label>
      <label for="mobileWhen">
        When
        <input id="mobileWhen" class="btnFrm" type="text" name="date_range" value="<?php if ($sBookingdate) {
             echo $sBookingdate;
         } else {
             echo "";
         } ?>" placeholder="Pick a date" data-frm="frmCal" readonly>
      </label>
      <label for="mobileMany">
        How many
        <input id="mobileMany" class="btnFrm" type="text" name="mobileMany" value="<?php echo $sBooking; ?>" placeholder="How many?" data-frm="frmParty" readonly>
      </label>
    </div>
    <div id="frmCal" class="frmCal frm">
      <div id="mobileCal" class="mobileCal">
        <input id="hiddenCalMobile" type="hidden" name="hiddenCalMobile" value="" style="display:none">
      </div>

    </div>
    <div id="frmParty" class="frmParty frm">
      <div id="counterContainerM" class="counterContainer">
        <label for="adultM">
          <span><input id="txtAdultM" type="text" name="adult" value="<?php if ($sBookingPriceAdult) { echo $sBookingPriceAdult; } else { echo 0;} ?>" readonly>
          adult</span>
          <div>
            <button class="btnMinus" type="button" name="button"></button><button class="btnPlus" type="button" name="button"></button>
          </div>
        </label>
        <label for="children">
          <span><input id="txtChildM" type="text" name="children" value="<?php if ($sBookingPriceChild) { echo $sBookingPriceChild;} else {echo 0;} ?>" readonly>
          children <span>2 - 14</span></span>

          <div>
            <button class="btnMinus" type="button" name="button"></button><button class="btnPlus" type="button" name="button"></button>
          </div>
        </label>
        <label for="infant">
          <span><input id="txtInfantM" type="text" name="infant" value="<?php if ($sBookingPriceInfant) {
                   echo $sBookingPriceInfant;
               } else {
                   echo 0;
               } ?>" readonly>
          inftants <span>0 - 2</span></span>
          <div>
            <button class="btnMinus" type="button" name="button"></button><button class="btnPlus" type="button" name="button"></button>
          </div>
        </label>
        <button class="btnCloseCount btnFrm" type="button" data-frm="frmAll">ok</button>
      </div>
    </div>

    <button id="mobShow" type="button" name="button">Show me</button>
  </form>

</nav>
