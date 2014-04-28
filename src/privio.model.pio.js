
/* ========================

A set of API for login user.

High level Idea, in PIO, the API is divided into these logical categories,
* Setting API
* Profile API
* Safe API
* Friends Profile API
* Storage API
* Friends Communication API
  - Realtime Communication API
* Application Shortcut API
  - Wall API

  ========================= */

var Pio = function(){
	this.webfs = new WebFS();
	this._user_setting = null; // set to actual UserSetting object after login.
	this.app_manager = new AppManager(this);
	this.crypto = Pio.crypto;

	this._cpabe_decryptings = {};
	this._cache_public_profiles = {};
	this._loadingPublicProfiles = {};

	this.begin_login_time = 0;
	this.finish_first_loadFeeds_time = 0;
};

extend(Pio.prototype, EventListenerMixin);


Pio.crypto = new PrivCrypto();

//// Storage API \\\\

Pio.prototype.loadObject = function(abspath){//absolute path
	var webfs = this.webfs;
	var rp = this.resolvePath(abspath);
	var t0 = getTime(), self = this;
	var deferred = webfs.loadObject(rp.bucket, rp.path);
	deferred.done(function(data){
		var t = getTime() - t0;
		self.log("Pio_loadObject", abspath, t, data.length);
	});
	return deferred;
};

Pio.prototype.saveObject = function(abspath, data, meta){//save under friends key
	var webfs = this.webfs;
	var rp = this.resolvePath(abspath);
	var type = (meta && meta.type) || "text/plain; charset=UTF-8";
	var t0 = getTime(), self = this;
	var deferred = webfs.saveObject(rp.bucket, rp.path, data, type);
	deferred.done(function(){
		var t = getTime() - t0;
		self.log("Pio_saveObject", abspath, t, data.length);
	});
	return deferred;
};

Pio.prototype.listObjects = function(abspath){
	var webfs = this.webfs;
	var rp = this.resolvePath(abspath);
	return webfs.listObjects(rp.bucket, rp.path);
};

Pio.prototype.removeObject = function(abspath){
	var webfs = this.webfs;
	var rp = this.resolvePath(abspath);
	return webfs.removeObject(rp.bucket, rp.path);
};

Pio.prototype.resolvePath = function(path){
	if(!path) new Error('Cannot resolve null path.');
	var bucket = null, _path = null;
	if(REG_resolvePath.test(path)){
		var match = REG_resolvePath.exec(path);
		bucket = match[1];
		_path = match[2];
	} else {
		bucket = this.getUsername();
		_path = path;
	}
	return {bucket: bucket, path: _path};
};


//// User Setting API \\\\

Pio.prototype.login = function(username, password){
	var self = this;
	var abspath = WebFS.abspath(username, SETTING_FILENAME),
		deferred = new jQuery.Deferred();

	this.loadObject(abspath)
		.done(function(data){
			var user_setting = new UserSetting(username);
			if(user_setting.load(data,password)){
				self._setUserSetting(user_setting);

				// config WebFS
				self.webfs.setBucketConfig(username,
						new BucketConfig(
								user_setting.secret.access_key,
								user_setting.secret.access_secret));

				deferred.resolve(user_setting.shadow());
			} else { // login fail.
				deferred.reject();
			}
		})
		.fail(function(status){
			deferred.reject();
		});

	return deferred.promise();
};

Pio.prototype.getUsername = function(){
	if(!this._user_setting) return "";
	return this._user_setting.username;
};

Pio.prototype.onprofileUpdated = function(){};

Pio.prototype._setUserSetting = function(setting){
	this._user_setting = setting;
};

Pio.prototype._getUserSetting = function(){
	return this._user_setting;
};

Pio.prototype.saveUserSetting = function(){ // the input profile is shadow
	var deferred = new jQuery.Deferred();
	var str_profile = this._getUserSetting().toJSONString();
	this.saveObject(SETTING_FILENAME, str_profile).done(function(){
		log.debug("UserSetting updated");
		deferred.resolve();
	}).fail(function(status){
		log.debug("ERROR: profile updated", status);
		deferred.reject();
	});
	return deferred.promise();
};


//// Profile API \\\\

Pio.prototype.loadProfile = function(){
	var self = this;
	var deferred = new jQuery.Deferred();
	deferred.resolve(self._getUserSetting().shadow());
	return deferred.promise();
};

