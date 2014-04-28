/**
 * Main Controller
 */
var Privio = function(){
	// Entry point, the main
	this.models = {}; // url:SubFS
	this.current_uiController = null;
	this.pio = new Pio();
	this._init();
};

Privio.prototype._init = function(){
	this.current_uiController = new WelcomeController(this);
	this.current_uiController.show();
};

Privio.prototype.getPIO = function(){
	return this.pio;
};

Privio.prototype.currentController = function(controller){
	if(controller){
		var old = this.current_uiController;
		old.close();
		this.current_uiController = controller;
		controller.show();
	}
	return this.current_uiController;
};