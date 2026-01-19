<?php
require_once __DIR__ . '/vendor/autoload.php';

require_once __DIR__ . '/src/config/db.php';

use App\Dispatcher;

$router = new Dispatcher();
$router->run();