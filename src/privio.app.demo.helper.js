P.saveObjectEx = function(abspath, data, meta){
	var deferred = new jQuery.Deferred();
	var friendid = meta.friendid, policy = meta.policy, enc_key = meta.enc_key;
	var t0 = new Date().getTime();
	P.cpabe_encrypt({data:data, policy:policy, friendid:friendid, enc_key:enc_key}).done(function(result){
		var cipher = result.cipher;
		enc_key = result.enc_key;
		var value = {enc_key: enc_key, friendid: friendid, cipher: cipher};
		var text = JSON.stringify(value);
		P.saveObject(abspath, text, meta).done(function(ret){
			deferred.resolve(value);
		}).fail(function(err){
			deferred.reject(err);
		}).always(function(){
			var t1 = new Date().getTime();
			P.log('saveObjectEx', abspath, t1-t0, data.length, cipher.length, text.length);
		});
	}).fail(function(err){
		deferred.reject(err);
	});
	return deferred.promise();
};

P.loadObjectEx = function(abspath){
	var deferred = new jQuery.Deferred();

	P.loadObject(abspath).done(function(value){
		var obj = JSON.parse(value);
		var cipher = obj.cipher;
		var friendid = obj.friendid;
		var enc_key = obj.enc_key;
		P.cpabe_decrypt({friendid:friendid, enc_key:enc_key, cipher:cipher}).done(function(ret){
			deferred.resolve(ret.data, ret);
		}).fail(function(err){
			deferred.reject(err);
		});
	}).fail(function(err){
		deferred.reject(err);
	});

	return deferred.promise();
};