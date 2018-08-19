<?php
session_start();
/*
Template Name: korta success
*/


$sSelectedTrip = stripslashes($_COOKIE['selectedTrip']);
$jSelectedTrip = json_decode( $sSelectedTrip );
$jSelectedTrip->sessionId = session_id();
// var_dump($jSelectedTrip);

$sCustomerDetails = stripslashes($_COOKIE['customerDetails']);
$jCustomerDetials = json_decode($sCustomerDetails);
// var_dump($jCustomerDetials);

$phpPay = array(
  'activityRequest' => array(
    'startTimeId' => $jSelectedTrip->startTimeId,
    'activityId' => $jSelectedTrip->tourID,
    'rateId' => $jSelectedTrip->rateId,
    'pricingCategoryBookings' => $jSelectedTrip->pricingCategoryBookings
  ),
  'customer' => array(
    'email' =>  $jCustomerDetials->email,
    'firstName' => $jCustomerDetials->firstname,
    'lastName' => $jCustomerDetials->lastnam,
    'phoneNumber' => $jCustomerDetials->tel,
    'phoneNumberCountryCode' => $jCustomerDetials->phoneNumberCountryCode
  ),
  'paymentOption' => "FULLY_PAID"
);
$jPay = json_encode( $phpPay );
// var_dump($jPay);
$rootUrl = get_stylesheet_directory_uri();
// var_dump($rootUrl. '/library/bokun.php?pay=pay');
$curl = curl_init();
curl_setopt_array($curl, array(
  CURLOPT_URL => $rootUrl . '/library/bokun.php?pay=pay',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "POST",
  CURLOPT_POSTFIELDS => $jPay,

));
$response = curl_exec($curl);
$err = curl_error($curl);
curl_close($curl);
if ($err) {
    echo "cURL Error #:" . $err;
} else {
  $jResponse = json_decode($response);
  var_dump($response);
  // return $jResponse;
}



get_header(); ?>

<?php
// Kóði frá KORTA
$secretcode = "832qSXrKS63oUE9h2w7ZWE8on46GrqDTehpR64Hq";

// Gildi sem koma í forminu sem sent er frá Netgreiðslum KORTA

$korta_reference = $_POST['reference'];
$korta_checkvaluemd5 = $_POST['checkvaluemd5'];
$korta_downloadmd5 = $_POST['downloadmd5'];
$korta_time = $_POST['time'];
$korta_cardbrand = $_POST['cardbrand'];
$korta_card4 =  $_POST['card4'];

$my_downloadmd5 = md5(htmlentities( '2' . $korta_checkvaluemd5  . $korta_reference . $secretcode . 'TEST'));

// if success
if ($my_downloadmd5 == $korta_downloadmd5) {
  $sucessTitle = 'Success!';
  $iconImg ='/assets/images/icons/check.svg';
  $message = '';
  $message .= 'Securety signature matched.<br/>';
  $message .= '<strong>Greiðsla móttekin!</strong>' . '<br/>';
  $message .= 'Order nr        : ' . $korta_reference . '<br/>';
  $message .= 'Order payed at : ' . $korta_time . '<br/>';
  $message .=  'Card type   : ' . $korta_cardbrand . '<br/>';
  $message .=  'Last 4 in card nr : ' . $korta_card4 . '<br/>';





} else {
  $sucessTitle = 'Security signature does not match!';
  $iconImg ='/assets/images/icons/excl.svg';
  $message = 'Something went wrong';



  // echo 'Öryggisundirskrift passar ekki, svindl í gangi ? <br/>';
  // echo 'Undirskrift = [' . my_downloadmd5 . ']<br/>';
}


// else



?>

<div id="single-post" role="main" class="row">




	<article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">
		<header>
			<h1 class="entry-title"><?php echo $sucessTitle;?></h1>

		</header>


		<?php do_action( 'foundationpress_post_before_entry_content' ); ?>
		<div class="entry-content">

      <div class="activety-icon">
        <img src="<?php echo get_template_directory_uri().$iconImg; ?>" alt=""/>
        <p class='single-cat'>  </p>
      </div>
      <section class="post-paragraph">
        <?php echo $message; ?>
      </section>


		</div>
    	<?php # edit_post_link( __( 'Edit', 'foundationpress' ), '<span class="edit-link">', '</span>' ); ?>


		<footer>
			<?php # wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
			<p><?php # the_tags(); ?></p>
		</footer>
		<?php # the_post_navigation(); ?>

	</article>




</div>



<?php get_footer();
