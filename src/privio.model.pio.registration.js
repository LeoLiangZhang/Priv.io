// url = 'http://s3.amazonaws.com/privio/api.html';


Pio.registration = (function(){

	var __subfs = null;

	var websiteConf = '<WebsiteConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">\n\
	    <IndexDocument>\n\
	<Suffix>index.html</Suffix>\n\
	</IndexDocument>\n\
	<ErrorDocument>\n\
	<Key>error.html</Key>\n\
	</ErrorDocument>\n\
	</WebsiteConfiguration>';

	var ACL = "public-read";

	var remote_html = null;

	var crypto = Pio.crypto;

	function getBucketPolicy(bucketname){
		var policy = '{\n\
			"Version": "2008-10-17",\n\
			"Statement": [\n\
				{\n\
					"Sid": "PublicReadForGetBucketObjects",\n\
					"Effect": "Allow",\n\
					"Principal": {\n\
						"AWS": "*"\n\
					},\n\
					"Action": "s3:GetObject",\n\
					"Resource": "arn:aws:s3:::devprivio/*"\n\
				}\n\
			]\n\
		}';

		return policy.replace('devprivio', bucketname);
	}

	var mixin = {
			create: function(access_key, access_secret, bucket, acl){
				var s3 = new S3();
				s3.type = S3.SLASH;
				var settings = s3.auth(access_key, access_secret)
				.bucket(bucket).create(acl);
				settings.dataType = "text";
				return this.ajax(settings);
			},

			policy: function(access_key, access_secret, bucket, policy){
				var s3 = new S3();
				s3.type = S3.SLASH;
				var settings = s3.auth(access_key, access_secret)
				.bucket(bucket).policy(policy);
				settings.dataType = "text";
				return this.ajax(settings);
			},

			website: function(access_key, access_secret, bucket, website){
				var s3 = new S3();
				s3.type = S3.SLASH;
				var settings = s3.auth(access_key, access_secret)
				.bucket(bucket).website(website);
				settings.dataType = "text";
				return this.ajax(settings);
			},

			putObjectEx: function(access_key, access_secret, bucket, path, data, content_type){
				var s3 = new S3();
				s3.type = S3.SLASH;
				var s3obj = s3.auth(access_key, access_secret)
									.bucket(bucket).object(path);
				var settings = s3obj.put(data, content_type);
				return this.ajax(settings);
			}
	};

	var getSubFS = function(){
		if(!__subfs){
			var connection = new CrossDomainRequest(true);
			var subfs = new SubFS(connection);
			var url = 'http://s3.amazonaws.com/privio/remote.html';
			connection.connect(url);
			__subfs = subfs;
			$.extend(subfs, mixin);
		}
		return __subfs;
	};

	var loadApiHTML = function(){
		var deferred = new jQuery.Deferred();
		if(remote_html){
			deferred.resolve(remote_html);
		}else{
			$.ajax(REMOTE_FILENAME).done(function(data){
				remote_html = data;
				deferred.resolve(remote_html);
			}).fail(function(err){
				deferred.reject(err);
			});
		}
		return deferred.promise();
	};

	var reg = function(options){
		var subfs = getSubFS()
		, deferred = new jQuery.Deferred()
		;
		var access_key = options.access_key
		, access_secret = options.access_secret
		, username = options.username
		, password = options.password
		, email = options.email
		, passphrase = options.passphrase
		;

		passphrase = passphrase || generateRandomPassword();

		var bucket = username+".priv.io";

		var notify = function(msg){
			deferred.notify(msg);
		};

		var setting_data = '',
		user_setting = new UserSetting();

		var setupBucket = function(){
			loadApiHTML().done(function(remote_html){
				subfs.create(access_key, access_secret, bucket, ACL).done(function(){
					notify('Bucket created.');
					var r1 = subfs.policy(access_key, access_secret, bucket, getBucketPolicy(bucket))
					, r2 = subfs.website(access_key, access_secret, bucket, websiteConf)
					, r3 = subfs.putObjectEx(access_key, access_secret, bucket, REMOTE_FILENAME, remote_html, 'text/html; charset=UTF-8')
					, r4 = subfs.putObjectEx(access_key, access_secret, bucket, SETTING_FILENAME, setting_data, 'text/plain; charset=UTF-8')
					;
					jQuery.when(r1, r2, r3, r4).done(function(){
						$.ajax("/service/reg/"+username);
						deferred.resolve();
					}).fail(function(e1, e2, e3, e4){
						log.debug("ERROR: Exceptions in creating bucket.", e1, e2, e3, e4);
						deferred.reject('ERROR: Exceptions in creating bucket.');
					});

				}).fail(function(err){
					deferred.reject('ERROR: Cannot create bucket. '+err);
				});

			}).fail(function(err){
				deferred.reject('ERROR: Cannot fetch "api.html". ' + err);
			});
		};

		notify('Generating CPABE Keys.');
		crypto.cpabe.cpabe_setup().done(function(ret){
			notify('Finished generating CPABE Keys.');
			var cpabe = ret;
			notify('Generating RSA Keys.');
			crypto.rsa.generateRSAKey(passphrase, RSA_KEY_BITS).done(function(ret){
				notify('Finished generating RSA Keys.');
				var rsa = ret;
				crypto.rsa.publicKeyString(rsa).done(function(rsa_pub_key){
					user_setting.initSetting(
							username, password,
							access_key, access_secret,
							cpabe, passphrase, rsa, rsa_pub_key);
					setting_data = user_setting.toJSONString();
					setupBucket();
				});
			});
		});

		return deferred.promise();
	};

	return reg;
})();
