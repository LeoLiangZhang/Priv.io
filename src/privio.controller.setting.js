// This is a hybrid controller, with some UI code.

var SettingController = function(privio, element){
	var self = this;
	this.privio = privio;
	this.element = element;

	var pio = this.privio.getPIO();
	var current_secret = null;
	var rsakey = {};
	this.element.on('show', function(e){
		if(e.target != self.element[0]) return;
		self.element.find('form').each(function(i, elm){
			elm.reset();
		});
		self.element.find('#change_key_require_password').hide();
		pio.loadSecret().done(function(secret){
			current_secret = secret;
			rsakey = secret.rsa_key;
			self.element.find('form select #storage').val(secret.storage_provider);
			self.element.find('form input[name="accessKey"]').val(secret.access_key);
			self.element.find('form input[name="accessSecret"]').val(secret.access_secret);

			self.element.find("#settings_rsa_passphrase").val(secret.rsa_passphrase);
			self.element.find("#settings_cpabe_master_key").val(secret.cpabe_master_key);
		});
		pio.loadPublicKey('cpabe').done(function(key){
			self.element.find("#settings_cpabe_public_key").val(key);
		});
		pio.loadPublicKey('rsa').done(function(key){
			self.element.find("#settings_rsa_public_key").val(key);
		});

	});


	// Update User Setting
	this.element.find('#btn_update').click(function(){
		var forms_vals = {};
		self.element.find('form').each(function(i, elm){
			forms_vals[$(elm).attr('name')] = getFormValues(elm);
		});

		var secret = current_secret;
		var secret_changed = false;
		// update keys
		var form_setttings_keys = forms_vals.form_setttings_keys;
		if(!secret.rsa_passphrase || (secret.rsa_passphrase != form_setttings_keys.rsa_passphrase)){
			secret_changed = true;
//			var rsa_key = cryptico.generateRSAKey(form_setttings_keys.rsa_passphrase, RSA_KEY_BITS);
//			var rsa_pub = cryptico.publicKeyString(rsa_key);
			pio.savePublicKey("rsa", form_setttings_keys.rsa_public_key);
			FloatNotification.info('Updated RSA key pair.');
			secret.rsa_key = rsakey;
			secret.rsa_passphrase = form_setttings_keys.rsa_passphrase;
		}
		if(!secret.cpabe_master_key || (secret.cpabe_master_key != form_setttings_keys.cpabe_master_key)){
			secret_changed = true;
			pio.savePublicKey("cpabe", form_setttings_keys.cpabe_public_key);
			FloatNotification.info('Updated CPABE key pair.');
			secret.cpabe_master_key = form_setttings_keys.cpabe_master_key;
		}

		if(secret_changed){
			var password = forms_vals.form_setttings_keys.password_old;
			if(!password) {
				FloatNotification.error("Enter your password or cancel.");
				self.element.find('#change_key_require_password .control-group').addClass('error');
				return;
			}
			pio.saveSecret(password, secret).done(function(){
				FloatNotification.success('Saved SECRET in user setting.');
			}).fail(function(err){
				FloatNotification.error('ERROR: Saving SECRET in user setting. '+err);
			});
		}
		self.element.modal('toggle');
	});

	// Create CPABE key pair
	this.element.find('#settings_btn_create_cpabe_key').click(function(){
		self.element.find('#change_key_require_password').show('fast');
		FloatNotification.warn('Creating your CPABE key, please wait');
		pio.crypto.cpabe.cpabe_setup().done(function(ret){
			self.element.find("#settings_cpabe_master_key").val(ret.master_key);
			self.element.find("#settings_cpabe_public_key").val(ret.pub_key);
			FloatNotification.success('New CPABE key pair has created.');
		});
	});

	this.element.find('#settings_btn_create_rsa_key').click(function(){
		self.element.find('#change_key_require_password').show('fast');
		FloatNotification.warn('Creating your RSA key, please wait');
		var passphrase = self.element.find("#settings_rsa_passphrase").val();
		pio.crypto.rsa.generateRSAKey(passphrase, RSA_KEY_BITS).done(function(ret){
			rsakey = ret;
			pio.crypto.rsa.publicKeyString(rsakey).done(function(pub_key){
				self.element.find("#settings_rsa_public_key").val(pub_key);
				FloatNotification.success('New RSA key pair has created.');
			});
		});
	});
};

/**
 * Show one of the tab.
 * @param tab name of the tab, can be one of [Account, Storage, Keys, Apps];
 */
SettingController.prototype.showTab = function(tab){
	this.element.modal('show');
	$('#privSettings .nav-tabs li a').each(function(i, elm){
		var elm_a = $(elm);
		var t = elm_a.text();
		if(t == tab){
			elm_a.tab('show');
		}
	});
};