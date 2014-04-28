var ShareControlButton = function(options){
	options = jQuery.extend({}, ShareControlButton.defaultOptions, options);
	var self = this;
	var html = ''+
	'<div id="btn_share" class="btn-group">'+
	'	<div class="btn dropdown-toggle" href="#" style="width: 100px;">'+
	'		<span data-btn="friends"><i class="glyphicon-parents"></i> Friends</span> <span class="caret"></span>'+
	'	</div>'+
	'	<ul id="dd_share" class="dropdown-menu jq-animation" role="menu" aria-labelledby="dropdownMenu">'+
	'		<li class="select"><a href="#"><span data-btn="friends"><i class="glyphicon-parents"></i> Friends</span></a></li>'+
	'		<li class="extend-dropdown-menu-container"><a href="#"><span data-btn="groups"><i class="glyphicon-group"></i> Groups</span></a>'+
	'			<div class="extend-dropdown-menu jq-animation">'+
	'				<div class="extend-dropdown-menu-header">'+
	'					<span style="">Choose group(s)</span>'+
	'				</div>'+
	'				<div class="extend-dropdown-menu-content" data-toggle="buttons-checkbox">'+
	'				</div>'+
	'			</div></li>'+
	'		<li class="extend-dropdown-menu-container"><a href="#"><span data-btn="users"><i class="icon-user"></i> Users</span></a>'+
	'			<div class="extend-dropdown-menu jq-animation">'+
	'				<div class="extend-dropdown-menu-header">'+
	'					<span>Choose users(s)</span>'+
	'				</div>'+
	'				<div class="extend-dropdown-menu-content" data-toggle="buttons-checkbox">'+
	'				</div>'+
	'			</div></li>'+
	'		<li class="divider"></li>'+
	'		<li class="extend-dropdown-menu-container"><a><span data-btn="custom"><i class="icon-tags"></i> Custom</a></span></a>'+
	'			<div class="extend-dropdown-menu jq-animation" style="width:200px;">'+
	'				<div class="extend-dropdown-menu-header">'+
	'					<span style="">Custom</span>'+
	'				</div>'+
	'				<div class="extend-dropdown-menu-content" data-toggle="buttons-checkbox">'+
	'					<textarea style="width:170px;"></textarea>'+
	'				</div>'+
	'			</div>'+
	'		</li>'+
	'	</ul>'+
	'</div'+
		'';

	ShareControlButton.installCSS();
	var $element = $(html);
	var $txt_policy = $element.find('textarea');

	var getFriendPolicyTags = options.getFriendPolicyTags;

	$element.find('li').on('click', function(event){
		event.preventDefault();
		var $this = $(this);
		if($this.hasClass('divider'))return;

		var obj = $this.find('.extend-dropdown-menu')[0];
		var hasSub = !!obj;
		var share_type = $this.find('span').attr('data-btn');
		if(share_type == "friends"){
			$txt_policy.val('@@');
		} else if(share_type == "groups" || share_type == "users"){
			setTimeout(function(){
				var tags = [];
				$this.find('.extend-dropdown-menu span.active').each(function(i, elm){
					tags.push($(elm).text());
				});
				$txt_policy.val(tags.join(' '));
			}, 1);
		} else { //custom

		}

		if(hasSub && $(event.target).parents().index(obj) >= 0) { // from Sub
//			console.log('From sub', $(event.target).text());
			return;
		}
//		console.log($this.find('span').attr('data-btn'));
		$element.find('.btn.dropdown-toggle').html($this.find('a').html()+' <span class="caret"></span>');
		$element.find('#dd_share .select').removeClass('select').find('.extend-dropdown-menu').fadeOut('fast');
		$this.addClass('select').find('.extend-dropdown-menu').slideDown('fast');

	});

	$element.find('.btn.dropdown-toggle').click(function(event){
		event.preventDefault();
		$element.toggleClass('open');

		if($element.hasClass('open')){
			getFriendPolicyTags().done(function(tags){
				tags = tags || [];
				tags.forEach(function(tag){
					if(tag == "@@" || tag == "")return;
					var s = '<span class="btn btn-primary badge">'+tag+'</span>';
					var $tag = $(s);
					if(tag[0] == "@"){
						$('.extend-dropdown-menu:eq(1) .extend-dropdown-menu-content').append($tag);
					} else {
						$('.extend-dropdown-menu:eq(0) .extend-dropdown-menu-content').append($tag);
					};
				});
			});
		};
	});

	self.getElement = function(){return $element[0];};
	self.getPolicy = function(){return $txt_policy.val();};

};

ShareControlButton.defaultOptions = {
	getFriendPolicyTags : function(){
		var deferred = new jQuery.Deferred();
		P.getFriendPolicyTags().done(function(tags){
			deferred.resolve(tags);
		});
//		deferred.resolve(['@@', 'friends', 'close_friends', '@liang', '@liang2', '@amislove']);
		return deferred.promise();
	}
};

ShareControlButton._hasInstallCSS = false;
ShareControlButton.installCSS = function(){
	var css = ''+
	'.extend-dropdown-menu {'+
	'	position: absolute;'+
	'	top: -3px;'+
	'	right: 100%;'+
	'	z-index: 1000;'+
	'	display: none;'+
	'	float: left;'+
	'	width: 160px;'+
	'	margin: 2px;'+
	'	list-style: none;'+
	'	background-color: white;'+
	'	border: 1px solid #CCC;'+
	'	-webkit-border-radius: 6px;'+
	'	-moz-border-radius: 6px;'+
	'	border-radius: 6px;'+
	'	-webkit-box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);'+
	'	-moz-box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);'+
	'	box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);'+
	'	-webkit-background-clip: padding-box;'+
	'	-moz-background-clip: padding;'+
	'	background-clip: padding-box;'+
	'}'+
	''+
	'.extend-dropdown-menu-header {'+
	'	padding: 3px 14px;'+
	'	background-color: #EBEBEB;'+
	'	border-radius: 6px 6px 0px 0px;'+
	'	box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);'+
	'}'+
	''+
	'.extend-dropdown-menu-content {'+
	'	white-space: normal;'+
	'	padding: 8px;'+
	'}'+
	''+
	'.extend-dropdown-menu-container {'+
	'	position: relative;'+
	'}'+
	''+
	'.extend-dropdown-menu-content .btn.badge {'+
	'	margin: 0px 2px;'+
	'}'+
	''+
	'.select .extend-dropdown-menu {'+
	'	display: block;'+
	'}'+
	''+
	'.jq-animation {'+
	'	display: none;'+
	'}'+
	''+
	'.select .extend-dropdown-menu.jq-animation {'+
	'	display: none;'+
	'}'+
	''+
	'.badge.btn{'+
	'	font-weight: normal;'+
	'}'+
	''+
	'.badge.btn.active{'+
	'	font-weight: bold;'+
	'}'+
	''+
	'.dropdown-menu .select {'+
	'	background-color: #EBEBEB;'+
	'}'+
	'';

	if(!ShareControlButton._hasInstallCSS){
		$("<style type='text/css'> "+css+" </style>").appendTo("head");
		ShareControlButton._hasInstallCSS = true;
	};
};

var btn = new ShareControlButton({getFriendPolicyTags : function(){
		var deferred = new jQuery.Deferred();
		deferred.resolve(['@@', 'friends', 'close_friends', '@liang', '@liang2', '@amislove']);
		return deferred.promise();
	}});
$('#btn_share').append(btn.getElement());
$(btn.getElement()).unwrap();

