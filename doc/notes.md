## Potential Improvements

### File API / MashFS

* Provide context

		var mash = new MashFS(/*Init root FS*/);
		mash.read(...)
		mash.write(...)
		// Begin transaction A
		mash_transaction_a = mash.createContext("Name of Context");
		mash_transaction_a.read(...)
		mash_transaction_a.write(...)
		mash_transaction_a.closeContext()
		// End of transaction
		// This could help program analyse IO operations. 
		// Transaction should be able to cascade
		
* PIO should build on top of contexted MashFS
* Transaction engine: take a closed function (all input should be given before it ran except file ops), ACID feature

### Profile / Object store

* High level API for save/load objects
* Object should be able to serialized in JS
* When saving, can feed with encryption parameters

		var obj = {a: "1"}
		var os = new ObjectStore(mash_context);
		os.save(obj) => "{'a':'1'}"
		os.save(obj, {aes:key}) => "{'.cipher':{'data':'enc_obj'}}"

* When loading, can auto decrypt with cipher hints 

## Test procedure Pio.crypto.cpabe lib
	var ret = null; 
	P.pio.crypto.cpabe.cpabe_setup().done(function(r){ret = r})
	var pub = ret
	P.pio.crypto.cpabe.cpabe_enc(pub.pub_key, "@self@").done(function(r){ret = r})
	var enc = ret
	P.pio.crypto.cpabe.cpabe_dec(pub.pub_key, pub.master_key, enc.enc_key).done(function(r){ret = r})
	// Should fail: ret == enc.aes_key
	
	P.pio.crypto.cpabe.cpabe_get_private_key(pub.pub_key, pub.master_key, "@self@").done(function(r){ret = r})
	var prv = ret
	P.pio.crypto.cpabe.cpabe_dec(pub.pub_key, prv, enc.enc_key).done(function(r){ret = r})
	// Should true: ret == enc.aes_key
	
# TODO

* Integrate SQS to Message
* Partial load news feed items
* Remove RSA related keys, used @self@ policy instead