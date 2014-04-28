var WelcomeController = function(privio){
	UIController.call(this, privio);
	this.ui = new WelcomeUI(this);

	this.registration = new RegistrationController(privio, $('#privReg'));
};

inherits(WelcomeController, UIController);

WelcomeController.prototype.show = function(){
	UIController.prototype.show.call(this);

	var saved_username = localStorage['privio.saved_username'];
	if(saved_username){
		this.ui.setUsername(saved_username);
		this.ui.focusPassword();
		this.ui.setRemembered(true);
	}
};

WelcomeController.prototype.login = function(){
	var self = this;
	var username = this.ui.getUsername();
	var password = this.ui.getPassword();
	var pio = this.privio.getPIO();

	//TODO:DEBUG
	pio.begin_login_time = getTime();
	Pio.stat.begin("login")

	if(self.ui.isRemembered()){
		localStorage['privio.saved_username'] = username;
	} else {
		delete localStorage['privio.saved_username'];
	}

	this.ui.setLoginButtonState('loading');
	pio.login(username, password).done(function(ok){
		self.ui.setLoginButtonState('reset');
		var user = new UserController(self.privio);
		user.init();
		self.privio.currentController(user);
	}).fail(function(){
		self.ui.setLoginButtonState('reset');
		FloatNotification.show({message:"Username or password error.",
			type:"alert-error"});
	});

};

