var FriendshipController = function(privio, element){
	var self = this;
	this.privio = privio;
	this.element = element;
	var pio = privio.getPIO();

	var $element = $(element)
	, pio = privio.getPIO();

	self.clear = function(){
		$element.find('tbody').html("");
	};

	var addRow = function(id, is_pending, policy){
		var ps = [];
		policy.forEach(function(tag){
			ps.push('<span class="badge badge-info">'+tag+'</span>');
		});
		var s = '<tr><td><i>@'+id+'</i> '+ (is_pending ? '<span class="badge badge-warning">Pending</span>': "")
			  + '<span id="btn_remove_friend" class="pull-right close">&times</span>'
			  +'</td>'
			  + '<td>'+ ps.join(' ') +'</td>'
			  + '</tr>';
		var $s = $(s);
		$s.find('#btn_remove_friend').click(function(){
			if(window.confirm('Are you sure you want to remove '+id+"?")){
				pio.removeFriend(id);
				$s.remove();
			}
		});
		$element.find('tbody').append($s);
	};

	var refresh = function(){
		self.clear();

		var lst_friend = pio.listFriends();
		lst_friend.forEach(function(friendid){
			var friend = pio.getFriendDetail(friendid);
			var policy = friend.policy;
			var pending = friend.status == "pending";
			addRow(friendid, pending, policy);
		});
	};

	var updateFriendship = function(){
		pio.refreshPendingFriends().done(function(updated_friends){
			if(updated_friends.length > 0){
				updated_friends.forEach(function(f){
					FloatNotification.success("You are now friend with "+ f);
				});
				refresh();
			}
		});
	};
	updateFriendship();

	$('#friend_btn_refresh').click(function(){
		updateFriendship();
	});


	// Auto Completion
	$element.on('show', refresh);
	var options = {
			source: ['friend', 'family', 'colleague', 'close_friend', 'temp', 'test'],
			items: 8
	};
	$element.find('#friend_txt_policy').typeahead(options);

	function getAlertHTML(text){
		var s = '<div class="alert alert-info fade in">'
				+ '<a class="close" data-dismiss="alert" href="#">&times;</a>'
				+ text
				+'</div>';
		return s;
	}
	
	

	$element.find('#friend_btn_add').click(function(){
		if($element.find('#friend_btn_add').hasClass('disabled')) return;

		var id = $element.find('#friend_id').val().trim();
		var policy = $element.find('#friend_txt_policy').val().trim();
		policy = "@@ @"+id+" "+policy;
		if(id == ''){
			FloatNotification.error('Friend ID cannot be empty.');
			$element.find('form')[0].reset();
			return;
		}
		var policy_tags = policy == '' ? [] : policy.split(' ');
		FloatNotification.info('Please wait. System is creating keys for your new friend.');
		$element.find('#friend_btn_add').addClass('disabled');
		pio.addFriend(id, policy_tags).done(function(msg){
			refresh();
			FloatNotification.info('Friend request sent.');
		}).fail(function(msg){
			FloatNotification.error(msg);
		}).always(function(){
			$element.find('#friend_btn_add').removeClass('disabled');
		}).progress(function(status){
			FloatNotification.info(status);
		});
		addRow(id, true, policy_tags);

		$element.find('form')[0].reset();
		$('#div_info').html(getAlertHTML("<strong>One more step: </strong>tell your friend that your Friend ID is "
				+ "<strong><i>" + pio.getUsername() + "</i></strong>"
				+"."));
	});
	
	// Dropdown list of Friends of friends
	var defer_foflist = null;
	var $lst_FOF_list = $element.find('#lst_FOF_list');
	
	var show_fof_info = function(message){
		var str_elm = '<span id="li_FOF_info"></span>';
		var $li_FOF_info = $element.find('#li_FOF_info');
		if(!message){
			$li_FOF_info.remove();
			return;
		}
		if($li_FOF_info.length == 0){
			$li_FOF_info = $(str_elm);
			$lst_FOF_list.append($li_FOF_info);
		}
		$li_FOF_info.text(message);
	};
	var show_sendFOFMessage = function(fid){
		if(!fid){
			$element.find('#div_sendFOFMessage').html('');
			return;
		}
		var str_html = "Send a friend request to @"+fid+" via " +
		'<div class="btn-group">'+
		'  <a class="btn btn-small dropdown-toggle" data-toggle="dropdown" href="#">'+
		'    <span></span>'+
		'    <span> </span><span class="caret"></span>'+
		'  </a>'+
		'  <ul class="dropdown-menu">'+
		'  </ul>'+
		'</div>'+
		'?'+
		'<button id="btn_ok" class="btn">Ok</button>'+
		'';
		
		str_html = getAlertHTML(str_html);
		var $elm = $(str_html);
		var fid_via = fofriends[fid][0];
		$elm.find('a.btn.dropdown-toggle > span:first').text(fid_via);
		var lst = fofriends[fid];
		var $ul = $elm.find('ul');
		lst.forEach(function(fid2){
			$ul.append("<li>"+fid2+"</li>");
		});
		$ul.on('click', 'li', function(){
			fid_via = $(this).text();
			$elm.find('a.btn.dropdown-toggle > span:first').text(fid_via);
		});
		$elm.find('#btn_ok').click(function(){
			console.log('show_sendFOFMessage: '+'send fof message to '+fid+' via '+fid_via);
			var myid = pio.getUsername();
			pio.sendFOFMessage(fid, "@"+myid+" want to be friend with you.", [fid_via]);
		});
		$element.find('#div_sendFOFMessage').append($elm);
	};
	var fofriends = {};
	$lst_FOF_list.on("click", "li", function(event){
		var $this = $(this);
//		if($this == $li_FOF_info) return;
		var fid = $this.attr('data-fid');
		console.log("Choose", fid);
		$element.find('#friend_id').val(fid);
//		$btn_FOF_list.parent().toggleClass('open');
		show_sendFOFMessage(fid);
	});
	
	var $btn_FOF_list = $element.find('#btn_FOF_list');
	$btn_FOF_list.click(function(){
//		$(this).dropdown();
		$(this).parent().toggleClass('open');
		if(!defer_foflist && $(this).parent().hasClass('open')){
			// Set loading text
			show_fof_info("LOADING...");
			
			defer_foflist = pio.getFriendsOfFriends();
			defer_foflist.done(function(lst_fof){
				
//				$li_FOF_info.addClass('hide');
				console.log("lst_fof", lst_fof);
				
				var my_friends = [];
				fofriends = {};
				for(var i in lst_fof){
					my_friends.push(i);
					var lst = lst_fof[i];
					for(var j in lst){
						var unknown_friend = lst[j];
						var ls = fofriends[unknown_friend] || [];
						ls.push(i);
						fofriends[unknown_friend] = ls;
					}
				}
				for(var i in my_friends){
					delete fofriends[my_friends[i]];
				}
				delete fofriends[pio.getUsername()];
				
				var str_lis = "";
				var count = 0;
				for(var i in fofriends){
					count ++;
					var lst = fofriends[i];
					var _lst = lst;
					var str_more = '';
					var cap = 3;
					if(lst.length > cap){
						_lst = lst.slice(0,3);
						str_more = " and "+(lst.length-cap)+" more";
					}
					str_lis+="<li "+"data-fid='"+i+"'><a href='#'>"+i+" via "+_lst.join(', ')+str_more+"</a></li>";
				}
				$lst_FOF_list.html(str_lis);
				
				if(count == 0){
					show_fof_info("Yahoo, you know all your friends' friends!");
				}
				defer_foflist = null;
			}).fail(function(err){
				show_fof_info("ERROR:"+err);
				defer_foflist = null;
			});
		}
		console.log("btn_FOF_list clicked.");
	});
	
	
};