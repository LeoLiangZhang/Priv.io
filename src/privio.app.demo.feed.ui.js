
var BaseUI = function(controller){
	this.controller = controller;
	this.element = null;
};

BaseUI.prototype.show = function(){};
BaseUI.prototype.close = function(){};

var UserUI = function(controller){
	BaseUI.call(this, controller);
	this.element = $('body');
	this.buffer_messages = [];
	this.parent_messages = [];
	this.btn_share = new ShareControlButton({placeholder:$('#btn_share')});

	this.msgs = {}; // id: UIMsg
	var self = this;

	var is_posting = false;
	$('#form_postMessage').submit(function(){
		if(is_posting) return;
		var msg = $('#message')[0].value;
		var files = [];

		$('#photo_preview img').each(function(i, img){
			var $img = $(img);
			files.push($img.attr('src'));
		});

		var policy = self.getPolicy();
		if((''+policy).trim() == ''){
			alert('Your sharing policy is empty, please check.');
			return;
		}
		self.controller.postMessage(msg, files, null, policy).done(function(_msg){
			$('#form_postMessage input[type="submit"]').button('reset');
			is_posting = false;
			self.displayMessage(_msg);
		});
		$('#form_postMessage input[type="submit"]').button('loading');
		is_posting = true;
		$('#form_postMessage')[0].reset();
		$("#photo_preview").html('');
	});
	
	var addAttachPhoto = function(imgdata){
		var $photo_preview = $("#photo_preview");
		var $div_img = $('<div class="message-img-upload-preview-container"><img class="message-img-upload-preview"></img><button class="close message-img-upload-preview-close">&times;</button></div>');
		var $div_img_button = $div_img.find('button');
		$div_img_button.click(function(){
			$div_img.remove();
		});
		$photo_preview.append($div_img);
		$div_img.hover(function(event){ //mouseenter
			$div_img_button.css('display', 'block');
		}, function(){ // mouseleave
			$div_img_button.css('display', 'none');
		});
		//$div_img.find('img').attr('src', imgdata);
		P.setDataURI($div_img.find('img'), imgdata);
	};

	$('#btn_addmsgpic').click(function(event){
		event.preventDefault();
		$('#input_addmsgpic').click();
		if(paja){
			paja.openFile(function(files){
				files.forEach(function(file){
					addAttachPhoto(file.data);
				});
			});	
		}
	});

	$('#input_addmsgpic').on('change', function(event){
		$.each($('#input_addmsgpic')[0].files, function(i, file){
			console.log('Adding picture');
			var reader = new FileReader();
			reader.onload = function(evt) {
				var imgdata = evt.target.result;
				addAttachPhoto(imgdata);
				console.log("loaded image;", file);
			};
			reader.readAsDataURL(file);
		});

	});

	//$('#msgContainer').on('submit', '.message-comment-form', function(event){
	$('#msgContainer').on('submit', function(event){ //To compatible with Caja
		event.preventDefault();
		console.log('submit.message-comment-form');
		var $comment_form = $(event.target);
		var msg = $comment_form.find('#message').val();
		var parent = $comment_form.find('#parent').val();
		console.log('submit.message-comment-form', msg, parent);
		self.controller.postMessage(msg, null, parent).done(function(_msg){
			self.displayMessage(_msg);
		});
		$comment_form[0].reset();
	});

	$('#msgContainer').on('click', 'a[target="_blank"]', function(){
//		console.log($(this));
		P.openlink($(this).attr('href'));
	});
	
	var $controlDiv = $('<div>');
	$controlDiv.insertBefore('#form_postMessage');
	var $btnRefresh = $('<button class="btn">').text("Refresh").click(function(){
		controller.loadFeeds(function(msg){
			controller.ui.displayMessage(msg);
		});
	});
	$controlDiv.append($btnRefresh);

};

inherits(UserUI, BaseUI);

UserUI.prototype.show = function(){
	this.element.fadeIn();
	$('#form_postMessage input[type="submit"]').button('reset');
};

UserUI.prototype.getPolicy = function(){
//	return $('#policy').val();
	return this.btn_share.getPolicy();
};

UserUI.prototype.close = function(){
	alert('UserUI.close() not impl. yet.');
};

UserUI.prototype.bufferMessage = function(msg){
	var contain = false;
	this.buffer_messages.forEach(function(item){
		if(item.msg.id == msg.id) contain = true;
	}, this);
	if(!contain) this.buffer_messages.push(msg);
};

UserUI.prototype.checkBufferMessage = function(){
	var lst = [];
	this.buffer_messages.forEach(function(msg){
		var parent_id = msg.parent;
		if(this.msgs[parent_id]){
			this.displayMessage(msg);
		} else {
			lst.push(msg);
		};
	}, this);
	this.buffer_messages = lst;
};

