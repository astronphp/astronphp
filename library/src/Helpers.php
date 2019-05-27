<?php

namespace Library;

class Helpers{

	public $version;

	public static function versionApp(){
		return \App::getInstance('App')->version();
    }
    public static function versionKernel(){
        return \Kernel::getInstance('Kernel')->version();
	}
    public static function baseUrl(){
        return \App::getInstance('App')->addressUri();
    }
    public static function addressFullUri(){
        return \App::getInstance('App')->addressFullUri();
    }

    public static function titlePage(){
        return 'Astron PHP - Hello World!';
    }
    
}