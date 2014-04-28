var UIController = function(privio){
	this.ui = null;
	this.privio = privio;
};

UIController.prototype.show = function(){
	this.ui.show();
};
UIController.prototype.close = function(){
	this.ui.close();
};