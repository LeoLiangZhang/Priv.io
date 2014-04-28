
var FeedController = function(){
	this.ui = new UserUI(this);

	this.messages = {};

	this.comments = [];

	this.feeds = {};
};

FeedController.prototype.postMessage = function(msg, files, parent, policy){

	var self = this,
		deferred = new jQuery.Deferred();

	var cb = function(_msg){
		deferred.resolve(_msg);
	};

	self.postFeed(parent, msg, files, cb, policy);
	return deferred.promise();
};

FeedController.prototype.postFeed = function(parent, text, imgs, callback, policy){ //TODO: revise later, should have more objects
	//console.log("postFeed", arguments);
	var self = this;
	var username = this.username;
	var img_ids = [];
	var _postmsg = function(){
		var uuid = UUID.create();
		var abspath = "/" + username +"/obj/msg/"+uuid;
		var obj = {id: abspath,
				user: self.username, date: "" + new Date(), epoth: getTime(),
				parent: parent, msg: text, imgs: img_ids};
		var raw = JSON.stringify(obj);
		var friendid = username;
		var enc_key = null;
		if(parent){
			var m = self.messages[parent];
			friendid = m.friendid;
			enc_key = m.enc_key;
			policy = null;
		}
		P.saveObjectEx(abspath, raw, {friendid: friendid, policy:policy, enc_key:enc_key})
		.done(function(ret){
			self.messages[abspath] = ret;
			callback(obj);

			if(parent){
				var _abspath = parent;
				var i = _abspath.indexOf('/', 1);
				var bucket = _abspath.substring(1, i);
				var path = _abspath.substring(i+1);
				if(bucket == username){
//				self.addMessageToFeed({parent:parent, item:abspath});
					self.addMessagesToFeed([abspath], FeedController.getFeedPath(parent));
				} else{
					P.postMessage(bucket, {parent:parent, item:abspath});
				}
				self.saveComments(abspath);
			} else {
				var _raw = JSON.stringify({root: abspath, msgs:[abspath]});
				P.saveObjectEx("obj/feed/"+uuid, _raw, {friendid: username, policy:policy}).done(function(){
//				alert('postmsg done (new)');
				});
				P.loadObject("obj/feed/list").done(function(data){
					var o = JSON.parse(data);
					o.push("obj/feed/"+uuid);
					var s = JSON.stringify(o);
					P.saveObject("obj/feed/list", s);
				}).fail(function(){
					var o = [];
					o.push("obj/feed/"+uuid);
					var s = JSON.stringify(o);
					P.saveObject("obj/feed/list", s);
				});
			}
		});

	};

	if(imgs && imgs.length > 0){
		imgs.forEach(function(img){
			var img_uuid = UUID.create();
			var img_abspath = "/"+username+"/obj/img/"+img_uuid;
			P.saveObjectEx(img_abspath, img, {friendid: username, policy:policy}).done(function(){
				img_ids.push(img_abspath);
				if(img_ids.length == imgs.length)
					_postmsg();
			});
		}, this);
	} else {
		_postmsg();
	}
};

FeedController.getFeedPath = function(leading_msg){
	return leading_msg.replace('msg', 'feed');
};

//FeedController.prototype.addMessageToFeed = function(msg){
//	var deferred = new jQuery.Deferred();
//	var feed = msg.parent.replace('msg', 'feed');
//	var item = msg.item;
//	this.addMsgToFeed(feed, item);
//	P.loadObjectEx(feed).done(function(data2, ret){
//		var obj2 = JSON.parse(data2);
//		var msgs = obj2.msgs;
//		if(msgs.indexOf(item) < 0){
//			msgs.push(item);
//			var __raw = JSON.stringify(obj2);
//			P.saveObjectEx(feed, __raw, {friendid: ret.friendid, enc_key:ret.enc_key}).done(function(){
//				deferred.resolve(msgs);
//			}).fail(function(err){
//				console.log('addMessageToFeed: Saving', feed, 'fail.', err);
//				deferred.reject(err);
//			});
//		} else {
//			deferred.resolve(msgs);
//		};
//	}).fail(function(err){
//		console.log('addMessageToFeed: Loading', feed, 'fail.', err);
//		deferred.reject(err);
//	});
//	return deferred.promise();
//};

FeedController.prototype.addMessagesToFeed = function(lst_msg_abspath, feed){
	var deferred = new jQuery.Deferred();
	var self = this;

	if(!jQuery.isArray(lst_msg_abspath)){
		lst_msg_abspath = [lst_msg_abspath];
	}

	P.loadObjectEx(feed).done(function(data2, ret){
		var obj2 = jQuery.parseJSON(data2);//JSON.parse 
		console.log("addMessagesToFeed+loadObjectEx", obj2);
		var msgs = obj2.msgs;

		var lst_msgs = [];
		lst_msg_abspath.forEach(function(msg){
			if(msgs.indexOf(msg) < 0){
				lst_msgs.push(msg);
			}
			self.addMsgToFeed(feed, msg);
		});

		if(lst_msgs.length > 0){
			msgs = obj2.msgs = msgs.concat(lst_msgs);
			var __raw = JSON.stringify(obj2);
			P.saveObjectEx(feed, __raw, {friendid: ret.friendid, enc_key:ret.enc_key}).done(function(){
				deferred.resolve(msgs);
			}).fail(function(err){
				console.log('addMessagesToFeed: Saving', feed, 'fail.', err);
				deferred.reject(err);
			});
		} else {
			deferred.resolve(msgs);
		};
	}).fail(function(err){
		console.log('addMessagesToFeed: Loading', feed, 'fail.', err);
		deferred.reject(err);
	});
	return deferred.promise();
};

