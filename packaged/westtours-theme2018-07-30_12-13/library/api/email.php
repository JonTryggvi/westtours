<?php
    // print_r($_POST);
    $email = $_POST['email-list'];
    $ajStoredEmails = file_get_contents('emails.json');
    $aStoredEmails = json_decode($ajStoredEmails);
    $myTimestamp = strtotime('now');
    $dt = new DateTime();
    $dt->setTimezone(new DateTimeZone('UTC'));
    $dt->setTimestamp($myTimestamp);
    $dt->format('F j, Y @ G:i');

    $date = date('j M Y', $myTimestamp);
    if(empty($aStoredEmails)){
      $jObj = array();
      $jObj[] = array("email" => $email, "date" => $date, "id" => uniqid('email_'));
      $aStoredEmails->data = $jObj;
      $theEmailJSON = json_encode($aStoredEmails, JSON_UNESCAPED_SLASHES);
      // var_dump($theEmailJSON);
      file_put_contents('emails.json', $theEmailJSON);
      echo '{"success": true, "message": "E-mail added!"}';
    }else {

      for ($i=0; $i < count($aStoredEmails->emails) ; $i++) {

        if($aStoredEmails->emails[$i] == $email) {
          // var_dump($aStoredEmails->emails[$i]);
          echo '{"success": false, "message": "E-mail exists!"}';
          die;
        }
      }
      $aStoredEmails->data[] = array("email" => $email, "date" => $date, "id" => uniqid('email_'));
      $newEmails = json_encode( $aStoredEmails, JSON_UNESCAPED_SLASHES);
      file_put_contents('emails.json', $newEmails);
      echo '{"success": true, "message": "E-mail added!"}';
    }


 ?>
