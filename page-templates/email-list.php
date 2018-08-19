<?php
/*
Template Name: emails
*/
get_header(); ?>

<?php get_template_part( 'template-parts/featured-image' ); ?>

<div id="page-full-width" role="main">

<?php do_action( 'foundationpress_before_content' ); ?>

    <table id="emailDataTable" class="display" cellspacing="0" width="100%">
        <thead>
            <tr>
                <th>select</th>
                <th>email</th>
                <th>date</th>
                <th>id</th>

            </tr>
        </thead>

    </table>


<?php do_action( 'foundationpress_after_content' ); ?>

</div>

<?php get_footer();
