//#import privio.message.rpc.js

// iPad Compatibility
!!function(){if(!this.Float64Array && this.Float32Array) return this.Float64Array = this.Float32Array;}();

importScripts('crypto_worker_imports.js');


var time = function(func, args){
	  var t0 = new Date().getTime();
	  var result;
	  if(args) result = fund.apply(null, args);
	  else result = func();
	  t1 = new Date().getTime();
//	  messagerpc.apply('console_log', [""+func.valueOf(), 'Time elapse (ms):', t1-t0]);

	  return {time: t1-t0, result: result};
};

/*
Here's how you use it.

- First, you need to load the C functions into the JS namespace.  You do this by running

cpabe_setup = cwrap('cpabe_setup', ['string', 'string']);
cpabe_get_private_key = cwrap('cpabe_get_private_key', 'string', ['string', 'string', 'string']);
cpabe_enc = cwrap('cpabe_enc', ['string', 'string'], ['string', 'string']);
cpabe_dec = cwrap('cpabe_dec', 'string', ['string', 'string', 'string']);

Now you can use the library.  To do so, you do a couple of steps. Note that all keys, etc, are base64 encoded by me, so you don't need to worry about anything.

- For each user, one time only, you need to generate a public key and a master key,  You do this by calling

a = cpabe_setup();

as a result a[0] is your public key and a[1] is your master key.

- For each friend of the user, you need to generate a private key.  You do this by calling

b = cpabe_get_private_key(public, master, attributes);

where public and master are the keys you generated before, and the third argument is a list of that user's attributes (space separated -- e.g.  "liang friend family colleague ...").  The return value b is the private key that you should give to the friend.

- Now, I will generate you an AES key if you want to encrypt something.  To do so, call

c = cpabe_enc(public, policy);

where public is the public key and policy is who should be able to access it (e.g., "friend and family", "liang or family").  The return value is an array of two keys.  c[0] is the AES key that you should use to encrypt the object (or should hash to generate your AES key, it doesn't matter).  c[1] is the encrypted version of the AES key. You should share c[1] along with the object.  (Note that we should probably cache these keys as this will save much of the expense.  There's no need to re-generate a key if the policy is the same as a previous one)

- Finally, when the friend wants to decrypt the object, he needs the AES key.  To get it, he will run

c = cpabe_dec(public, private, enc_key);

where public is my (the originator's) public key, private is his private key handed to him by the originator, and enc_key is the encrypted version of the AES key from before.  It will either return the decrypted key, or will return a string that's mostly AAAAA (if the user isn't allowed; I'll catch this in a future version and return "").

That's it!  If you want to check it out in the browser, load the JS, call the cwrap() lines above, and then run

a = cpabe_setup();
b = cpabe_get_private_key(a[0], a[1], "test bar");
c = cpabe_enc(a[0], "bar");
d = cpabe_dec(a[0], b, c[1]);

You'll note that d has the same value as c[0].  You're good to go!

 */

cpabe_setup = Module.cwrap('cpabe_setup', ['string', 'string']);
cpabe_get_private_key = Module.cwrap('cpabe_get_private_key', 'string', ['string', 'string', 'string']);
cpabe_enc = Module.cwrap('cpabe_enc', ['string', 'string'], ['string', 'string']);
cpabe_dec = Module.cwrap('cpabe_dec', 'string', ['string', 'string', 'string']);


var log_time = function(type, ret, comments){
	messagerpc.apply('log_time', [type, ret.time, comments]);
};

var myfunctions = {};
myfunctions.cpabe_setup = function(){
//	var ret = time(function(){return cpabe_setup();});
//	var result = ret.result;
//	return {pub_key: result[0], master_key: result[1]};
	var ret = time(function(){
		var result = cpabe_setup();
		return {pub_key: result[0], master_key: result[1]};
	});
	log_time('cpabe_setup', ret);
	return ret.result;
};
myfunctions.cpabe_get_private_key = function(pub_key, master_key, attributes){
//	var ret = time(function(){return cpabe_get_private_key(pub_key, master_key, attributes);});
//	var result = ret.result;
//	return result; // priv_key
	var ret = time(function(){
		return cpabe_get_private_key(pub_key, master_key, attributes);
	});
	log_time('cpabe_get_private_key', ret, attributes);
	return ret.result;
};
myfunctions.cpabe_enc = function(pub_key, policy){
//	var ret = time(function(){return cpabe_enc(pub_key, policy);});
//	var result = ret.result;
//	return {aes_key: result[0], enc_key: result[1]};
	var ret = time(function(){
		var result = cpabe_enc(pub_key, policy);
		return {aes_key: result[0], enc_key: result[1]};
	});
	log_time('cpabe_enc', ret, policy);
	return ret.result;
};
myfunctions.cpabe_dec = function(pub_key, priv_key, enc_key){
//	var ret = time(function(){return cpabe_dec(pub_key, priv_key, enc_key);});
//	var result = ret.result;
//	return result;
	var ret = time(function(){
		return cpabe_dec(pub_key, priv_key, enc_key);
	});
	log_time('cpabe_dec', ret, enc_key.length);
	return ret.result;
};

// RSA keys;
myfunctions.generateRSAKey = function(passphrase, bitlength){
	var ret = time(function(){
		var rsakey = cryptico.generateRSAKey(passphrase, bitlength);
		return cryptico.saveRSAKey(rsakey);
	});
	log_time('rsa_generateRSAKey', ret);
	return ret.result;
};

myfunctions.publicKeyString = function(rsakey){
	var ret = time(function(){
		var _rsakey = cryptico.loadRSAKey(rsakey);
		return cryptico.publicKeyString(_rsakey);
	});
	log_time('rsa_publicKeyString', ret);
	return ret.result;
};

myfunctions.publicKeyID = function(publicKeyString){
	var ret = time(function(){
		return cryptico.publicKeyID(publicKeyString);
	});
	log_time('rsa_publicKeyID', ret);
	return ret.result;
};

myfunctions.encrypt = function(plaintext, publicKeyString, signingKey){
	var ret = time(function(){
		var _signingKey = signingKey && cryptico.loadRSAKey(signingKey);
		return cryptico.encrypt(plaintext, publicKeyString, _signingKey);
	});
	log_time('rsa_encrypt', ret);
	return ret.result;
};

myfunctions.decrypt = function(ciphertext, key){
	var ret = time(function(){
		var _rsakey = cryptico.loadRSAKey(key);
		return cryptico.decrypt(ciphertext, _rsakey);
	});
	log_time('rsa_decrypt', ret);
	return ret.result;
};

var messagerpc = new MessageRPC();
messagerpc.postMessage = function(){
	var args = Array.prototype.slice.call(arguments);
	return postMessage.apply(null, args);
};
messagerpc.proxy = myfunctions;

onmessage = function(evt){
	var msg = evt.data;
	messagerpc.onmessage(msg);
};

