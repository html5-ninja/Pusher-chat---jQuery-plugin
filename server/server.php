<?php
/* ------------ server.php send event to pusher server ---------------
 * Pusher chat
 * facebook like chat jQuery plugin using Pusher API 
 * version: 1.0   
 * Author & support : zied.hosni.mail@gmail.com 
 * © 2012 html5-ninja.com
 * for more info please visit http://html5-ninja.com
 * 
 */ 

require_once('config.php');

// https://github.com/squeeks/Pusher-PHP
require('../lib/Pusher.php');


$pusher = new Pusher($key, $secret, $app_id);
if ($_POST['typing'] == "false"){
    $pusher->trigger('presence-mychanel', 'send-event', array('message' => htmlspecialchars ( $_POST['msg']), 'from' => $_POST['from'], 'to' => str_replace('#', '', $_POST['to'])));
}
else if ($_POST['typing'] == "true")
    $pusher->trigger('presence-mychanel', 'typing-event', array('message' => $_POST['typing'], 'from' => $_POST['from'], 'to' => str_replace('#', '', $_POST['to'])));
else{
    $pusher->trigger('presence-mychanel', 'typing-event', array('message' => 'null', 'from' => $_POST['from'], 'to' => str_replace('#', '', $_POST['to'])));
}
?>