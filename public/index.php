<?php

define('START_LEANSTART', microtime(true));
define('MEMORY_USAGE_LEANSTART', memory_get_usage());

require __DIR__.'/../vendor/autoload.php';

$app= new \RocketStartup\Components\Kernel\Foundation();

echo $app->terminate();