FeedController.prototype.refresh = function(){
	var self = this;
	self.loadFeeds(function(msg){
		self.ui.displayMessage(msg);
	});
};

FeedController.prototype.loadFeeds = function(callback){
	var t0 = new Date().getTime();

	var self = this;
	var friends = [];
	var loading_messages = [];
	var deferred = jQuery.Deferred();

	var n_feed = 0, n_msg = 0, n_pullmsg = 0;

	var counter = 0;
	var inc_counter = function(){
		counter ++;
	}, dec_counter = function(){
		counter --;
		if(counter <= 0){
			var t1 = new Date().getTime();
			P.log('loadFeeds', t1-t0, n_feed, n_msg, n_pullmsg);
			deferred.resolve();
		}
	};

	var loadMessage = function(abspath, func_load){
		var _msg = self.messages[msg_abspath];
		if(_msg) {
			callback(_msg);
			return;
		}
		if(loading_messages.indexOf(abspath)>=0) return;
		loading_messages.push(abspath);
		var msg_abspath = abspath;
		n_msg ++;
		P.loadObjectEx(msg_abspath).done(function(data, ret){
			var msg = JSON.parse(data);
			msg.func_load = func_load;
			self.messages[msg_abspath] = ret;
			if(callback){
				callback(msg);
			}
		}).always(function(){
			dec_counter();
		});inc_counter();
	};

	P.listFriends().done(function(_friends){
		friends = _friends;
		var lst = friends.slice();
		lst.unshift(self.username);

		lst.forEach(function(x){
			var username = x;
			var get_feed = function(feed_path){
				n_feed ++;
				var feed_abspath = "/"+username +"/"+feed_path;
				P.loadObjectEx(feed_abspath).done(function(data){
					var obj = JSON.parse(data);
					var msgs = obj.msgs;
					self.setFeed(feed_abspath, msgs);
					var load_num = 3;
					if(msgs.length > load_num){
						var func_load = (function(){
							var _msgs = msgs.slice(load_num);
							var has_ran = false;
							return function(){
								has_ran = true;
								_msgs.forEach(function(abspath){
									loadMessage(abspath);
								}, self);
							};
						})();
						loadMessage(msgs[0], func_load);
						msgs.slice(1, load_num).forEach(function(abspath){
							loadMessage(abspath);
						}, self);
					}else{
						msgs.forEach(function(abspath){
							loadMessage(abspath);
						}, self);						
					}
					
				}).always(function(){
					dec_counter();
				});inc_counter();
			};
			P.loadObject("/"+username +"/obj/feed/list").done(function(data){
				var obj = JSON.parse(data);
				var arr = obj;
				arr.forEach(function(path){
					get_feed(path);
				});
			}).always(function(){
				dec_counter();
			});inc_counter();
		}, this);
	}).always(function(){
//		dec_counter();
	});//inc_counter();

	P.pullMessage().done(function(messages){
		var feeds = {};
		messages.forEach(function(msg){
			n_pullmsg ++;
			var message = msg.message;
			var parent = message.parent, item = message.item;
			var feed = FeedController.getFeedPath(parent);
			feeds[feed] = (feeds[feed] || []).concat([item]);
		});

		jQuery.each(feeds, function(feed, lst_msg_abspath){
			self.addMessagesToFeed(lst_msg_abspath, feed).done(function(){
				lst_msg_abspath.forEach(function(msg){
					loadMessage(msg);
				});
			}).always(function(){
				dec_counter();
			});inc_counter();
		});

	}).always(function(){
//		dec_counter();
	});//inc_counter();


	self.loadComments().done(function(comments){
		comments.forEach(function(comment_abspath){
			loadMessage(comment_abspath);
		});
	}).always(function(){
		dec_counter();
	});inc_counter();

	return deferred;
};

FeedController.prototype.setFeed = function(feed_abspath, msgs){
	this.feeds[feed_abspath] = msgs;
};

FeedController.prototype.addMsgToFeed = function(feed_abspath, msg_abspath){
	var feed = this.feeds[feed_abspath];
	if(!feed){
		feed = this.feeds[feed_abspath] = [feed_abspath.replace('feed', 'msg')];
	}
	feed.push(msg_abspath);
};

FeedController.prototype.isPendingComment = function(msg){
	if(!msg || !msg.parent) return false;
	var feed_abspath = msg.parent.replace('msg', 'feed');
	var feed = this.feeds[feed_abspath];
	if(feed && feed.indexOf(msg.id)>=0){
		return false;
	}
	return true;
};

FeedController.prototype.loadComments = function(){
	// Load current user's comments, that have not been accepted by thread
	var self = this;
	var deferred = new jQuery.Deferred();
	var username = this.username;
	var comments_filepath = "/"+username+"/obj/comments";
	P.loadObject(comments_filepath).done(function(data){
		var obj = JSON.parse(data);
		self.comments = obj.comments;
		deferred.resolve(self.comments);
	}).fail(function(err){
		console.log('FeedController: cannot load /obj/comments. Assume empty list.');
		deferred.resolve(self.comments);
	});
	return deferred.promise();
};

FeedController.prototype.saveComments = function(abspath){
	// WARNING: Call loadComments before this. Make sure your /obj/comments is in sync.
	var self = this;
	var deferred = new jQuery.Deferred();

	if(abspath){
		self.comments.push(abspath);
	}
	var _raw = JSON.stringify({comments: self.comments});
	P.saveObject("obj/comments", _raw).done(function(){
		deferred.resolve();
	}).fail(function(err){
		deferred.reject(err);
	});
	return deferred.promise();
};




