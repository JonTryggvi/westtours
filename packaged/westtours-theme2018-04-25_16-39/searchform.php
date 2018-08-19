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

do_action( 'foundationpress_before_searchform' ); ?>
<form role="search" method="get" id="searchform" action="<?php echo home_url( '/' ); ?>" class="<?php echo $white; ?>">
	<?php do_action( 'foundationpress_searchform_top' ); ?>
	<div class="input-group">
		<input type="text" class="input-group-field" value="" name="s" id="s" placeholder="<?php esc_attr_e( 'Search', 'foundationpress' ); ?>">
    <input type="hidden" name="search-type" value="normal" />
		<?php do_action( 'foundationpress_searchform_before_search_button' ); ?>
		<div class="input-group-button">
			<input type="submit" id="searchsubmit" value="<?php esc_attr_e( 'Search', 'foundationpress' ); ?>" class="button">
		</div>
	</div>
	<?php do_action( 'foundationpress_searchform_after_search_button' ); ?>
</form>
<?php do_action( 'foundationpress_after_searchform' );
