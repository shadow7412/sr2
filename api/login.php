<?php
require "../include/db.php";
if(isset($_POST['i'])){
	$_SESSION['user'] = $_POST['i'];
}
?>