<?php
require "../include/db.php";
$unread = $_POST['r']=="true"?0:1;
$item = intVal($_POST['i']);

$db->query("
INSERT INTO `useritems`
(`iduser`,`iditem`,`read`)
VALUES
('$_user',$item,$unread)
ON DUPLICATE KEY
UPDATE `read`=$unread
");
echo "P{$item}R{$unread}";
?>