<?php
function my_acf_google_map_api( $api ){

	$api['key'] = 'AIzaSyAn15iQCL6oH7e4gCQzmJW03WKpzpxKRuo';

	return $api;

}

add_filter('acf/fields/google_map/api', 'my_acf_google_map_api');
 ?>
