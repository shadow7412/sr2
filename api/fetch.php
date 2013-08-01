<?php
require "../include/db.php";
$from = intVal($_GET['f']);
if($from==0) $from=99999999;

$number = isset($_GET['n'])?$_GET['n']:50;

$q = $db->query("
	SELECT * FROM `rssitems`
	WHERE `id` < $from
	ORDER BY `id`
	DESC LIMIT 0, $number
");
$feeds = array();
while($row = $q->fetch_assoc()){
	$feeds[] = $row;
}

echo json_encode($feeds, true);
?>