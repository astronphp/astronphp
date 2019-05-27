<?php

class IndexController{

	public function __construct(){}

	public function show(){
		$templateVariable['__titlesite__'] 	= \Library\Helpers::titlePage();
		$templateVariable['message'] 		= 'Hello World PHP';
		$templateVariable['copy'] 			= '© Copyright '.date('Y');

		$this->htmlRender = new \Astronphp\FrontView\Template();
		$this->htmlRender->content($templateVariable)
			->nameTemplate('template_default')
			->fileTemplate('index.tpl')
			->useCache(false)
			->render();
	}

}