Pio.prototype.loadPublicProfile = function(user){
	var self = this,
		deferred = new jQuery.Deferred(),
		abspath = WebFS.abspath(user, SETTING_FILENAME);

	var process = function(){
		var cached = self._cache_public_profiles[user];
		if(cached){
			deferred.resolve(cached);
		} else {
			self.loadObject(abspath)
			.done(function(data){
				var obj = JSON.parse(data);
				var profile = obj.profile;
				profile.username = user;
				profile.imgdata = "http://priv.io/img/p.png";
				profile.friend_list = []; // a pseudo field
//				if(obj.friendship.friend_list){
//					var friend_list = obj.friendship.friend_list;
//					var enc_key = friend_list.enc_key;
//					var cipher = friend_list.cipher;
//					if(cipher && enc_key){
//						self.cpabe_decrypt({friendid:user, enc_key:enc_key, cipher:cipher})
//						.done(function(tmp){
//							friend_list = JSON.parse(tmp.data);
//							profile.friend_list = friend_list;
//							process2(profile);
//						}).fail(function(err){
//							log.debug('loadPublicProfile: cannot decrypt friend_list.',err);
//							deferred.reject(err);
//						});
//					}else{
//						process2(profile);
//					}
//				}else{
//					process2(profile);
//				}
				profile.friend_list = obj.friendship.friend_list;
				process2(profile);
				
			})
			.fail(function(err){
				log.debug('ERROR(Pio.loadPublicProfile): Cannot load',user,' profile', err);
				deferred.reject(err);
			});
		}
	};
	
	var process2 = function(profile){
		if(profile.img){
			self.loadObject(profile.img)
			.done(function(data_img){
				profile.imgdata = data_img;
				self._cache_public_profiles[user] = profile;
				deferred.resolve(profile);
			})
			.fail(function(err){
				log.debug('ERROR(Pio.loadPublicProfile): Cannot load',user,'profile img', err);
				self._cache_public_profiles[user] = profile;
				deferred.resolve(profile);
			});
		}else{
			self._cache_public_profiles[user] = profile;
			deferred.resolve(profile);
		}
	};

	var prepare_process = function(){
		if(self._loadingPublicProfiles[user]){
			var _deferred = self._loadingPublicProfiles[user];
			_deferred.done(function(){
				process();
			}).fail(function(){
				prepare_process();
			});
		} else {
			self._loadingPublicProfiles[user] = deferred;
			deferred.always(function(){
				delete self._loadingPublicProfiles[user];
			});
			process();
		}
	};
	prepare_process();

	return deferred.promise();
};

Pio.prototype.saveProfile = function(profile){ // the input profile is shadow
	this._getUserSetting().updateProfile(profile);
	return this.saveUserSetting();
};

Pio.prototype.getName = function(){
	return this._getUserSetting().profile.name;
};

Pio.prototype.updateName = function(newname){
	var profile = this._getUserSetting().shadow();
	profile.name = newname;
	return this.saveProfile(profile);
};

Pio.prototype.getProfileImage = function(callback){
	var profile = this._getUserSetting().shadow();
	return this.loadObject(profile.img);
};

Pio.prototype.updateProfileImage = function(imgdata){
	var self = this;
	var img_uuid = UUID.create();
	var img_path = "obj/img/"+img_uuid;
	var profile = this._getUserSetting().shadow();
	profile.img = WebFS.abspath(this.getUsername(), img_path);

	return jQuery.when(self.saveObject(img_path, imgdata),
			this.saveProfile(profile));
};


//// Safe API \\\\

Pio.prototype.getSafe = function(key, _default){
	var _user_setting = this._getUserSetting();
	return _user_setting.safe[key] || _default;
};

Pio.prototype.updateSafe = function(key, value){
	var _user_setting = this._getUserSetting();
	_user_setting.safe[key] = value;
	return this.saveUserSetting();
};


//// Secret API \\\\

Pio.prototype.loadSecret = function(){
	var self = this;
	var deferred = new jQuery.Deferred();
	deferred.resolve(self._getUserSetting().secret);
	return deferred.promise();
};

Pio.prototype.saveSecret = function(password, secret){
	if(this._getUserSetting().updateSecret(password, secret)){
		return this.saveUserSetting();
	} else {
		var deferred = new jQuery.Deferred();
		deferred.reject('Password ERROR.');
		return deferred.promise();
	}
};


//// Public Keys \\\\
Pio.prototype.getPublicKey = function(){
	return this._getUserSetting().public_keys;
};

Pio.prototype.loadPublicKey = function(type, user){
	var deferred = new jQuery.Deferred();
	var loadkey = function(setting){
		if(!setting.public_keys){
			deferred.reject("Public key is undefined.");
		}
		else if(type == "rsa"){
			deferred.resolve(setting.public_keys.rsa);
		} else if(type == "cpabe"){ //cpabe
			deferred.resolve(setting.public_keys.cpabe);
		} else {
			deferred.resolve(setting.public_keys);
		}
	};
	if(user){
		var abspath = WebFS.abspath(user, SETTING_FILENAME);
		this.loadObject(abspath).done(function(data){
			var obj = JSON.parse(data);
			loadkey(obj);
		}).fail(function(err){
			deferred.reject(err);
		});
	} else {
		loadkey(this._getUserSetting());
	}
	return deferred.promise();
};

