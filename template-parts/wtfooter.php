<?php
$facebook = get_field('facebook', 'option');
$tripadvisor = get_field('tripadvisor', 'option');
$twitter = get_field('twitter', 'option');
$instagram = get_field('instagram', 'option');

?>

<div class="wt-footer">
  <div class="wt-footer-smedia">
    <ul class="wt-footer-smedia-list">
      <?php if ($tripadvisor): ?>
      <li class="trip"><a href="<?php echo $tripadvisor; ?>"><?php echo get_template_part('assets/images/icons/tripadvisor-logotypep'); ?></a></li>
    <?php endif;if ($facebook): ?>
      <li class="facebook"><a href="<?php echo $facebook; ?>"><?php echo get_template_part('assets/images/icons/facebookp'); ?></a></li>
    <?php endif;if ($twitter): ?>
      <li class="twitter"><a href="<?php echo $twitter; ?>"><?php echo get_template_part('assets/images/icons/twitterp'); ?></a></li>
    <?php endif;if ($instagram): ?>
      <li class="Instagram"><a href="<?php echo $instagram; ?>"><?php echo get_template_part('assets/images/icons/instagramp'); ?></a></li>
    <?php endif;?>
    </ul>
  </div>
  <div class="wt-footer-adress-secton ">
    <!-- medium-12 row align-center -->
    <ul class="wt-footer-contact  ">
      <li class="">Aðalstræti 7</li>
      <li class="">400 Ísafjörður</li>
      <li class=""><a href="tel:+3544565111">Phone: +354 456 5111</a></li>
      <li class=""><a href="mailto:westtours@westtours.is">westtours@westtours.is</a></li>
    </ul>
  </div>
</div>

