var WelcomeUI = function(controller){
	BaseUI.call(this, controller);
};
inherits(WelcomeUI, BaseUI);

WelcomeUI.prototype.show = function(){
	this.element = $('#privWelcome');
	var self = this;

	this.element.find('#privLogin').submit(function(){
		self.controller.login();
		return false;
	});

	this.setLoginButtonState('reset');

};

WelcomeUI.prototype.close = function(){
	this.element.hide();
};

WelcomeUI.prototype.setUsername = function(name){
	this.element.find('#privLogin input[name="username"]').attr('value', name);
};

WelcomeUI.prototype.getUsername = function(){
	var username = this.element.find('#privLogin input[name="username"]').val();
	return username;
};

WelcomeUI.prototype.getPassword = function(){
	var password = this.element.find('#privLogin input[name="password"]').val();
	return password;
};

WelcomeUI.prototype.isRemembered = function(){
	return this.element.find('#privLogin input[type="checkbox"]').get(0).checked;
};

WelcomeUI.prototype.setRemembered = function(value){
	this.element.find('#privLogin input[type="checkbox"]').get(0).checked = value;
};

WelcomeUI.prototype.focusPassword = function(){
	this.element.find('#privLogin input[name="password"]').focus();
};

WelcomeUI.prototype.setLoginButtonState = function(state){
	this.element.find('#privLogin input[type="submit"]').button(state);
};
