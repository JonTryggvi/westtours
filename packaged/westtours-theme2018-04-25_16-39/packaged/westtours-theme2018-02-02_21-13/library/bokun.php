<?php
  require_once("../../../../wp-load.php");
  require_once(ABSPATH . 'wp-admin/includes/media.php');
  require_once(ABSPATH . 'wp-admin/includes/file.php');
  require_once(ABSPATH . 'wp-admin/includes/image.php');
  // variables
  $clientKey = 'xoGmSisjCTZoR';
  $clientSecret = 'PDMQ68FuYTryonXMDZIIjZgKdLRTgHaDvn9DrYyC9QXxo1yz';
  $rootUrl = get_stylesheet_directory_uri();
  // var_dump($rootUrl);
  if ($_SERVER['SERVER_PORT'] == '8888' || $_SERVER['SERVER_PORT'] == '3000') {
    $localFolder = 'westtours';
  } else {
    $localFolder = '';
  }

  $root = (!empty($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . '/'.$localFolder;
  $themeDir = get_bloginfo('template_directory');

  $localJSONTours = callToAPI($rootUrl.'/library/detailedtrips.json');
  $wpTours = callToAPI($root.'/wp-json/wp/v2/tour_post_type?per_page=100');
  // var_dump($wpTours);


// funtions
  function callToAPI($apiPath) {
    $curl = curl_init();
    curl_setopt_array($curl, array(
      CURLOPT_URL => $apiPath,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => "",
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 3000,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => "GET",
    ));
    $response = curl_exec($curl);
    $err = curl_error($curl);
    curl_close($curl);
    if ($err) {
        echo "cURL Error #:" . $err;
    } else {
      return json_decode($response);
    }
  }
  function callToOauthAPI($apiPath) {
    $curl = curl_init();
    curl_setopt_array($curl, array(
      CURLOPT_URL => $apiPath,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => "",
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 30,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => "GET",
    ));
    $response = curl_exec($curl);
    $err = curl_error($curl);
    curl_close($curl);
    if ($err) {
        echo "cURL Error #:" . $err;
    } else {
        return json_decode($response);
    }
  }
  function postToBokun($date, $apiKey, $signature, $path, $JSON) {
    $curl = curl_init();
    curl_setopt_array($curl, array(
      CURLOPT_URL => "https://api.bokun.is".$path,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => "",
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 30,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => "POST",
      CURLOPT_POSTFIELDS => $JSON,
      CURLOPT_HTTPHEADER => array(
        "X-Bokun-Date: ".$date,
        "X-Bokun-AccessKey:".$apiKey,
        "X-Bokun-Signature:" . $signature,
        "content-type: application/json",
      ),
    ));
    $response = curl_exec($curl);
    $err = curl_error($curl);
    curl_close($curl);
    if ($err) {
        echo "cURL Error #:" . $err;
    } else {
      $jResponse = json_decode($response);
      return $jResponse;
    }
  }

  function getBokunDetailedTrips($date, $apiKey, $signature, $path) {
      $curl = curl_init();
      curl_setopt_array($curl, array(
      CURLOPT_URL => "https://api.bokun.is".$path,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => "",
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 30,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => "GET",
      CURLOPT_HTTPHEADER => array(
        "X-Bokun-Date: ".$date,
        "X-Bokun-AccessKey:".$apiKey,
        "X-Bokun-Signature:" . $signature,
        "content-type: application/json",
      ),
    ));
      $response = curl_exec($curl);
      $err = curl_error($curl);
      curl_close($curl);
      if ($err) {
          return "cURL Error #:" . $err;
      } else {
          return $response;
      }
  }

  function generateSignature($postType, $APIendPoint) {
      $timeZone = date_default_timezone_set("UTC");
      $dateTime = new DateTime('now');
      $timeStamp = $dateTime->format('Y-m-d H:i:s');
      $accessKey = "702a0a41c1c041bfbdbc7be42edfe347";
      $secretKey = "1577c56a0f484ce2bcc2fce6da6ad66f";
      $httpMethod = $postType;
      $apiPath = "/activity.json/".$APIendPoint;
      $concatKey = $timeStamp.$accessKey.$httpMethod.$apiPath;
      // var_dump($concatKey);
      $rawOutput = hash_hmac;
      $hashMack = hash_hmac('SHA1', $concatKey, $secretKey, $rawOutput=true);
      // var_dump($hashMack);
      $base64 = base64_encode($hashMack);
      // var_dump($base64);

      return [$timeStamp, $accessKey, $base64, $apiPath];
  }

  if ($_GET['run']=='update') {
    $getSignObjects = generateSignature("POST", "search");
    // var_dump($getSignObjects)
    $jObj = array();
    $emptyJSON = json_encode($jObj, JSON_FORCE_OBJECT);

      $phpAPIdata = postToBokun($getSignObjects[0], $getSignObjects[1], $getSignObjects[2], $getSignObjects[3], $emptyJSON);
      $phpAPIdataItem = $phpAPIdata->items;
      $jasonAPIdata = json_encode($phpAPIdata);
      $saDetailedTours = array();

      for ($i=0; $i < count($phpAPIdataItem) ; $i++) {
          $phpAPIdataItemId = $phpAPIdataItem[$i]->id;
          // var_dump($phpAPIdataItemId);
          $getSigninObjectsdetailed = generateSignature("GET", $phpAPIdataItemId);
          $saDetailedTours[] = json_decode(getBokunDetailedTrips($getSigninObjectsdetailed[0], $getSigninObjectsdetailed[1], $getSigninObjectsdetailed[2], $getSigninObjectsdetailed[3]));
      }

      $aDetailedTours->trips = $saDetailedTours;
      //  file_put_contents('westtours.json', $jasonAPIdata);
      file_put_contents('detailedtrips.json', json_encode($aDetailedTours));
      echo 'Got it!';
  }

  function popular(){
    $getSignObjects = generateSignature("POST", "search");
    $jObjPop = array();
    $jObjPop->sortField = "BEST_SELLING_GLOBAL";
    $jObjPop->sortOrder = "asc";
    $jObjPopJSON = json_encode($jObjPop, JSON_FORCE_OBJECT);
    $phpAPIdata = postToBokun($getSignObjects[0], $getSignObjects[1], $getSignObjects[2], $getSignObjects[3], $jObjPopJSON);
    $phpAPIdataItem = $phpAPIdata->items;
    $jasonAPIdata = json_encode($phpAPIdata);
    $saDetailedTours = array();

    for ($i=0; $i < 2; $i++) {
      $saDetailedTours[]= $phpAPIdataItem[$i]->id;
    }
    return $saDetailedTours;
  }

  if($_GET['popular']=='true'){
    // print_r(popular());
    $aPopular = popular();
    foreach ($wpTours as $updatePoularkey => $wpTour)
    {
      update_field('is_popular', 0, $wpTour->id);
      foreach ($aPopular as $popkey => $pop) {
        if($wpTour->acf->bokun_int_id == $pop){
          update_field('is_popular', 1, $wpTour->id);
          var_dump($wpTour->id);
          var_dump($wpTour->title);
        }
      }
    }
  }

  if (isset($_GET['updatetours']) && $_GET['updatetours']=='update') {
    // dummy post if there is no tour post in system
    $hasposts = get_posts('post_type=tour_post_type');
    if(empty($hasposts)):
      $dummyPost = array(
        'post_title' => 'test',
        'post_content' => 'test',
        'post_status' => 'publish',
        'post_type' => 'tour_post_type'
      );
          // Insert the post into the database
      $dummypost_id = wp_insert_post($dummyPost);
      update_field('bokun_int_id', 'deleteme', $dummypost_id);

    endif;
    sleep(3);
    $aPopular = popular();
    $tours = $localJSONTours->trips;
    foreach ($wpTours as $wpKey => $wpValue) {
      $a_bokun_id[] = $wpValue->acf->bokun_int_id;
    }
    // var_dump($tours);
    foreach ($tours as $key => $value) {
      // var_dump($value->externalId);
      // var_dump($value->id);
      $tripExternalId[] = $value->id;
    }
    // var_dump(array_diff($aWp_bokun_id,$tripExternalId));

    $arrRes = array_diff($tripExternalId, $a_bokun_id);
    $arrRev = array_diff($a_bokun_id, $tripExternalId);
    // var_dump($arrRev);

    foreach ($wpTours as $key => $tourToDelde) {
      $wp_bokun_id = $tourToDelde->acf->bokun_int_id;
      update_field('is_popular', 0, $wpTour->id);
      foreach ($aPopular as $popkey => $pop) {
        if($wp_bokun_id == $pop){
          update_field('is_popular', 1, $wpTour->id);
          // var_dump($wpTour->id);
          // var_dump($wpTour->title);
        }
      }

      foreach ($arrRev as $key => $value) {
        if($wp_bokun_id == $value) {
          $wp_post_id = $tourToDelde->id;
          var_dump($wp_post_id);
          $media = get_children( array(
            'post_parent' => $wp_post_id,
            'post_type'   => 'attachment'
          ) );
          if(!empty($media)){
            foreach( $media as $file ) {
              wp_delete_attachment( $file->ID, true );
            }
          }

          wp_delete_post( $wp_post_id );
        }
      }
    }

    foreach ($tripExternalId as $key => $val) {

      foreach ($arrRes as $Reskey => $Resvalue)
      {
        if (!empty($arrRes) && $key == $Reskey  )
        {
          // var_dump($Reskey);
          $tripPostArr = array(
            'post_title' => $tours[$key]->title,
            'post_content' => $tours[$key]->description,
            'post_status' => 'publish',
            'post_type' => 'tour_post_type'
          );
          // Insert the post into the database
          $post_id = wp_insert_post($tripPostArr);
          // var_dump($tripPostArr);
          $sStartMonth = $tours[$key]->seasonalOpeningHours[0]->startMonth;
          $sStartDay = $tours[$key]->seasonalOpeningHours[0]->startDay;
          $sEndMonth = $tours[$key]->seasonalOpeningHours[0]->endMonth;
          $sEndDay = $tours[$key]->seasonalOpeningHours[0]->endDay;
          $sYear = date_create('now')->format('Y');
          $sMonth = date_create('now')->format('m');
          $sDay = date_create('now')->format('d');
          $seasonStart = strtotime($sYear.'-'.$sStartMonth.'-'.$sStartDay);
          $sSeasonStartFormated = date("Y-m-d", $seasonStart);
          // var_dump($sSeasonStartFormated);
          //
          $monthname = date('F', mktime(0, 0, 0, $sEndMonth, 10));
          // var_dump(strtotime(''.$sEndDay.' '. $monthname));
          if ($seasonStart > strtotime(''.$sEndDay.' '. $monthname)) {
            $sNextYear = strtotime(date("Y", mktime()) . " + 365 day");
            $sYearPlus = date('Y', $sNextYear);
          } else {
            $sYearPlus = $sEndMonth;
          }
          // var_dump($sYearPlus);

          $seasonEnd = strtotime($sYearPlus.'-'.$sEndMonth.'-'.$sEndDay);
          $sSeasonEndFormated = date("Y-m-d", $seasonEnd);
          $seasonLength = $seasonEnd - $seasonStart;
          // var_dump(date("Y-m-s",strtotime( $sSeasonEndFormated . " + 365 day")));
          $seasonLengthDays = $seasonLength/60/60/24;

          // if($sSeasonEndFormated =="1970-01-01"){
          //   $sSeasonEndFormated = date("Y-m-s",strtotime( $sSeasonStartFormated . " + 365 day"));
          //
          // }
          // var_dump($sSeasonStartFormated);
          if ($seasonLengthDays > 270) {
            $season = 'All year';
          } elseif ($seasonLengthDays <= 91 && $sStartMonth == 11) {
            $season = 'Winter';
          } elseif ($seasonLengthDays <= 91 && $sStartMonth == 9) {
            $season = 'Fall';
          } elseif ($seasonLengthDays <= 91 && $sStartMonth == 6) {
            $season = 'Summer';
          } elseif ($seasonLengthDays <= 91 && $sStartMonth == 3) {
            $season = 'Spring';
          } elseif ($seasonLengthDays == NULL && $sStartMonth == NULL) {
            $season = 'All year';
          }
          // var_dump($seasonLengthDays);


          $departueHoureRaw = $tours[$key]->startTimes[0]->hour;
          $departureMinuteRaw = $tours[$key]->startTimes[0]->minute;
          $sDepartureHoure = sprintf("%02d", $departueHoureRaw);
          $sDepartureMinute = sprintf("%02d", $departureMinuteRaw);
          $sDepartue = $sDepartureHoure. ':'. $sDepartureMinute;
          $duration = $tours[$key]->startTimes[0]->duration;
          $included = $tours[$key]->included;
          $TourCapasity = $tours[$key]->passCapacity;
          $tourPrice = $tours[$key]->nextDefaultPrice;
          $location = $tours[$key]->startPoints[0]->address->geoPoint;
          $address = $tours[$key]->startPoints[0]->address->city;
          $lat = $tours[$key]->startPoints[0]->address->geoPoint->latitude;
          $lng = $tours[$key]->startPoints[0]->address->geoPoint->longitude;
          $address = array("address" => $address, "lat" => $lat, "lng" => $lng, "zoom" => 14);
          $anouncement = $tours[$key]->attention;
          $requirements = $tours[$key]->requirements;
          $tripPhotos = $tours[$key]->photos;

          $attach_id_arr = get_field('field_5a4bac3744063', $post_id, false);
          if (is_array($attach_id_arr)) {
            $attach_id_arr = array();
          }

          foreach ($tripPhotos as $akey => $tripPhoto) {
            // var_dump($tripPhoto->originalUrl);
            // media_sideload_image($tripPhoto->originalUrl, $post_id, $tripPhoto->description );
            // update_field('tour_gallery', $tripPhoto->originalUrl, $post_id);
            $url = $tripPhoto->originalUrl;
            $timeout_seconds = 50;

            // Download file to temp dir
            $temp_file = download_url( $url, $timeout_seconds );

            if ( !is_wp_error( $temp_file ) ) {
              // Array based on $_FILE as seen in PHP file uploads
              $file = array(
                'name'     => basename($url), // ex: wp-header-logo.png
                'type'     => 'image/jpg',
                'tmp_name' => $temp_file,
                'error'    => 0,
                'size'     => filesize($temp_file),
              );

              $overrides = array(
                // Tells WordPress to not look for the POST form
                // fields that would normally be present as
                // we downloaded the file from a remote server, so there
                // will be no form fields
                // Default is true
                'test_form' => false,

                // Setting this to false lets WordPress allow empty files, not recommended
                // Default is true
                'test_size' => true,
              );

              // Move the temporary file into the uploads directory
              $results = wp_handle_sideload( $file, $overrides );

              if ( !empty( $results['error'] ) ) {
                // Insert any error handling here
              } else {

                $filename  = $results['file']; // Full path to the file
                $local_url = $results['url'];  // URL to the file in the uploads dir
                $type      = $results['type']; // MIME type of the file
                // media_sideload_image($local_url, $post_id);
                // Perform any actions here based in the above results
                $attachment = array(
                	'guid'           => $local_url,
                	'post_mime_type' => $type,
                	'post_title'     => preg_replace( '/\.[^.]+$/', '', basename( $filename ) ),
                	'post_content'   => '',
                	'post_status'    => 'inherit'
                );
                // Insert the attachment.

                $attach_id = wp_insert_attachment( $attachment, $filename, $post_id );
                // $attach_data = wp_generate_attachment_metadata( $attach_id, $local_url );
                // wp_update_attachment_metadata( $attach_id, $attach_data );

                // $attach_id_arr[] = array($attach_id,$attach_data);
                $attach_id_arr[] = $attach_id;
              }

            }
          }
          $mymenu = wp_get_nav_menu_object('main');
          $menuID = (int) $mymenu->term_id;
          $myPage = get_page_by_title('trips');
          $mymenu = wp_get_nav_menu_items('main');
          foreach ($mymenu as $value) {
            if($value->title == 'Trips') {
              $parentMenuItem = $value->ID;
            }
          }
          $itemData =  array(
            'menu-item-object-id' => $post_id,
            'menu-item-position'  => 1,
            'menu-item-object' => 'post',
            'menu-item-type' => 'post_type',
            'menu-item-status' => 'publish',
            'menu-item-parent-id' => $parentMenuItem,

          );
          $aTripPrices = array();

          $apiCheckAvailabilityPath = $tours[$key]->id.'/upcoming-availabilities/1?includeSoldOut=false';
          $getAvailSign = generateSignature("GET", $apiCheckAvailabilityPath);
          $availabilityDates = getBokunDetailedTrips($getAvailSign[0], $getAvailSign[1], $getAvailSign[2], $getAvailSign[3]);
          $aAvailabilityDates = json_decode( $availabilityDates);
          $tripFirstDate = $aAvailabilityDates[0]->pricesByRate[0]->pricePerCategoryUnit;
          // var_dump($aAvailabilityDates[0]->date);
          // $thisTripFirstDate = date("Y-m-d", $aAvailabilityDates[0]->date);
          // $thisTripLastDate = date("Y-m-d", $aAvailabilityDates[count($aAvailabilityDates)]->date);
          $minParticipants = $aAvailabilityDates[0]->minParticipants;
          $tourPriceIds = $tours[$key]->pricingCategories;
          // var_dump($tourPriceIds);
          foreach ($tourPriceIds as $catKey => $priceCat) {
            // var_dump($priceCat->id);
            foreach ($tripFirstDate as $checkKey => $value) {
              // var_dump($value->id);
              if($priceCat->id == $value->id){
                $aTripPrices[] = array(
                  "id" => $value->id,
                  "type" => $priceCat->ticketCategory,
                  "amount"=>$value->amount->amount,
                  "minAge" => $priceCat->minAge,
                  "maxAge" => $priceCat->maxAge
                );
              }
            }
          }

          $getTheJson = file_get_contents('detailedtrips.json');
          $decodeTheJson = json_decode($getTheJson);
          $decodeTheJson->trips[$key]->season = $season;
          $decodeTheJson->trips[$key]->prices = $aTripPrices;
          $encodeTheJson = json_encode($decodeTheJson);

          // file_put_contents('detailedtrips.json', $encodeTheJson);

          foreach ($aTripPrices as $theKey => $aTripPrice) {

            switch ($aTripPrice['type']) {
              case 'ADULT':
                $priceAdult = $aTripPrice['amount'];
                $minAgeAdult = $aTripPrice['minAge'];
                break;
              case 'CHILD':
                $priceChild = $aTripPrice['amount'];
                $minAgeChild = $aTripPrice['minAge'];
                break;
              case 'INFANT':
                $priceInfant = $aTripPrice['amount'];
                $minAgeInfant = $aTripPrice['minAge'];
                break;
              default:
              $priceAdult = 0;
              $priceChild = 0;
              $priceInfant = 0;
              $minAgeAdult = 0;
              $minAgeChild = 0;
              $minAgeInfant = 0;
                break;
            }

          }
          // var_dump($priceAdult);

          wp_update_nav_menu_item($menuID, 0, $itemData);

          update_field('requirements', $requirements, $post_id);
          update_field('specia_anouncement', $anouncement, $post_id);
          update_field('field_5a4bac3744063', $attach_id_arr, $post_id);
          update_field('bokun_int_id', $tours[$key]->id, $post_id);
          update_field('bokun_id', $tours[$key]->externalId, $post_id);
          update_field('bokun_img', $tours[$key]->keyPhoto->originalUrl, $post_id);
          update_field('field_59a5cb45ae183', $attach_id_arr[0], $post_id);
          update_field('departure', $sDepartue, $post_id);
          update_field('duration', $duration, $post_id);
          update_field('included', $included, $post_id);
          update_field('max_customers', $TourCapasity, $post_id);
          update_field('min_customers', $minParticipants, $post_id);
          update_field('season', $season, $post_id);
          update_field('seaseason-start', $sSeasonStartFormated, $post_id);
          update_field('season-end', $sSeasonEndFormated, $post_id);
          update_field('activety', $tours[$key]->activityCategories, $post_id);
          update_field('cost_per_adult', $priceAdult, $post_id);
          update_field('cost_per_children', $priceChild, $post_id);
          update_field('cost_per_infant', $priceInfant, $post_id);

          update_field('adult_min_age', $minAgeAdult, $post_id);
          update_field('child_min_age', $minAgeChild, $post_id);
          update_field('infant_min_age', $minAgeInfant, $post_id);

          update_field('location', $address, $post_id);

          foreach ($aPopular as $popkey => $pop) {
            if($tours[$key]->id == $pop){
              update_field('is_popular', 1, $wpTour->id);
              // var_dump($wpTour->id);
              // var_dump($wpTour->title);
            }
          }
        }
      }
    }
  }

  if (isset($_GET['checktrip']) && $_GET['checktrip']=='true') {
      $tripId = $_POST['tripId'];

      $date = $_POST['date_range'];
      $dateEdit = str_replace('to', '-', $date);
      $dateEdit = str_replace('.', '', $dateEdit);
      $re = '/\w+(?:[- ]\w+)*/';
      $str = $dateEdit;
      preg_match_all($re, $str, $matches);

      $startDateString = $matches[0][0];
      $endDateString = $matches[0][1];

      $mydate1 = strtotime($startDateString);
      $mydate2 = strtotime($endDateString);

      $startDatedFinal =  date('Y-m-d', $mydate1);
      // $start = Date($startDatedFinal);

      $endDatedFinal =  date('Y-m-d', $mydate2);
      // var_dump($startDatedFinal);
      // print_r($start);
      $checkTripApiPath =  $tripId . "/availabilities?start=$startDatedFinal&end=$startDatedFinal&includeSoldOut=false";
      // var_dump($checkTripApiPath);
      $getTripOnDateRange = generateSignature("GET", $checkTripApiPath);
      // var_dump($getTripOnDateRange);
      $getTheTrip = getBokunDetailedTrips($getTripOnDateRange[0], $getTripOnDateRange[1], $getTripOnDateRange[2], $getTripOnDateRange[3]);
      $sPost = json_encode($_POST);
      $apiRes = "[$getTheTrip, $sPost]";
      echo $apiRes;
      // $getTheTripToJson = json_encode($getTheTrip);
    // echo $getTheTripToJson;
  }

  if (isset($_GET['checkprice']) && $_GET['checkprice']=='true') {
      if (isset($_POST['trip']) && !empty($_POST['trip'])) {
          $priceQuery = $_POST['trip'];
          $ticket = $_POST['ticket'];
          $sTicket = json_encode($ticket);
          $sPriceQuery = json_encode($priceQuery, JSON_NUMERIC_CHECK);
          // var_dump($sPriceQuery);
          $apiCheckPricePath = 'check-prices';
          $getPriceCheckSign = generateSignature("POST", $apiCheckPricePath);
          $getPrice = postToBokun($getPriceCheckSign[0], $getPriceCheckSign[1], $getPriceCheckSign[2], $getPriceCheckSign[3], $sPriceQuery);
          $sGetPrice = json_encode($getPrice);
          $res = "[$sGetPrice, $sTicket]";
          echo $res;
      }
  }

  if (isset($_GET['checkAvailable']) && $_GET['checkAvailable']=='true') {
      if (isset($_POST['tripId']) && !empty($_POST['tripId'])) {
          $tripId = $_POST['tripId'];
          $apiCheckAvailabilityPath = $tripId.'/upcoming-availabilities/365?includeSoldOut=false';
          $getAvailSign = generateSignature("GET", $apiCheckAvailabilityPath);
          $availabilityDates = getBokunDetailedTrips($getAvailSign[0], $getAvailSign[1], $getAvailSign[2], $getAvailSign[3]);
          echo $availabilityDates;
          // echo json_encode($availabilityDates);
      }
  }