Pio.prototype.savePublicKey = function(type, key){
	var setting = this._getUserSetting();
	if(!setting.public_keys) setting.public_keys = {};
	if(type == "rsa"){
		setting.public_keys.rsa = key;
	} else if(type == "cpabe"){ //cpabe
		setting.public_keys.cpabe = key;
	} else {
		setting.public_keys = key;
	}
	var deferred = new jQuery.Deferred();
	deferred.resolve(key);
	return deferred.promise();
};

Pio.prototype.cpabe_encrypt = function(options){
	var friendid = options.friendid // the public key is going to use,
	//leave empty to use current user cpabe pub key
	, data = options.data
	, enc_key = options.enc_key //Optional
	, policy = options.policy; // "String"

	var self = this
	, deferred = new jQuery.Deferred()
	, result = {friendid:friendid};

	if(enc_key){ // Encrypt without policy
		self.cpabe_decrypt({friendid:friendid, enc_key:enc_key}).done(function(result){
			result.friendid = friendid;
			if(data){
				result.cipher = sjcl.encrypt(result.aes_key, data);
			}
			deferred.resolve(result);
		});
		return deferred.promise();
	};

	var bar = function(){
		var aes_key = result.aes_key, enc_key = result.enc_key;
		if(data){
			result.cipher = sjcl.encrypt(aes_key, data);
		}
		deferred.resolve(result);
	};

	var cache_policy = self.getSafe("cpabe_cache_policy", {});
	if(cache_policy[policy]){
		var ret = cache_policy[policy];
		jQuery.extend(result, ret);
		bar();
		return deferred.promise();
	}

	self.loadPublicKey('cpabe', friendid).done(function(cpabe_pub_key){
		self.crypto.cpabe.cpabe_enc(cpabe_pub_key, policy).done(function(ret){
			jQuery.extend(result, ret);
			bar();
			self.cpabe_cache_key(result.enc_key, result.aes_key);
			cache_policy[policy] = ret;
			self.updateSafe("cpabe_cache_policy", cache_policy);
		}).fail(function(err){
			deferred.reject(err);
		});
	}).fail(function(err){
		deferred.reject(err);
	});
	return deferred.promise();
};

Pio.prototype.cpabe_cache_key = function(enc_key, aes_key){
	if(!enc_key){
		throw new Error('ERROR:cpabe_cache_key: enc_key cannot be null.');
	}
	var self = this;
	var hash_content = enc_key;
	var enc_key_hash = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(hash_content));


	var cache_keys = self.getSafe("cpabe_cache_keys", {});
	if(aes_key){
		cache_keys[enc_key_hash] = aes_key;
		self.updateSafe("cpabe_cache_keys", cache_keys);
		return aes_key;
	}
	return cache_keys[enc_key_hash];
};

Pio.prototype.cpabe_decrypt = function(options){
	var friendid = options.friendid
	, cipher = options.cipher
	, enc_key = options.enc_key
	, aes_key = null;

	var self = this
	, deferred = new jQuery.Deferred()
	, result = {enc_key: enc_key, friendid:friendid}
	, myid = this.getUsername();

	var process = function(){

		if(aes_key = self.cpabe_cache_key(enc_key)){
			result.aes_key = aes_key;
			if(cipher){
				try{
					result.data = sjcl.decrypt(aes_key, cipher);
				} catch(err){
					console.debug('Decrypt with cached key failed for', friendid, enc_key);
					deferred.reject(err);
					return;
				}
			}
			deferred.resolve(result);
			return; //deferred.promise();
		}

		self.loadSecret().done(function(secret){
			var self_cpabe_master_key = secret.cpabe_master_key;
			self.loadPublicKey('cpabe', friendid)
			.done(function(cpabe_pub_key){
				var priv_key = null;
				if(friendid == myid){
					priv_key = self_cpabe_master_key;
				} else {
					var detail = self.getFriendDetail(friendid);
					if(!detail) {
						deferred.reject('Cannot find friend detail.');
						return;
					}
					if(!detail.cpabe_private_key){
						deferred.reject('Cannot find the given cpabe_private_key from '+friendid);
						return;
					}
					priv_key = detail.cpabe_private_key;
				}
				self.crypto.cpabe.cpabe_dec(cpabe_pub_key, priv_key, enc_key).done(function(ret){
					aes_key = ret;
					result.aes_key = aes_key;
					if(cipher){
						try{
							result.data = sjcl.decrypt(aes_key, cipher);
						} catch(err){
							deferred.reject(''+err);
						}
					}
					self.cpabe_cache_key(enc_key, aes_key);
					deferred.resolve(result);
				}).fail(function(err){
					deferred.reject(err);
				});
			}).fail(function(err){
				deferred.reject(err);
			});
		}).fail(function(err){
			deferred.reject(err);
		});
	};

	var prepare_process = function(){
		if(self._cpabe_decryptings[enc_key]){
			var _deferred = self._cpabe_decryptings[enc_key];
			_deferred.done(function(){
				process();
			}).fail(function(){
				prepare_process();
			});
		} else {
			self._cpabe_decryptings[enc_key] = deferred;
			deferred.always(function(){
				delete self._cpabe_decryptings[enc_key];
			});
			process();
		}
	};

	prepare_process();

	return deferred.promise();
};


