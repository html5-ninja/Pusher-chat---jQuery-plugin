<?php

/* ------------ user autentification ---------------
  /*
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
require_once('../lib/Pusher.php');

$name = $_GET['name']; // chose the way to get this get,post session ...etc
$user_id = $_GET['user_id']; // chose the way to get this get,post session ...etc
$channel_name = $_POST['channel_name']; // never change 
$socket_id = $_POST['socket_id']; // never change 


$pusher = new Pusher($key, $secret, $app_id);
$presence_data = array('name' => $name);
echo $pusher->presence_auth($channel_name, $socket_id, $user_id, $presence_data);
?>