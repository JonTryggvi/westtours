<?php
$selectedLang = pll_current_language();

switch ($selectedLang) {
  case 'en':
    $h2Join = 'join our Maillist';
    $messageList = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam et dui id enim consectetur pretium. Duis facilisis efficitur imperdiet. Nulla tincidunt mollis augue, vitae commodo nisi facilisis sit amet. Donec ornare vel sem quis maximus. Phasellus eget lectus nec leo.';
    break;
  case 'is':
    $h2Join = 'Skrá á póstlista';
    $messageList = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam et dui id enim consectetur pretium. Duis facilisis efficitur imperdiet. Nulla tincidunt mollis augue, vitae commodo nisi facilisis sit amet. Donec ornare vel sem quis maximus. Phasellus eget lectus nec leo.';
    break;

  default:
  $h2Join = 'join our Maillist';
  $messageList = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam et dui id enim consectetur pretium. Duis facilisis efficitur imperdiet. Nulla tincidunt mollis augue, vitae commodo nisi facilisis sit amet. Donec ornare vel sem quis maximus. Phasellus eget lectus nec leo.';
    break;
}
 ?>
<section class="e-list hide-for-small-only">
  <h2><?php echo $h2Join; ?></h2>
  <p>
    <?php echo $messageList; ?>
  </p>
  <form id="frmEmail" class="frmEmail"  >
    <label id="emailLabel" for="email-list">
      <input id="txtInput" class="e-mail" type="email" name="email-list" value="" placeholder="Your E-mail">
    </label>
    <button id="btnEmail" class="btn" type="button" name="button">Sign up</button>
  </form>

</section>