//// Friends Profile API \\\\

/**
 * Sync safe.friends to friendship.friend_list, for Friends of Friends
 */
Pio.prototype.syncFriendList2 = function(){
	var self = this;
	var my_id = self.getUsername();
	var cache_policy = self.getSafe("cpabe_cache_policy", {});
	var all_policy = cache_policy['@@'];
	if(!all_policy) {
		log.debug('syncFriendList: Cache policy @@ not found.');
		return;
	}
	var aes_key = all_policy.aes_key;
	var lst = self.listFriends();
	var friend_list = self._user_setting.friendship.friend_list || [];
	if(!jQuery.isArray(friend_list) && friend_list.cipher){
		friend_list = sjcl.decrypt(aes_key, friend_list.cipher);
		friend_list = JSON.parse(friend_list);
	} else { friend_list = [];}
	var obj = {};
	lst.forEach(function(id){
		obj[id] = true;
	});
	friend_list.forEach(function(id){
		delete obj[id];
	});
	var count = 0;
	for(var id in obj) count++;
	if(count){
		friend_list = lst;
		friend_list = JSON.stringify(friend_list);
		self.cpabe_encrypt({friendid: my_id, data:friend_list, policy:"@@"})
		.done(function(tmp){
			friend_list = {enc_key: tmp.enc_key, cipher: tmp.cipher};
			self._user_setting.friendship.friend_list = friend_list;
			self.saveUserSetting();
			self.log('syncFriendList: friend_list updated.');
		})
		.fail(function(){
			log.error('syncFriendList: cpabe_encrypt fail.');
		});
	} else{	
		self.log('syncFriendList: No changes.');
	}
};

Pio.prototype.syncFriendList = function(){
	var self = this;
	var lst = self.listFriends();
	var friend_list = self._user_setting.friendship.friend_list || [];
	friend_list = lst;
	self._user_setting.friendship.friend_list = friend_list;
	self.saveUserSetting();
};

Pio.prototype.getFriendsOfFriends = function(){
	var self = this;
	var lst = self.listFriends(true);
	var result = {};
	var count = 0;
	var deferred = new jQuery.Deferred();
	var addOne = function(){
		if(++count == lst.length){
			deferred.resolve(result);
		}
	};
	lst.forEach(function(id){
		self.loadPublicProfile(id).done(function(profile){
			result[id] = profile.friend_list.slice();
			addOne();
		}).fail(function(tmp){
			log.error('getFriendsOfFriends ERROR for user:', id, tmp);
			result[id] = [];
			addOne();
		});
	});
	if(lst.length == 0){
		deferred.resolve(result);
	}
	return deferred.promise();
};

Pio.prototype.sendFOFMessage = function(dest, msg, via_friends){
	// Send friends of friends request
	var self = this;
	var my_id = self.getUsername();
	var receivers = [];
	
	var send_via_receivers = function(){
		var pack = {destination: dest, source: my_id, 
				msg: msg, timestamp: getTime(), fof_msgid: UUID.create()};
		receivers.forEach(function(r){
			self.postMessage("FOF", r, pack);
			log.debug('sendFOFMessage: send to',r,pack);
		});
	};
	
	if(via_friends){
		receivers = via_friends;
		send_via_receivers();
	} else {		
		self.getFriendsOfFriends().done(function(users){
			for(var user in users){
				var lst = users[user];
				if(lst.indexOf(dest)>=0){
					receivers.push(user);
				}
			}
			send_via_receivers();
		});
	}
};

