<?php

define('START_ASTRONPHP', microtime(true));
define('MEMORY_USAGE_ASTRONPHP', memory_get_usage(true));

require __DIR__.'/../vendor/autoload.php';

$app= new \Astronphp\Components\Kernel\Foundation();

echo $app->terminate();