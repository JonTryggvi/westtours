<?php
/**
 * The template for displaying search form
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

 $classes = get_body_class();
 if (in_array('search-no-results',$classes)) {
     $white = 'white';
 } else {
     $white = '';
 }




// mobile
do_action( 'foundationpress_before_searchform' ); ?>
<form role="search" method="get" id="searchformMobile" action="<?php echo home_url( '/' ); ?>" class="<?php echo $white; ?>">
	<?php do_action( 'foundationpress_searchform_top' ); ?>
	<div class="input-group">
		<input type="text" class="input-group-field" value="" name="s" id="sM" placeholder="<?php esc_attr_e( 'Search', 'foundationpress' ); ?>">

		<?php do_action( 'foundationpress_searchform_before_search_button' ); ?>
		<div class="input-group-button">
			<input type="submit" id="searchsubmitMobile" value="" class="button btnMobileSearch">
		</div>
	</div>
	<?php do_action( 'foundationpress_searchform_after_search_button' ); ?>
</form>
<?php do_action( 'foundationpress_after_searchform' );
