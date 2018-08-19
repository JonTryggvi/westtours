<?php
// Register Custom Post Type
function custom_tours() {

	$labels = array(
		'name'                  => _x( 'Tours', 'Post Type General Name', 'text_domain' ),
		'singular_name'         => _x( 'Tour', 'Post Type Singular Name', 'text_domain' ),
		'menu_name'             => __( 'Tours', 'text_domain' ),
		'name_admin_bar'        => __( 'Tours', 'text_domain' ),
		'archives'              => __( 'Item Archives', 'text_domain' ),
		'attributes'            => __( 'Item Attributes', 'text_domain' ),
		'parent_item_colon'     => __( 'Parent Item:', 'text_domain' ),
		'all_items'             => __( 'All Items', 'text_domain' ),
		'add_new_item'          => __( 'Add New Item', 'text_domain' ),
		'add_new'               => __( 'Add New', 'text_domain' ),
		'new_item'              => __( 'New Item', 'text_domain' ),
		'edit_item'             => __( 'Edit Item', 'text_domain' ),
		'update_item'           => __( 'Update Item', 'text_domain' ),
		'view_item'             => __( 'View Item', 'text_domain' ),
		'view_items'            => __( 'View Items', 'text_domain' ),
		'search_items'          => __( 'Search Item', 'text_domain' ),
		'not_found'             => __( 'Not found', 'text_domain' ),
		'not_found_in_trash'    => __( 'Not found in Trash', 'text_domain' ),
		'featured_image'        => __( 'Featured Image', 'text_domain' ),
		'set_featured_image'    => __( 'Set featured image', 'text_domain' ),
		'remove_featured_image' => __( 'Remove featured image', 'text_domain' ),
		'use_featured_image'    => __( 'Use as featured image', 'text_domain' ),
		'insert_into_item'      => __( 'Insert into item', 'text_domain' ),
		'uploaded_to_this_item' => __( 'Uploaded to this item', 'text_domain' ),
		'items_list'            => __( 'Items list', 'text_domain' ),
		'items_list_navigation' => __( 'Items list navigation', 'text_domain' ),
		'filter_items_list'     => __( 'Filter items list', 'text_domain' ),
	);
	$args = array(
		'label'                 => __( 'Tour', 'text_domain' ),
		'description'           => __( 'All tours', 'text_domain' ),
		'labels'                => $labels,
		'supports'              => array( 'title', 'editor', 'excerpt', 'author', 'thumbnail', 'comments', 'trackbacks', 'revisions', 'custom-fields', 'page-attributes', 'post-formats', ),
		'taxonomies'            => array( 'category', 'post_tag' ),
		'hierarchical'          => true,
		'public'                => true,
		'show_ui'               => true,
		'show_in_menu'          => true,
		'menu_position'         => 5,
		'menu_icon'             => 'dashicons-location-alt',
		'show_in_admin_bar'     => true,
		'show_in_nav_menus'     => true,
		'can_export'            => true,
		'has_archive'           => true,
		'exclude_from_search'   => false,
		'publicly_queryable'    => true,

		'capability_type'       => 'post',
		'show_in_rest'          => true,
	);
	register_post_type( 'tour_post_type', $args );

}
add_action( 'init', 'custom_tours', 0 );

function taxonomies_tours() {
    $labels = array(
        'name'              => _x( 'Tour categories', 'taxonomy general name' ),
        'singular_name'     => _x( 'Tour_categoriy', 'taxonomy singular name' ),
        'search_items'      => __( 'Query tour categories' ),
        'all_items'         => __( 'All tour categories' ),
        'parent_item'       => __( 'Parent category' ),
        'parent_item_colon' => __( 'Parent category:' ),
        'edit_item'         => __( 'Edit tour category' ),
        'update_item'       => __( 'Update tour category' ),
        'add_new_item'      => __( 'Add Edit tour category' ),
        'new_item_name'     => __( 'New tour category' ),
        'menu_name'         => __( 'tour Categories' ),
    );
    $args = array(
        'labels' => $labels,
        'hierarchical' => true,
        'rewrite' => true
    );
    register_taxonomy( 'tour_category', array('tour_post_type'), $args );
}
add_action( 'init', 'taxonomies_tours', 0 );

