<?php
require "../include/db.php";
$unread = @$_POST['r']=="true"?0:1;
$item = intVal(@$_POST['i']);
$all = isset($_POST['all']);
if($all){
	$db->query("
	INSERT INTO `useritems`
	(`iduser`,`iditem`,`read`)
	VALUES
	('$_user',$item,$unread)
	ON DUPLICATE KEY
	UPDATE `read`=$unread
	");
	echo "P{$item}R{$unread}";
} else {
	$db->query("
		INSERT INTO useritems
		(iduser, iditem, `read`)
		SELECT $_user, id, 1
		FROM rssitems
		WHERE 1
		ON DUPLICATE KEY
		UPDATE `read`=`read`
	");
	echo "All Read ".$db->error;
}
?>