Pio.prototype._FOFMessages_inbox = {};
Pio.prototype.checkFOFMessage = function(){
	var self = this;
	var deferred = jQuery.Deferred(), count_done = 0;
	self.pullMessage("FOF")
//	self.pullMessage("FOF", null, true)
	.done(function(msg){
		var lst_msg = [];
		if (jQuery.isArray(msg)){
			lst_msg = msg;
		} else {
			lst_msg = [msg];
		}
		var received_msgs = [];
		lst_msg.forEach(function(msg){
			var my_id = self.getUsername();
			var dst = msg.message.destination;
			log.debug('checkFOFMessages', msg);
			if(!dst){
				log.error("checkFOFMessages ERROR: Message broken, no destination.");
//				deferred.reject("checkFOFMessages ERROR: Message broken, no destination.");
				return;
			}else{
				var mid = msg.message.source + "+" + msg.message.timestamp;
				if(self._FOFMessages_inbox[mid])return; // already processed
				self._FOFMessages_inbox[mid] = msg;
				if(dst == my_id){
					var text = msg.message.source+" sent you a request: "+msg.message.msg;
//					self.notify({message:text, auto_dispose:false});
					received_msgs.push({message:text, auto_dispose:false});
//					deferred.resolve(msg.message);
				}else{
					log.debug("checkFOFMessages: Relay message.", msg);
					self.postMessage("FOF", dst, msg.message);
//					deferred.resolve();
				}
			}
			self.deleteMessage("FOF", msg);
		});
		deferred.resolve(received_msgs);
		
	})
	.fail(function(err){
		log.error('checkFOFMessages ERROR:', err);
		deferred.reject(err);
	});
	return deferred.promise();
};

Pio.prototype.saveFOFMessage = function(msgs){
	var self = this;
	var fof_message = self.getSafe('fof_message', []);
	msgs.forEach(function(item){
		fof_message.push(item);
	});
	self.updateSafe('fof_message', fof_message);
};

Pio.prototype.loadFOFMessage = function(){
	var self = this;
	var fof_message = self.getSafe('fof_message', []);
	return fof_message;
};

Pio.prototype.clearFOFMessage = function(){
	var sefl = this;
	self.updateSafe('fof_message', []);
};

Pio.prototype.listFriends = function(exclude_pending){
	var lst = [];
//	for(var i in this._getUserSetting().friendship.friends){
//		lst.push(i);
//	}
	var self = this;
	var friends = self.getSafe('friends', {});
	jQuery.each(friends, function(i, value){
		if(exclude_pending && value.status=="pending") return;
		lst.push(i);
	});
	return lst;
};

Pio.prototype.getFriendDetail = function(friendid){
	var self = this;
	var friends = self.getSafe('friends', {});
	var f = friends[friendid];
	if(f){
		var ff = jQuery.extend({id:friendid}, f);//{id: friendid, status: f.status, policy: f.policy, aes_key:'', cpabe_private_key: ""};
		return ff;
	}
	return null;
};

Pio.prototype.getFriendPolicyTags = function(){
	var self = this;
	var friends = self.getSafe('friends', {});
	var tags = [];
	jQuery.each(friends, function(i, friend){
		jQuery.each(friend.policy, function(ii, tag){
			if(tags.indexOf(tag) < 0){
				tags.push(tag);
			}
		});
	});
	return tags;
};

Pio.prototype.addFriend = function(friendid, policy_tags){
	if(!friendid) throw new Error("friendid cannot be null.");
	var deferred = new jQuery.Deferred();
	var self = this;

	var t0 = getTime();
	var friends = self.getSafe('friends', {});
	var cpabe_private_key = "";

	self.loadSecret().done(function(secret){
		var pub_key = self.getPublicKey().cpabe;
		var master_key = secret.cpabe_master_key;
		var policy = policy_tags.join(' ');
		log.debug('addFriend: generating cpabe private key for', friendid, "@", policy);
		self.crypto.cpabe.cpabe_get_private_key(pub_key, master_key, policy).done(function(key){
			log.debug("addFriend: @"+friendid+"'s private key has generated successfully. Key ID:" + md5(key));
			log.debug("@"+friendid+"'s cpabe_private_key is", key);
			deferred.notify("addFriend: @"+friendid+"'s private key has generated successfully. Key ID:" + md5(key));
			cpabe_private_key = key;
			var friend = {aes_key:null, status:"pending", policy:policy_tags, cpabe_private_key:null};
			friends[friendid] = friend;

			var initiateFriendShip = function(){
				var aes = generateRandomPassword();
				self.postMessage("privio", friendid, {type:"addFriend", aes_key:aes, cpabe_private_key:cpabe_private_key});
				friend.aes_key = aes;
				self.updateSafe("friends", friends);
				self.log('initiateFriendShip', friendid, getTime()-t0, policy);
				deferred.resolve('Waiting response');
				self.sendFOFMessage(friendid, "I want to add you as my friend. My Friend ID is "+self.getUsername());
			};

			var acceptFriendShip = function(){
				self.postMessage("privio", friendid, {type:"addFriend", aes_key:friend.aes_key, cpabe_private_key:cpabe_private_key});
				self.log('acceptFriendShip', friendid, getTime()-t0, policy);
				self.syncFriendList();
			};

			deferred.notify('Checking friend messages.');
			self.pullMessage('privio', [friendid]).done(function(messages){
				log.debug('addFriend: Got messages from', friendid, messages);
				var confirm = false;
				messages.forEach(function(msg){
					var _msg = msg.message;
					if(_msg.type == "addFriend"){
						friend.aes_key = _msg.aes_key;
						friend.cpabe_private_key = _msg.cpabe_private_key;
						friend.status = 'ok';
						confirm = true;
						acceptFriendShip();
					};
				});
				if(confirm){
					deferred.notify('Got message. Accepting friendship request.');
					self.updateSafe("friends", friends);
					deferred.resolve('You are now friends with '+friendid);
				} else {
					deferred.notify('Sending friendship request.');
					initiateFriendShip();
				};
			}).fail(function(){
				log.debug('addFriend: Got messages fail from', friendid);
				deferred.notify('Did not found message. Sending friendship request.');
				initiateFriendShip();
			});
			self.updateSafe("friends", friends);
		}).fail(function(){
			deferred.reject('CPABE key generation error.');
		});
	}).fail(function(){
		deferred.reject('Load "secret" error.');
	});

	return deferred.promise();
};

