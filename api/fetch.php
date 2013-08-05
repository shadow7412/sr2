<?php
ob_start();
error_reporting(1);
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
$json = array("feeds"=>array());
while($row = $q->fetch_assoc()){
	$json['feeds'][] = $row;
}
$json['errors'] = ob_get_clean();
echo json_encode($json);
?>