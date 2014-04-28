var UserController = function(privio){
	UIController.call(this, privio);
	this.username = '';
	this.ui = new UserUI(this);
	this.setting = new SettingController(privio, $('#privSettings'));
	this.friendship = new FriendshipController(privio, $('#privFriends'));
};

inherits(UserController, UIController);

UserController.prototype.init = function(){

	var self = this;
	var pio = this.privio.getPIO();
	pio.getProfileImage().done(function(data){
		self.ui.setProfileInfo(pio.getUsername(), data,
				pio.listFriends(),
				pio.getName()
				);
		Pio.stat.finish("login");
	});
	this.ui.setProfileInfo(pio.getUsername(), null,
			pio.listFriends(),
			pio.getName()
			);

	// Init feedback
	!function(){

	    var options = {
	        title: "Have comments?",
	        placement: "bottom",
	        html: true,
	        content: "<form id='form_feedback'><input name='subject' type='text' style='width: 200px;' placeholder='Subject'><textarea name='body' placeholder='We would like hear your from you.' style='width: 200px; max-width: 200px;' rows='3'></textarea><button type='submit' class='btn'>Send</button></form>"
	    };

	    $('body').on('submit', '#form_feedback', function(event){
	        event.preventDefault();
	        var $this = $(this);
	        var obj = getFormValues($this[0]);
	        var s= 'mailto:suggestion@priv.io?subject='+escape(obj.subject)+'&body='+escape(obj.body);
	        location.href = s;
	        $this[0].reset();
	        $('#btn_privUser_feedback').popover('toggle');
	    });

	    $('#btn_privUser_feedback').popover(options);

	}();
	
	
	var displayFOFMessage = function(){
		var msgs = pio.loadFOFMessage();
		var $elm = $('<ul>');
		msgs.forEach(function(msg){
			$elm.append("<li>"+msg.message+"</li>");
		});
		var $btn = $('<button class="btn">Clear</button>');
		$btn.click(function(){
			pio.clearFOFMessage();
		});
		$elm = $('<div>').append($elm).append($btn);
		return $elm;
	};
	(function(){
		var options = {
		        title: "Messages",
		        placement: "bottom",
		        html: true,
		        content: displayFOFMessage
		    };
		$('#btn_privUser_messages').popover(options);
	})();
};

UserController.prototype.show = function(){
	UIController.prototype.show.apply(this, null);
	window.scrollTo(0, 0);



	var pio = this.privio.getPIO();
	FloatNotification.info("Welcome back, "+pio.getName());
	this.checkPublicKeys();
	pio.syncFriendList();
	
	this.checkMessage();
};

UserController.prototype.checkMessage = function(){
	var pio = this.privio.getPIO();
//	pio.checkFOFMessage();
	pio.checkFOFMessage().done(function(msgs){
		if(msgs.length > 0){
			pio.saveFOFMessage(msgs);
		}
	});
	
//	.done(function(msg){
//		
//	}).fail(function(err){
//		
//	});
};



UserController.prototype.checkPublicKeys = function(){
	var pio = this.privio.getPIO();
	var self = this;
	pio.loadSecret().done(function(secret){
		if(!secret.rsa_passphrase || !secret.cpabe_master_key){
			FloatNotification.warn('You public key has not been configured yet. Please revise now.');
			self.setting.showTab('Keys');
		}
//		setTimeout(function(){
//		}, 1000);
	});
};

UserController.prototype.updateName = function(newname){
	var pio = this.privio.getPIO();
	pio.updateName(newname);
};

UserController.prototype.updateProfileImage = function(file){
	var imgdata = null;
	var pio = this.privio.getPIO();
	var foo = function(){
		pio.updateProfileImage(imgdata);
	};
	if(file){
		var reader = new FileReader();
		reader.onload = function(evt) {
			imgdata = evt.target.result;
			hex = shautils.hex(imgdata);
			foo();
			console.log("loaded image;", file);//, hex);
		};
		reader.readAsDataURL(file);//readAsBinaryString(file);
	}
};

UserController.prototype.changeActiveApp = function(contentWindow, origin){
	var pio = this.privio.getPIO();
	pio.app_manager.app_windows[contentWindow] = origin;
	pio.stat_begin("LoadApp");
};