Pio.prototype.refreshPendingFriends = function(){
//	if(!friendid) throw new Error("friendid cannot be null.");
	var deferred = new jQuery.Deferred();
	var self = this;

	var friends = self.getSafe('friends', {});

	var lst_friends = self.listFriends();
	var updated_friends = [];

	if(lst_friends.length == 0){
		deferred.resolve(updated_friends);
	};

	var process_num = 0;
	var process = function(){
		if(++process_num == lst_friends.length){
			if(updated_friends.length){
				self.updateSafe('friends', friends);
//				self.saveUserSetting();

			}
			deferred.resolve(updated_friends);
		}
	};

	lst_friends.forEach(function(friendid){
		var detail = self.getFriendDetail(friendid);
		if(detail.status != "pending") {
			process(friendid);
			return;
		}
		var friend = friends[friendid];

		var t0 = getTime();
		self.pullMessage('privio', [friendid]).done(function(messages){
			log.debug('refreshPendingFriends: Got messages from', friendid, messages);
			messages.forEach(function(msg){
				var _msg = msg.message;
				if(_msg.type == "addFriend"){
					friend.aes_key = _msg.aes_key;
					friend.cpabe_private_key = _msg.cpabe_private_key;
					friend.status = 'ok';
					updated_friends.push(friendid);
					self.log('refreshPendingFriends', friendid, getTime()-t0);
				}
			});
			process();
		}).fail(function(){
			log.debug('refreshPendingFriends: Got messages fail from', friendid);
			process();
		});
	});
	return deferred.promise();
};

Pio.prototype.removeFriend = function(friendid){
	var self = this;
	if(!this._user_setting.safe) return;

	if(this._user_setting.safe.friends)
		delete P.pio._user_setting.safe.friends[friendid];
	if(this._user_setting.safe.message)
		delete P.pio._user_setting.safe.message[friendid];

	self.loadObject("friends/"+friendid).done(function(data){
		log.debug('Found friend exchange file, cleaning...');
		self.saveObject("friends/"+friendid, "null").done(function(){
			log.debug('Cleaning successfully. ');
		}).fail(function(error){
			log.debug('Cleaning fail. ', error);
		});
	}).fail(function(){
		log.error('Not Found friend exchange file.');
	});

	this.saveUserSetting();
};


//Pio.prototype._interpreteSystemMessage


// Friends Communication API \\\\

Pio.prototype._getSafeFriendMessage = function(friend){
	var safe_message = this.getSafe("message", {});
	var safe_friend_message = safe_message[friend];
	if(!safe_friend_message){
		safe_friend_message = {ack:0, time:0, cache:[]};
		safe_message[friend] = safe_friend_message;
	}
	var _user_setting = this._getUserSetting();
	_user_setting.safe['message'] = safe_message;
	return safe_friend_message;
};

