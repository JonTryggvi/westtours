<?php
  require_once('../../../../../wp-load.php');
  if($_POST && !empty($_POST['rawAmount'])) {
   
    $merchant = '8181233';
    $terminal= '4452';
    $secretcode = '832qSXrKS63oUE9h2w7ZWE8on46GrqDTehpR64Hq';

    // Upplýsingar úr kerfinu þínu ! Línur í vörulýsingu (description) aðgreindar með <br>
    $amount = $_POST['rawAmount'];
    $cur = 'ISK';
    $description = $_POST['postTitle'];
    $customer = array(
      'firstname'=> $_POST['firstname'], 
      'lastname' => $_POST['lastname'],
      'email' => $_POST['email'],
      'tel' => $_POST['tel'],
      'nation' => $_POST['nation']
      );
    // Rafræn undirskrift til að KORTA geti staðfest að greiðslan kemur frá þér !
    $checkvaluemd5 = "ASP" . md5(htmlentities($amount . $cur . $merchant . $terminal . $description . $secretcode . 'TEST'));

      // $strEncodedText = htmlentities(“100.00ISK818000160000001Lína 1<br>Númer 2MySecretCode”);
      // // Útkoman : “100.00ISK818000160000001L&iacute;na 1&lt;br&gt;N&uacute;mer 2MySecretCode”
      // $checkvaluemd5 = “ASP” . md5($strEncodedText);
      // Útkoman : “46b5f42d71da7b2ff2141ecf205358a8” Ath. án forskeytis fyrir framan md5 gildi



    $aCallBack = array('key'=>$checkvaluemd5, 'amount' => $amount,'customer' => $customer);
    $jCallBack = json_encode($aCallBack);
    echo $jCallBack;
    // $your_downloadurl = 'http://localhost/sample_korta_success.php';


  }



?>