UserUI.prototype.displayMessage = function(msg){
	var id = msg.id;
	var parent_id = msg.parent;
	var uimsg = this.msgs[id];
	if(!uimsg) {
		var parent = this.msgs[parent_id];
		if(!parent && parent_id){
			log.debug('Parent"', parent_id, '"not exist. buffered.');
			this.bufferMessage(msg);
			return;
		}

		uimsg = new UIMsg(id, msg, parent);
		this.msgs[id] = uimsg;

		if(msg.imgs && msg.imgs.length > 0){
//			var img_path = msg.imgs[0];
			$.each(msg.imgs, function(i, img_path){
				P.loadObjectEx(img_path).done(function(data){
					uimsg.showImage(data);
				});
			});
		}

		if(parent){ // child msg, and parent is loaded.
			if(this.controller.isPendingComment(msg)){
				uimsg.isPendingComment(true);
			}

			parent.addChild(uimsg);
		}

		if(!parent_id){ // parent msg
			var done = false;
			var marker = -1;
			this.parent_messages.forEach(function(pmsg, i){
				if(done) return;
				if(uimsg.epoch >= pmsg.epoch){
					pmsg.insertBefore(uimsg);
					marker = i;
					done = true;
				}
			}, this);
			if(done){
				this.parent_messages.splice(marker, 0, uimsg);
			}else {
				this.parent_messages.push(uimsg);
				$('#msgContainer').append(uimsg.element);
			};
		}

		this.checkBufferMessage();
	} else {
		// do something if msg alread displayed
	};
};

var UIMsg = function(id, msg, parent){
	var self = this;
	this.id = id;
	this.msg = msg;
	this.parent = parent;
	this.epoch = msg.epoth;
	this.child = [];

	var time_string = '';
	var calcTime = function(time){
		var t = getTime() - time;
		t /= 1000;
		if (t < 60)
			return Math.round(t) + 's';
		else if (t < 60 * 60)
			return Math.round(t/60) + 'm';
		else if (t < 60 * 60 * 24)
			return Math.round(t/60/60) + 'h';
		else
			return Math.round(t/60/60/24) + 'd';

	};
	time_string = calcTime(this.epoch);
	time_string += " ago";

	var text_msg = msg.msg;
	text_msg = text_msg.autoLink({target: '_blank'});


	this.element = $(
			'<div>'+
			'<div style="position: relative;">'+
			'<div class="message-meta">'+
			'<div class="message-id">'+id+'</div>'+
			'<div class="message-left"><span>'+msg.user+'</span></div>'+
			'<div class="message-right"><small><strong>'+time_string+'</strong></small></div>'+
			'<div class="message-body">'+
			'<div class="message-content">'+
			'<p>'+text_msg+'</p>'+
			'<div class="message-img"></div>'+
			(parent?'':'<div class="message-child-container"></div>') +
//			'<span><a href="#" id="btn_comment" class="privio-btn-comment">Comment</a></span>'+
			(!parent ? "<div class='message-comment-container'></div>" : "") +
			'</div>'+
			'</div>'+
			'</div>');

	var username = this.msg.user;
	P.loadPublicProfile(username).done(function(profile){
		self.element.find('.message-left:first').html(
			'<img ></img>'+
			'<span style="font-weight: bold;color: #08C;">'+profile.name+'</span>' +
			'<span> @'+username+'</span>' +
			''
		);
		P.setDataURI(self.element.find('img:first'), profile.imgdata);
	});

	if(!parent){
		this.element.addClass('message' );
		this.element.find('.message-comment-container').append(
			// Comment Form
			'<form class="form-inline message-comment-form">'+
			'<input id="parent" type="hidden" name="parent" value="" />'+
			'<input id="message" type="text" class="input" style="width:80%" placeholder="Your comment"></input>'+
			'<input type="submit" value="Post" class="btn" id="btn_postMsg" />'+
             '</form>'
		);
		if(msg.func_load){
			var $btn_load = $('<button class="btn">');
			$btn_load.text("Load More Comments");
			$btn_load.click(function(){
				msg.func_load();
				$btn_load.addClass('hide');
			});
			this.element.find('.message-comment-container').append($btn_load);
		}
		this.element.find('form #parent').val(self.id);

//		this.element.find('#btn_comment').click(function(){
//			var form = $('#privComment');
//			form.find('h5').text(self.msg.user + " " + self.msg.date);
//			form.find('#parent').val(self.id);
//			form.modal('show');
//			return false;
//		});
	}else{
		this.element.addClass('child-message');
		this.element.find('#btn_comment').hide();
	}
};

UIMsg.prototype.insertBefore = function(uimsg){
	this.element.before(uimsg.element);
};

UIMsg.prototype.addChild = function(uimsg){
	var done = false;
	var marker = -1;

	this.child.forEach(function(msg, i){
		if(done) return;
		if(uimsg.epoch >= msg.epoch){
			msg.element.after(uimsg.element);
			marker = i;
			done = true;
		}
	}, this);
	if(done){
		this.child.splice(marker, 0, uimsg);
	} else {
		if(this.child.length > 0){
			this.child[this.child.length-1].element.before(uimsg.element);
		}else{
			this.element.find('.message-child-container').append(uimsg.element);
		}
		this.child.push(uimsg);
	}
};

UIMsg.prototype.setText = function(text){
	this.element.find('p').text(text);
};

UIMsg.prototype.showImage = function(img_datauri){
	var $elm = $("<p><img src='' style='max-width:90%'></img></p>");
	this.element.find('.message-img:first').append($elm);
	$elm = $elm.find('img');
	P.setDataURI($elm, img_datauri);
};

UIMsg.prototype.isPendingComment = function(val){
	var time = this.element.find('.message-right strong').text();
	if(val){
		this.element.find('.message-right small').html('<span class="label label-warning">Pending</span> <strong>'+time+'</strong>');
	}else{
		this.element.find('.message-right small').html('<strong>'+time+'</strong>');
	}
};



