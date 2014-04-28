var UserUI = function(controller){
	BaseUI.call(this, controller);
	this.element = $('#privUser');
	this.buffer_messages = [];
	this.parent_messages = [];

	this.msgs = {}; // id: UIMsg
	var self = this;

};
inherits(UserUI, BaseUI);

UserUI.prototype.show = function(){
	this.element.fadeIn();
	//$('#appNames li:first').click();
};

UserUI.prototype.close = function(){
	alert('UserUI.close() not impl. yet.');
};

UserUI.prototype.setProfileInfo = function(name, duri_img, friends, fullname){
	var self = this;
	var username = name;
	var friends = friends || [];
	if(!fullname || fullname == "")
		fullname = "{YOUR_NAME}";

	if(!(duri_img && (''+duri_img).indexOf('data:')>=0)) duri_img = "img/p.png";

	var fs =
		"<img src='"+ (duri_img || "img/p.png")+"' style='float:left; max-width:40px;'></img>" +
		"<p id='priv_fullname_container' style='margin:0px'>"+
		   "<a id='priv_fullname'><strong>" + fullname + "</strong></a>"+
		   '<input type="text" style="display:none" class="input-small" />' +
		"</p>" +
		"<p>@" + username + "</p>" +
		'<input type="file" id="fileElem" multiple accept="image/*" style="display:none">'+
		"<div style='clear:both'></div>" +
		"<ul class='nav nav-list' id='appNames'>"+
		"<span class='nav-header'>apps</span>" +
		"<li data-app='news'><a href='#'><i class='icon-list icon-white' />News Feed</a></li>"+
		"<li data-app='news-csp'><a href='#'><i class='icon-list icon-white' />News Feed CSP</a></li>"+
//		"<li data-app='news-csp' class='active'><a href='#'><i class='icon-list icon-white' />News Feed CSP</a></li>"+
		"<li data-app='photo'><a href='#'><i class='icon-picture icon-white' />Photo Album</a></li>"+
		"<li data-app='chat'><a href='#'><i class='icon-picture icon-white' />Chatting</a></li>"+
		"<li data-app='caja-feed'><a href='#'><i class='icon-picture icon-white' />Caja-NewsFeed</a></li>"+
		"<li data-app='caja-chat'><a href='#'><i class='icon-picture icon-white' />Caja-chat</a></li>"+
		"</ul>" +
		//"<p>Friends List</p>" +
		"<p><ul class='nav nav-list'>" +
//		"<span class='nav-header'>Friends List</span>" +
		"";
	friends = []; // temporary disable friend message display
	for(var i = 0; i < friends.length; i++){
		var f = friends[i];
		fs += "<li>"+ f +"</li>";
	}
	fs+= "</ul></p>";
	var div_profile = this.element.find('#divProfile');
	div_profile.html(fs);

	div_profile.find('#appNames li').click(function(e){
		div_profile.find('#appNames li').removeClass("active");//.css('font-style', 'normal');
		$(this).addClass("active");//.css('font-style', 'italic');
		var type = $(this).attr('data-app') || 'news';
		if(type == 'news'){
			$('#appContainer').html('<iframe src="http://feed.app.priv.io/app/feed/index.html" class="privio-app-iframe" sandbox="allow-scripts allow-same-origin" ></iframe>');
			self.controller.changeActiveApp($('#appContainer iframe')[0].contentWindow, "http://feed.app.priv.io/");
		} else if(type == 'news-csp'){
			$('#appContainer').html('<iframe src="http://feed2.app.priv.io/app/feed2/index.html" class="privio-app-iframe" sandbox="allow-scripts allow-same-origin" ></iframe>');
			self.controller.changeActiveApp($('#appContainer iframe')[0].contentWindow, "http://feed2.app.priv.io/");
		} else if(type == 'photo'){
			$('#appContainer').html('<iframe src="http://photo.app.priv.io/app/photo/index.html" class="privio-app-iframe" sandbox="allow-scripts allow-same-origin" ></iframe>');
			self.controller.changeActiveApp($('#appContainer iframe')[0].contentWindow, "http://photo.app.priv.io/");
		} else if(type == 'chat'){
			$('#appContainer').html('<iframe src="http://chat.app.priv.io/app/chat/index.html" class="privio-app-iframe" sandbox="allow-scripts allow-same-origin" ></iframe>');
			self.controller.changeActiveApp($('#appContainer iframe')[0].contentWindow, "http://chat.app.priv.io/");
		} else if(type == 'caja-feed'){
			$('#appContainer').html('<iframe src="http://caja.app.priv.io/container.html?app_url=http%3A%2F%2Fcaja.app.priv.io%2Fapp%2Fcajafeed%2Findex.html" class="privio-app-iframe" sandbox="allow-scripts allow-same-origin" ></iframe>');
			self.controller.changeActiveApp($('#appContainer iframe')[0].contentWindow, "http://caja.app.priv.io/");
		} else { // if(type == 'caja-chat'){
			$('#appContainer').html('<iframe src="http://caja.app.priv.io/container.html?app_url=http%3A%2F%2Fcaja.app.priv.io%2Fapp%2Fcajachat%2Findex.html" class="privio-app-iframe" sandbox="allow-scripts allow-same-origin" ></iframe>');
			self.controller.changeActiveApp($('#appContainer iframe')[0].contentWindow, "http://caja2.app.priv.io/");
		}
	});

//	$('#appNames li:first').click();
	div_profile.find('#priv_fullname').click(function(e){
		e.preventDefault();
		$(this).hide();
		div_profile.find('input[type="text"]').val(fullname).show();
	});
	div_profile.find('input[type="text"]').focusout(function(){
		var newname = div_profile.find('input[type="text"]').val();
		if(newname == fullname){
		} else {
			fullname = newname;
			var elm = div_profile.find('#priv_fullname');
			elm.find('strong').text(newname);
			elm.show();
			self.controller.updateName(newname);
		}
		$(this).hide();
	});
	div_profile.find('#fileElem').change(function(){
		var elm = document.getElementById('fileElem');
		var files = elm.files;
		var file = files[0];
		if(file){
			console.log(file);
			self.controller.updateProfileImage(file);
		}

	});

	div_profile.find('img:first').click(function(){
		div_profile.find('#fileElem').click();
	});
};

