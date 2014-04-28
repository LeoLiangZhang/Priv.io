var RegistrationController = function(privio, element){
	var self = this;
	this.privio = privio;
	this.element = element;

	this.isWorking = false;
	self.element.find('#btn_reg').button('reset');
	var reset = function(){
		self.element.find('form').each(function(i, elm){
			elm.reset();
		});
	};

	self.element.find('#btn_reg').click(function(){
		if(self.isWorking){
			FloatNotification.error('Please wait while System is creating an account for you.');
			return;
		}
		self.isWorking = true;
		self.element.find('#btn_reg').button('loading');
		var options = getFormValues(self.element.find('form').get(0));
		Pio.registration(options).done(function(){
			FloatNotification.success("Congratulation your account has been created successfully.");
			self.element.modal('hide');
			reset();
		}).fail(function(err){
			FloatNotification.error(err);
		}).progress(function(msg){
			FloatNotification.info(msg);
		}).always(function(){
			self.isWorking = false;
			self.element.find('#btn_reg').button('reset');
		});
	});

};