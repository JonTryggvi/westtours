<?php
$servername = "127.0.0.1:8889";
$username = "root";
$password = "root";

//Name of schema
$dbname = "slide0106";

//values to set
$department_id = $_POST['department_id-update'];
$name = $_POST['department_name-update'];
$location = $_POST['department_location-update'];
var_dump($location);
$conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
$sth = $conn->prepare("UPDATE Department SET name = :name, location = :location WHERE department_id = :department_id");
$sth->bindParam(':department_id', $department_id);
$sth->bindParam(':name', $name);
$sth->bindParam(':location', $location);

$sth->execute();
?>
