<?php
/**
 * Author: Ole Fredrik Lie
 * URL: http://olefredrik.com
 *
 * FoundationPress functions and definitions
 *
 * Set up the theme and provides some helper functions, which are used in the
 * theme as custom template tags. Others are attached to action and filter
 * hooks in WordPress to change core functionality.
 *
 * @link https://codex.wordpress.org/Theme_Development
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

/** Various clean up functions */
require_once( 'library/cleanup.php' );

/** Required for Foundation to work properly */
require_once( 'library/foundation.php' );

/** Register all navigation menus */
require_once( 'library/navigation.php' );

/** Add menu walkers for top-bar and off-canvas */
require_once( 'library/menu-walkers.php' );

/** Create widget areas in sidebar and footer */
require_once( 'library/widget-areas.php' );

/** Return entry meta information for posts */
require_once( 'library/entry-meta.php' );

/** Enqueue scripts */
require_once( 'library/enqueue-scripts.php' );

/** Add theme support */
require_once( 'library/theme-support.php' );

/** Add Nav Options to Customer */
require_once( 'library/custom-nav.php' );

/** Change WP's sticky post class */
require_once( 'library/sticky-posts.php' );

/** Configure responsive image sizes */
require_once( 'library/responsive-images.php' );
/** Custom post for a clean function file */
require_once( 'library/custom-post-types/custom-info-posts.php');
require_once( 'library/custom-post-types/custom-wiki-posts.php');
require_once( 'library/custom-post-types/custom-posts.php' );
/** set startup categories */
require_once( 'library/set-category.php' );
require_once( 'library/google-maps-register.php' );
require_once( 'library/ajax-handler.php' );
require_once( 'library/acf-options.php' );
// require_once( 'library/acf.php' );
// require_once('library/bokun.php');
/** If your site requires protocol relative url's for theme assets, uncomment the line below */
// require_once( 'library/protocol-relative-theme-assets.php' );

//

// var_dump($mymenu[8]);
function get_unique_term_recent_posts( $post_type = 'post', $taxonomy = 'category', $number = 1 )
{
    // Make sure that no empty values are passed, if so, return false
    if (    !$post_type
         || !$taxonomy
         || !$number
    )
      {  return false; }

    // Validate and sanitize input values
    $post_type = filter_var( $post_type, FILTER_SANITIZE_STRING );
    $taxonomy  = filter_var( $taxonomy,  FILTER_SANITIZE_STRING );
    $number    = filter_var( $number,    FILTER_VALIDATE_INT    );

    // Make sure that our taxonomy exist to avoid WP_Error objects when querying post terms, return false
    if ( !taxonomy_exists( $taxonomy ) )
      {  return false;}

    // Save everything in a transient to avoid this being run on every page load
    if ( false === ( $unique_ids = get_transient( 'posts_list_' . md5( $taxonomy . $post_type . $number ) ) ) ) {

        // Run our query to get the posts
        $args = [
            'post_type'      => $post_type,
            'posts_per_page' => -1,
            'fields'         => 'ids' // only get post ids, all we need here
        ];
        $q = get_posts( $args );

        // Make sure we have posts before we continue, if not, return false
        if ( !$q )
            return false;

        // Lets update the object term cache
        update_object_term_cache( $q, $post_type );

        // Set up the varaible which will hold the post ID's
        $unique_ids = [];
        // Set up a variable which will hold term ID for comparion
        $term_id_array = [];
        // Set up a helper variable which will hold temp term ID's for comparion
        $term_helper_array = [];
        // Start a counter to count posts with terms from $taxonomy
        $counter = 0;

        // Loop through the posts, get the post terms, loop through them and build an array of post ID's
        foreach ( $q as $post_id ) {

            // Break the foreach loop if the amount of ids in $unique_ids == $number
            if ( count( $unique_ids ) == $number )
                break;

            $terms = get_object_term_cache( $post_id, $taxonomy );

            // If post does not have terms, skip post and continue
            if ( !$terms )
            {    continue;}

            /**
             * If $term_id_array is empty, this means that this is the first post/newest
             * post that will have a unique term, lets save the post ID
             */
            if (    !$term_id_array
                 && $counter == 0
            )
              {  $unique_ids[] = $post_id;}

            // We do have post terms, loop through them
            foreach ( $terms as $term_key=>$term ) {

                // Add all term ID's in array. Skip comparison on first post, just save the terms
                if ( $counter == 0 ) {
                    $term_id_array[] = $term->term_id;
                } else {

                    if ( in_array( $term->term_id, $term_id_array ) ) {

                        // Reset the $term_helper_array back to an empty array
                        $term_helper_array = [];

                        // Break the loop if the condition evaluate to true
                        break;
                    }
                        // Term ID not found, update the $term_helper_array with the current term ID
                        $term_helper_array[] = $term->term_id;

                } //endif $counter == 0

            } // endforeach $terms

            /**
             * If our helper array, $term_helper_array have terms, we should move them to the $term_id_array array
             * and then reset the $term_helper_array back to an empty array.
             *
             * In short, if $term_helper_array have terms, it means that the specific post has unique terms
             * compare to the previous post being save in $unique_ids
             */
            if ( $term_helper_array ) {
                // If no term ID mathes an ID in the $term_id_array, save the post ID
                $unique_ids[] = $post_id;
                /**
                 * Merge the $term_id_array and $term_helper_array. This will hold
                 * only terms of the post that are stored in the $unique_ids array
                 */
                $term_id_array = array_merge( $term_id_array, $term_helper_array );

                // Reset the $term_helper_array back to an empty array
                $term_helper_array = [];
            }

            // Update our counter
            $counter++;

        } // endforeach $q

     set_transient( 'posts_list_' . md5( $taxonomy . $post_type . $number ), $unique_ids, 30 * DAY_IN_SECONDS );
    }
    /**
     * We can now return $unique_ids which should hold at most 3 post ID's,
     * each having a unique term
     */
    return $unique_ids;
}
add_action( 'transition_post_status', function ()
{
    global $wpdb;
    $wpdb->query( "DELETE FROM $wpdb->options WHERE `option_name` LIKE ('_transient%_posts_list_%')" );
    $wpdb->query( "DELETE FROM $wpdb->options WHERE `option_name` LIKE ('_transient_timeout%_posts_list_%')" );
});
