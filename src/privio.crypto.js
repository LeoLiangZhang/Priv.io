//#import privio.message.rpc.js

/*
 * Sample usage
P.pio.crypto.cpabe.cpabe_setup().done(function(ret){r = ret; log.debug(r)})
P.pio.crypto.cpabe.cpabe_get_private_key(r.pub_key, r.master_key, "amislove").done(function(ret){r2 = ret; console.log(r2)})
P.pio.crypto.cpabe.cpabe_enc(r.pub_key, "amislove").done(function(ret){r3 = ret; console.log(r3)})
P.pio.crypto.cpabe.cpabe_dec(r.pub_key, r2, r3.enc_key).done(function(ret){r4 = ret; console.log(r4)})
 *
 */

var PrivCrypto = function(){
	var self = {};
	var worker = new Worker('js/privio.crypto.cpabe.js');
	var messagerpc = new MessageRPC();

	messagerpc.proxy = {
			console_log: function(){
				var args = Array.prototype.slice.call(arguments);
				console.log.apply(console, args);
			},
			log_time: function(type, time, comments){
				Pio.log("crypto", type, time, comments);
			}
	};

	messagerpc.postMessage = function(){
		var args = Array.prototype.slice.call(arguments);
		return worker.postMessage.apply(worker, args);
	};

	worker.onmessage = function(evt){
		var msg = evt.data;
		messagerpc.onmessage(msg);
	};

	self.messagerpc = messagerpc;

	self.cpabe = messagerpc.shadow(['cpabe_setup', 'cpabe_get_private_key',
	                                'cpabe_enc', 'cpabe_dec']);

	self.rsa = messagerpc.shadow(['generateRSAKey', 'publicKeyString',
	                              'publicKeyID', 'encrypt', 'decrypt']);

	return self;
};

