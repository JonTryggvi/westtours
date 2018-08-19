<?php
// require_once('../bokun.php');
// if (isset($_POST['data']) && !empty($_POST['data'])){
//   $id = $_POST['data'];
//
//   $clientKey = 'xoGmSisjCTZoR';
//   $clientSecret = 'PDMQ68FuYTryonXMDZIIjZgKdLRTgHaDvn9DrYyC9QXxo1yz';
//
//   $timeZone = date_default_timezone_set("UTC");
//   $dateTime = new DateTime('now');
//   $timeStamp = $dateTime->format('Y-m-d H:i:s');
//   // var_dump($timeStamp);
//   // alt access key 702a0a41c1c041bfbdbc7be42edfe347
//   $accessKey = "702a0a41c1c041bfbdbc7be42edfe347";
//   $secretKey = "1577c56a0f484ce2bcc2fce6da6ad66f";
//   $httpMethod = "GET";
//   $apiPath = "/activity.json/" . $id;
//   $concatKey = $timeStamp.$accessKey.$httpMethod.$apiPath;
//   // echo $concatKey;
//   // var_dump($concatKey);
//   $rawOutput = hash_hmac;
//   $hashMack = hash_hmac('SHA1', $concatKey, $secretKey, $rawOutput=true);
//   // var_dump($hashMack);
//   $base64 = base64_encode($hashMack);
//   // var_dump($base64);
//   $jObj = array();
//   $emptyJSON = json_encode($jObj[]=$id, JSON_FORCE_OBJECT);
//   // $phpTestPost = getBokunTrips($timeStamp, $accessKey, $base64, $apiPath, $emptyJSON);
//   function getBokunDetailedTrips($date, $apiKey, $signature, $path){
//     $curl = curl_init();
//     curl_setopt_array($curl, array(
//       CURLOPT_URL => "https://api.bokun.is".$path,
//       CURLOPT_RETURNTRANSFER => true,
//       CURLOPT_ENCODING => "",
//       CURLOPT_MAXREDIRS => 10,
//       CURLOPT_TIMEOUT => 30,
//       CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
//       CURLOPT_CUSTOMREQUEST => "GET",
//       CURLOPT_HTTPHEADER => array(
//         "X-Bokun-Date: ".$date,
//         "X-Bokun-AccessKey:".$apiKey,
//         "X-Bokun-Signature:" . $signature,
//         "content-type: application/json",
//       ),
//     ));
//     $response = curl_exec($curl);
//     $err = curl_error($curl);
//     curl_close($curl);
//     if ($err) {
//       echo "cURL Error #:" . $err;
//     } else {
//       $jResponse = $response;
//       return $jResponse;
//
//     }
//   }
//   $tripById = getBokunDetailedTrips($timeStamp, $accessKey, $base64, $apiPath);
//   echo $tripById;
// }
//
//  ?>