Pio.prototype.postMessage = function(appid, receiver, message){
	var self = this;
	var friends = self.listFriends(),
		deferred = new jQuery.Deferred();

	var _saveFriendExchangeMessage = function(deferred, obj, appid, receiver, message){
		obj = obj || {rev:0, ack:0, time:0, messages:[]};
		var _time = getTime();
		var msg = {time: _time,
				date: new Date()+"",
				uuid: UUID.create(),
				from: self.getUsername(),
				to: receiver,
				appid: appid,
				message: message};
		var safe_friend_message = self._getSafeFriendMessage(receiver);
		obj.ack = safe_friend_message.ack;
		obj.rev ++;
		obj.time = _time;
		obj.messages.push(msg);
		var s_obj = JSON.stringify(obj);
		self.saveObject("friends/"+receiver, s_obj).done(function(){
			deferred.resolve();
		}).fail(function(error){
			deferred.reject(error);
		});
	};

	var _post = function(){
		self.loadObject("friends/"+receiver).done(function(data){
			var obj = JSON.parse(data);
			_saveFriendExchangeMessage(deferred, obj, appid, receiver, message);
		}).fail(function(error){
			_saveFriendExchangeMessage(deferred, null, appid, receiver, message);
		});
	};

	if(friends.indexOf(receiver) < 0){
		deferred.reject(new Error('receiver is not one of the friends.'));
	}else{
		message = JSON.stringify(message);
		var aes = self.getFriendDetail(receiver).aes_key;
		if(aes){
			message = sjcl.encrypt(aes, message);
			_post();
		}else{
			self.loadPublicKey("rsa", receiver).done(function(rsa_pub_key){
				self.crypto.rsa.encrypt(message, rsa_pub_key).done(function(cipher){
					log.debug('RSA encryption status is', cipher.status);
					message = cipher.cipher;
					_post();
				}).fail(function(err){log.debug(err);});
			}).fail(function(err){
				deferred.reject(err);
			});
		}

	}
	return deferred.promise();
};

Pio.prototype.pullMessage = function(appid, lst_friends, cache_only){
	var self = this;
	var cache_only = cache_only || false; // only check cached message
	var ack_update_list = [], myusername = self.getUsername(),
		friends = lst_friends || self.listFriends(),
		deferred = new jQuery.Deferred(),
		finish_list = [];
//		safe_messages = {};

	var finish = function(f){
		finish_list.push(f);
		if(finish_list.length == friends.length){
			var received_messages = [];
			friends.forEach(function(friend){
				var safe_friend_message = self._getSafeFriendMessage(friend);//safe_messages[friend];
				var cache_msgs = [];
				safe_friend_message.cache.forEach(function(msg){
					if(msg.appid == appid){
						received_messages.push(msg);
						if(['FOF'].indexOf(msg.appid) >= 0){
							cache_msgs.push(msg);
						}
					} else {
						cache_msgs.push(msg);
					}
				});
				safe_friend_message.cache = cache_msgs;
			});
//			self.updateSafe("message", safe_messages).done(function(){
			self.saveUserSetting().done(function(){
				var processed_num = 0;
				var decrypted_messages = [];
				var addProcess = function(msg){
					processed_num ++;
					if(processed_num == received_messages.length){
						// TODO:sort before deliver
						deferred.resolve(decrypted_messages);
					}
				};
				var addDecrypted = function(msg){
					decrypted_messages.push(msg);
					addProcess(msg);
				};
				var addFail = function(msg){
					addProcess(msg);
				};
				self.loadSecret().done(function(secret){
					received_messages.forEach(function(msg){
						log.debug("pullMessage: decrypting msg", msg);
						var aes = self.getFriendDetail(msg.from).aes_key;
						if(aes){
							try{
								msg.message = sjcl.decrypt(aes, msg.message);
								msg.message = JSON.parse(msg.message);
								addDecrypted(msg);
								log.debug("pullMessage: decrypted msg by aes", msg);
							} catch(e){
								addFail(msg);
							}
						} else {
							self.crypto.rsa.decrypt(msg.message, secret.rsa_key).done(function(_msg){
								log.debug('RSA cipher status', _msg.status);
								if(_msg.status == 'failure'){
									addFail(msg);
									return;
								}

								var obj = JSON.parse(_msg.plaintext);
								msg.message = obj;
//								msg.message = JSON.parse(msg.message);
								addDecrypted(msg);
								log.debug("pullMessage: decrypted msg by rsa", msg);
							}).fail(function(err){
								log.debug(err);
								addFail(msg);
							});

						}
					});
				}).fail(function(){
					deferred.reject("Load secret RSA key fail.")
				});

				if(received_messages.length ==0){
					deferred.resolve([]);
				}

//				deferred.resolve(received_messages);
			}).fail(function(error){
				deferred.reject(error);
			});
		}
	};

	friends.forEach(function(friend){
		var safe_friend_message = self._getSafeFriendMessage(friend);
//		safe_messages[friend] = safe_messages;
		if(cache_only){
			finish(friend);
			return;
		}

		self.loadObject("/"+friend+"/friends/"+myusername).done(function(data){
			var obj = JSON.parse(data);
			if(obj == null){
				finish(friend);
				return;
			}
			if(safe_friend_message.ack != obj.rev){
				var _time = safe_friend_message.time;
				safe_friend_message.time = obj.time;
				safe_friend_message.ack = obj.rev;
				obj.messages.forEach(function(msg){
					if(msg.time > _time){
						safe_friend_message.cache.push(msg);
					}
				});
				// postpone update ack till postMessage.
				ack_update_list.push([friend, safe_friend_message]);
			} //else no new message, pass
			finish(friend);
		}).fail(function(error){
			finish(friend);
		});

	});
	return deferred.promise();
};

