<?php
ob_start();
error_reporting(1);
require "../include/db.php";
$from = intVal($_GET['f']);
//o=oldfirst
//h=hideread
//f=from (id)
$oldfirst = false;
$hideread = true;

if($oldfirst){
	$arrow = "<";
	$direction = "DESC";
	if($from==0) $from=999999999999;
} else {
	$arrow = ">";
	$direction = "ASC";
}

$read = $hideread?"`read`=0 OR isnull(`read`)":"1";

$number = isset($_GET['n'])?$_GET['n']:50;

$q = $db->query("
	SELECT * FROM (
		SELECT rssitems.id, feed, link, subject, date, content, title, url
		FROM rssitems
		LEFT JOIN rssfeeds ON rssfeeds.id = rssitems.feed
		WHERE rssitems.id $arrow $from 
		ORDER BY rssitems.id $direction
	) AS items
	LEFT JOIN 
	(
		SELECT *
		FROM useritems
		WHERE iduser = '$_user'
	) as user
	ON user.iditem = items.id
	WHERE $read
	LIMIT 0, $number
");
$json['errors'] = $db->error;
$json = array("feeds"=>array());
if($q) while($row = $q->fetch_assoc()){
	//$json['feeds'][] = array();
	$json['items'][] = $row;
	$json['ids'][] = $row['id'];
}
$json['errors'] .= ob_get_clean();
echo json_encode($json);
?>