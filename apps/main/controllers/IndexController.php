<?php

class IndexController{

	public function __construct(){}

	public function show(){
		$templateVariable['message'] 	= 'Hello World PHP';

		$this->htmlRender = new \Astronphp\FrontView\Template();
		$this->htmlRender->content($templateVariable)
			->nameTemplate('template_default')
			->fileTemplate('index.tpl')
			->useCache(false)
			->render();
	}

}