<?php
/*
Template Name: korta success
*/
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

if ($my_downloadmd5 == $korta_downloadmd5)
{
  echo 'Öryggisundirskrift passar.<br/>';
  echo '<strong>Greiðsla móttekin!</strong>' . '<br/>';
  echo 'Pöntun        : ' . $korta_reference . '<br/>';
  echo 'Tími greiðslu : ' . $korta_time . '<br/>';
  echo 'Kortategund   : ' . $korta_cardbrand . '<br/>';
  echo 'Síðustu 4 í kortanúmeri : ' . $korta_card4 . '<br/>';
}
else
{
  echo 'Öryggisundirskrift passar ekki, svindl í gangi ? <br/>';
  echo 'Undirskrift = [' . my_downloadmd5 . ']<br/>';
}
?>



<?php get_footer();
