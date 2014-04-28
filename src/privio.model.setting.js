/*
== User Setting Structure ==

{
    "username": "<current_username>",
    "profile": {
        "name": "<current user full name>",
        "img": "<current user profile image>"
    },
    "friendship": {
        "friends": {
            "<friend_username_0>": {},
            ...
        }
    },
    "public_keys": {
    	"rsa": "",
    	"cpabe": ""
    },
    "secret": {
        "storage_provider": "AmazonS3", // Only support Amazon S3 at present
        "access_key": "<Amazon S3 Access Key>",
        "access_secret": "<Amazon S3 Access Secret>",
        "safe_key": "password", // Use to decrypt the "safe",
        "rsa_passphrase": "",
        "rsa_key":"",
        "cpabe_master_key": ""
    },
    "safe": {
        "friends": {
            "<friend_username_0>": {aes_key:"<friend encryption key>"
            						,status:<"pending", "ok">
            						,policy:[]
            						}

        },
        "message":{
        	"<friend_username_0>":{ack:0, time0,
        							cache:[Message0, Message1...]
        							}
			// Message is one of
			// {time:0, date:"", from:"", to:"", appid:"", message:{}},
        }
    }
}
*/
var UserSetting = function(username){
	this.user_setting_ver = "0.8";
	this.username = username;
	this.profile = {name: "", img: ""};
	this.friendship = {
			friends: {}, // obsolete 
			friend_list:[]
			};
	this.public_keys = {rsa: "", cpabe: ""};
	this.secret = {
			storage_provider: "AmazonS3",
			access_key:"", access_secret:"",
			safe_key:"",
			rsa_passphrase: "",
			rsa_key:"",
	        cpabe_master_key: ""};
	this.raw_secret = "";
	this.safe = {friends:{}, message:{}};
};

UserSetting.prototype.shadow = function(){ // To prevent user modified kenerl structure.
	return jQuery.extend({}, this.profile);
};

UserSetting.prototype.load = function(data, password){
	var obj = JSON.parse(data);
	var secret = obj.secret;
	if(secret){
		var decryptedSecret = null, safe = null;
		try{
			decryptedSecret = sjcl.decrypt(password, secret);
			decryptedSecret = JSON.parse(decryptedSecret);
			log.debug('LOGIN: Decrypt secret successfully.');
			safe = sjcl.decrypt(decryptedSecret.safe_key, obj.safe);
			safe = JSON.parse(safe);
			log.debug('LOGIN: Decrypt safe vault successfully.');

		} catch (e){
			log.error('Decrypt '+this.username+' secret error.');
//			throw new Error(e); // will cause unnecessary try/catch block
			return false;
		}

		if(decryptedSecret){
			// init profile
			this.user_setting_ver = obj.user_setting_ver;
			this.secret = decryptedSecret;
			this.profile = obj.profile;
			this.friendship = obj.friendship;
			this.public_keys = obj.public_keys;
			this.raw_secret = secret;
			this.safe = safe;

			return true;
		}
	} else {
		log.error('DATA_BROKEN: The "setting" file miss the "secret" section.');
	}
	return false;
};

UserSetting.prototype.updateSecret = function(password, secret){
	var raw_secret = this.raw_secret;
	try{
		sjcl.decrypt(password, raw_secret);
		var data = JSON.stringify(secret);
		this.raw_secret = sjcl.encrypt(password, data);
		this.secret = secret;
		return true;
	} catch (e){
		log.error('Decrypt '+this.username+' secret error.');
	}
	return false;
};

UserSetting.prototype.initSetting = function(username, password, access_key, access_secret, cpabe, passphrase, rsa, rsa_pub_key){
	this.username = username;
	this.public_keys = {rsa: rsa_pub_key, cpabe: cpabe.pub_key};
	this.secret.access_key = access_key;
	this.secret.access_secret = access_secret;
	this.secret.safe_key = generateRandomPassword();
	this.secret.rsa_passphrase = passphrase;
	this.secret.rsa_key = rsa;
	this.secret.cpabe_master_key = cpabe.master_key;

	// do encryption
	var data = JSON.stringify(this.secret);
	this.raw_secret = sjcl.encrypt(password, data);
};

UserSetting.prototype.updateProfile = function(profile){
	this.profile = profile;
};

UserSetting.prototype.toJSONString = function(){
	return JSON.stringify({
		user_setting_ver: this.user_setting_ver,
		username : this.username,
		profile : this.profile,
		friendship : this.friendship,
		public_keys : this.public_keys,
		secret : this.raw_secret,
		safe: sjcl.encrypt(this.secret.safe_key, JSON.stringify(this.safe))
	});
};