// Register Custom Post Type
function info_posts() {

	$labels = array(
		'name'                  => _x( 'info', 'Post Type General Name', 'text_domain' ),
		'singular_name'         => _x( 'info', 'Post Type Singular Name', 'text_domain' ),
		'menu_name'             => __( 'info', 'text_domain' ),
		'name_admin_bar'        => __( 'info posts', 'text_domain' ),
		'archives'              => __( 'Item Archives', 'text_domain' ),
		'attributes'            => __( 'Item Attributes', 'text_domain' ),
		'parent_item_colon'     => __( 'Parent Item:', 'text_domain' ),
		'all_items'             => __( 'All Items', 'text_domain' ),
		'add_new_item'          => __( 'Add New Item', 'text_domain' ),
		'add_new'               => __( 'Add New', 'text_domain' ),
		'new_item'              => __( 'New Item', 'text_domain' ),
		'edit_item'             => __( 'Edit Item', 'text_domain' ),
		'update_item'           => __( 'Update Item', 'text_domain' ),
		'view_item'             => __( 'View Item', 'text_domain' ),
		'view_items'            => __( 'View Items', 'text_domain' ),
		'search_items'          => __( 'Search Item', 'text_domain' ),
		'not_found'             => __( 'Not found', 'text_domain' ),
		'not_found_in_trash'    => __( 'Not found in Trash', 'text_domain' ),
		'featured_image'        => __( 'Featured Image', 'text_domain' ),
		'set_featured_image'    => __( 'Set featured image', 'text_domain' ),
		'remove_featured_image' => __( 'Remove featured image', 'text_domain' ),
		'use_featured_image'    => __( 'Use as featured image', 'text_domain' ),
		'insert_into_item'      => __( 'Insert into item', 'text_domain' ),
		'uploaded_to_this_item' => __( 'Uploaded to this item', 'text_domain' ),
		'items_list'            => __( 'Items list', 'text_domain' ),
		'items_list_navigation' => __( 'Items list navigation', 'text_domain' ),
		'filter_items_list'     => __( 'Filter items list', 'text_domain' ),
	);
	$args = array(
		'label'                 => __( 'info', 'text_domain' ),
		'description'           => __( 'post for info sections', 'text_domain' ),
		'labels'                => $labels,
		'supports'              => array( 'title', 'editor', 'excerpt', 'author', 'thumbnail', 'comments', 'trackbacks', 'revisions', 'custom-fields', 'page-attributes', 'post-formats', ),
		'taxonomies'            => array( 'category', 'post_tag' ),
		'hierarchical'          => false,
		'public'                => true,
		'show_ui'               => true,
		'show_in_menu'          => true,
		'menu_position'         => 5,
		'menu_icon'             => 'dashicons-location-alt',
		'show_in_admin_bar'     => true,
		'show_in_nav_menus'     => true,
		'can_export'            => true,
		'has_archive'           => true,
		'exclude_from_search'   => false,
		'publicly_queryable'    => true,
		'capability_type'       => 'post',
		'show_in_rest'          => true,
	);
	register_post_type( 'info_post_type', $args );

}
add_action( 'init', 'info_posts', 0 );

// function taxonomies_info() {
//     $labels = array(
//         'name'              => _x( 'Info categories', 'taxonomy general name' ),
//         'singular_name'     => _x( 'info_categories', 'taxonomy singular name' ),
//         'search_items'      => __( 'Query Info categories' ),
//         'all_items'         => __( 'All Info categories' ),
//         'parent_item'       => __( 'Parent category' ),
//         'parent_item_colon' => __( 'Parent category:' ),
//         'edit_item'         => __( 'Edit Info category' ),
//         'update_item'       => __( 'Update Info category' ),
//         'add_new_item'      => __( 'Add Edit Info category' ),
//         'new_item_name'     => __( 'New Info category' ),
//         'menu_name'         => __( 'Info Categories' ),
//     );
//     $args = array(
//         'labels' => $labels,
//         'hierarchical' => true,
//         'rewrite' => true
//     );
//     register_taxonomy( 'info_category', array('info_post_type'), $args );
// }
// add_action( 'init', 'taxonomies_info', 0 );

// Register Custom Post Type
function wiki_posts() {

	$labels = array(
		'name'                  => _x( 'did you know', 'Post Type General Name', 'text_domain' ),
		'singular_name'         => _x( 'did you know', 'Post Type Singular Name', 'text_domain' ),
		'menu_name'             => __( 'did you know', 'text_domain' ),
		'name_admin_bar'        => __( 'did you know posts', 'text_domain' ),
		'archives'              => __( 'Item Archives', 'text_domain' ),
		'attributes'            => __( 'Item Attributes', 'text_domain' ),
		'parent_item_colon'     => __( 'Parent Item:', 'text_domain' ),
		'all_items'             => __( 'All Items', 'text_domain' ),
		'add_new_item'          => __( 'Add New Item', 'text_domain' ),
		'add_new'               => __( 'Add New', 'text_domain' ),
		'new_item'              => __( 'New Item', 'text_domain' ),
		'edit_item'             => __( 'Edit Item', 'text_domain' ),
		'update_item'           => __( 'Update Item', 'text_domain' ),
		'view_item'             => __( 'View Item', 'text_domain' ),
		'view_items'            => __( 'View Items', 'text_domain' ),
		'search_items'          => __( 'Search Item', 'text_domain' ),
		'not_found'             => __( 'Not found', 'text_domain' ),
		'not_found_in_trash'    => __( 'Not found in Trash', 'text_domain' ),
		'featured_image'        => __( 'Featured Image', 'text_domain' ),
		'set_featured_image'    => __( 'Set featured image', 'text_domain' ),
		'remove_featured_image' => __( 'Remove featured image', 'text_domain' ),
		'use_featured_image'    => __( 'Use as featured image', 'text_domain' ),
		'insert_into_item'      => __( 'Insert into item', 'text_domain' ),
		'uploaded_to_this_item' => __( 'Uploaded to this item', 'text_domain' ),
		'items_list'            => __( 'Items list', 'text_domain' ),
		'items_list_navigation' => __( 'Items list navigation', 'text_domain' ),
		'filter_items_list'     => __( 'Filter items list', 'text_domain' ),
	);
	$args = array(
		'label'                 => __( 'Did you know', 'text_domain' ),
		'description'           => __( 'post for wiki sections', 'text_domain' ),
		'labels'                => $labels,
		'supports'              => array( 'title', 'editor', 'excerpt', 'author', 'thumbnail', 'comments', 'trackbacks', 'revisions', 'custom-fields', 'page-attributes', 'post-formats', ),
		'taxonomies'            => array( 'category', 'post_tag' ),
		'hierarchical'          => false,
		'public'                => true,
		'show_ui'               => true,
		'show_in_menu'          => true,
		'menu_position'         => 5,
		'menu_icon'             => 'dashicons-smiley',
		'show_in_admin_bar'     => true,
		'show_in_nav_menus'     => true,
		'can_export'            => true,
		'has_archive'           => true,
		'exclude_from_search'   => false,
		'publicly_queryable'    => true,
		'capability_type'       => 'post',
		'show_in_rest'          => true,
	);
	register_post_type( 'wiki_post_type', $args );

}
add_action( 'init', 'wiki_posts', 0 );

 ?>
