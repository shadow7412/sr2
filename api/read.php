<?php
require "../include/db.php";
//$.post("api/read.php",{i:self.id,r:self.unread()},log);
$unread = $_POST['r']=="true"?0:1;
$item = intVal($_POST['i']);

$db->query("
INSERT INTO `useritems`
(`iduser`,`iditem`,`read`)
VALUES
('$_user',$item,$unread)
");
?>