Pio.prototype.deleteMessage = function(appid, msg){
	var self = this;
	var friend = msg.from;
	var safe_friend_message = self._getSafeFriendMessage(friend);
	var cache_msgs = [];
	var need_update = false;
	safe_friend_message.cache.forEach(function(m){
		if(m.uuid != msg.uuid){
			cache_msgs.push(m);
		} else {
			need_update = true;
		}
	});
	safe_friend_message.cache = cache_msgs;
	if(need_update){
		self.saveUserSetting();
	}
};

//// UI Notification API \\\\

Pio.prototype.notify = function(alert){
	FloatNotification.show(alert);
};

Pio.prototype.openlink = function(invoker, url){
	window.open(url, "_blank");
};


//// Flash AJAX \\\\

Pio.prototype.flashAjax = function(url, setting){
	var _deferred = FlashURL.ajax(url, setting);
	var deferred = new jQuery.Deferred();

	_deferred.done(function(ret){
		deferred.resolve(ret.loader.getData());
	}).fail(function(){
		delete evt.loader;
		deferred.reject(evt);
	});

	return deferred.promise();
};


//// Remote Serverside Logging \\\\

Pio.RemoteLogging = function(){
	var self = this;
	var getTime = function(){
		return new Date().getTime();;
	};
	var last_used_time = getTime();
	var buffer = [];
	var _enable = true;

	self.log = function(){
		var params = toArray(arguments);
		var d = new Date();
		var t = d.format("yyyy-mm-dd'T'HH:MM:ss.l Zo ")+d.getTime();
		params.unshift(t);
		buffer.push(params);
		last_used_time = getTime();
		console.log("RemoteLogging:",params)
	};

	self.getBuffer = function(){
		return buffer;
	};

	self.enable = function(val){
		if(typeof val !== 'undefined'){
			_enable = !!val;
		}
		return _enable;
	};

	// Interval log sending
	setInterval(function(){
		if(!self.enable()) return;
		if(buffer.length <= 0) return;
		var now = getTime();
		if(now - last_used_time < REMOTE_LOGGING_COOLDOWN) return;

		var data = JSON.stringify(buffer);
		jQuery.post(REMOTE_LOGGING_URL, data);
		console.log('RemoteLogging:', 'Post', buffer.length, "logs to server.");
		buffer = [];

	}, REMOTE_LOGGING_INTERVAL);

	return self;
};

Pio._remoteLogging = new Pio.RemoteLogging();

Pio.log = function(){
	var args = toArray(arguments);
	var username = null;
	args.unshift(username);
	return Pio._remoteLogging.log.apply(null, args);
};

Pio.prototype.log = function(type){
	var args = toArray(arguments);

	if(type && type == 'loadFeeds' && this.finish_first_loadFeeds_time == 0){
		this.finish_first_loadFeeds_time = getTime();
		var ts = this.finish_first_loadFeeds_time - this.begin_login_time;
		this.log('finishFirstFeedLoad', ts, args);
	}

	var username = this.getUsername();
	args.unshift(username);
	return Pio._remoteLogging.log.apply(null, args);
};


////Statistic \\\\

Pio.stat = (function(){
	var self = {};
	
	self._working_action = {};
	
	var Action = function(name){
		var _self = {};
		_self.begin_time = getTime();
		_self.finish_time = 0;
		_self.duration = 0;
		_self.name = name;
		return _self;
	};
	
	self.begin = function(action){
		var act = Action(action);
		self._working_action[action] = act;
		return act;
	};
	
	self.finish = function(action){
		var act = self._working_action[action];
		if(act){
			act.finish_time = getTime();
			act.duration = act.finish_time - act.begin_time;
			Pio.log("STAT", act.name, act.finish_time, act.duration);
			delete self._working_action[action];
		}
	};
	
	return self;
})();

Pio.prototype.stat_begin = function(action){
	log.debug("stat_begin", action);
	Pio.stat.begin(action);
};

Pio.prototype.stat_finish= function(action){
	log.debug("stat_finish", action);
	Pio.stat.finish(action);
};

