!function() {
	var $output = $('#output');

	var text_output = '';
	var print = function(text) {
////		$output.val($output.val() + text);
		text_output += text;
		$output.text(text_output);
//		console.log(text);
	};
	var println = function() {
		var args = [];
		$.each(arguments, function(i, v){
			args.push(v);
		});
		print(args.join(' ') + "\n");
	};
	var printtabln = function() {
		var args = [];
		$.each(arguments, function(i, v){
			args.push(v);
		});
		print(args.join('\t') + "\n");
	};

	var P = new Privio();

	Pio._remoteLogging.enable(false);

//	var filenames = "1K 10K 512K 1M 1.5M 2M 5M 10M".split(' ');
//	var filenames = "0.005K 0.1K 0.2K 0.3K 0.4K 0.5K 0.6K 0.7K 0.8K 0.9K 1K 2K 3K 4K 5K 6K 7K 8K 9K 10K 20K 30K 40K 50K 60K 70K 80K 90K 100K 200K 300K 400K 500K 600K 700K 800K 900K 1000K 1M 2M 5M 10M".split(' ');
	var filenames1 = "0.005K 0.1K 0.2K 0.3K 0.4K 0.5K 0.6K 0.7K 0.8K 0.9K 1K 2K 3K 4K 5K 6K 7K 8K 9K 10K 20K 30K 40K 50K 60K 70K 80K 90K 100K 200K 300K 400K 500K 600K 700K 800K 900K 1000K 1M 2M 5M 10M".split(' ');
	var filenames2 = "0.005K 0.1K 0.2K 0.3K 0.4K 0.5K 0.6K 0.7K 0.8K 0.9K 1K 2K 3K 4K 5K 6K 7K 8K 9K 10K 20K 30K 40K 50K 60K 70K 80K 90K 100K 200K 300K 400K 500K 600K 700K 800K 900K 1000K 1M 2M 5M".split(' ');
	var filenames3 = "0.005K 0.1K 0.2K 0.3K 0.4K 0.5K 0.6K 0.7K 0.8K 0.9K 1K 2K 3K 4K 5K 6K 7K 8K 9K 10K 20K 30K 40K 50K 60K 70K 80K 90K 100K 200K 300K 400K 500K 600K 700K 800K 900K 1000K 1M".split(' ');
	var filenames4 = "0.005K 0.1K 0.2K 0.3K 0.4K 0.5K 0.6K 0.7K 0.8K 0.9K 1K 2K 3K 4K 5K 6K 7K 8K 9K 10K 20K 30K 40K 50K 60K 70K 80K 90K 100K 200K 300K 400K 512K".split(' ');
	var filenames5 = "0.005K 0.1K 0.2K 0.3K 0.4K 0.5K 0.6K 0.7K 0.8K 0.9K 1K 2K 3K 4K 5K 6K 7K 8K 9K 10K 20K 30K 40K 50K 60K 70K 80K 90K 100K 256K".split(' ');
	var filenames6 = "0.005K 0.1K 0.2K 0.3K 0.4K 0.5K 0.6K 0.7K 0.8K 0.9K 1K 2K 3K 4K 5K 6K 7K 8K 9K 10K 20K 30K 40K 50K 60K 70K 80K 90K 100K".split(' ');
	var filenames = filenames1;
	var K = 1024, M = K*K;
//	var sizes = [K, 10*K, 512*K, M, 1.5*M, 2*M, 5*M, 10*M];
	var sizes = [];

	function setSizes(){
		$.each(filenames, function(i, name){
			if(name.indexOf('K')>=0){
				var f = parseFloat(name.replace('K', ''));
				sizes.push(f*K);
			} else {
				var f = parseFloat(name.replace('M', ''));
				sizes.push(f*M);
			}
		});
	}
	setSizes();



//	var download_files = {};
//	println('Loading data files. '+filenames);
//	$.each(filenames, function(i, name){
//		$.get('res/test_crypto/'+name, 'text').done(function(data){
//			download_files[name] = data;
//			println('Loaded: '+name, data.length);
//		});
//	});

	var generate_random_string = function(size){
		var buf = '';
		for(var i = 0; i < size; i ++){
			var n = 127-32;
			var c = String.fromCharCode(Math.floor((Math.random()*n)+32));
			buf += c;
		}
		return buf;
	};

	var generate_data_files = function(si){
		var files = {};
		$.each(filenames, function(i, name){
			files[name] = generate_random_string(sizes[i]);
		});
		return files;
	};



	var time = function(func){
		var t0 = new Date().getTime();
		var result = func();
		var t1 = new Date().getTime();
		return {result:result, time: t1-t0};
	};

	var isArray = function (obj) {
		return Object.prototype.toString.call(obj) === "[object Array]";
	},
	getNumWithSetDec = function( num, numOfDec ){
		var pow10s = Math.pow( 10, numOfDec || 0 );
		return ( numOfDec ) ? Math.round( pow10s * num ) / pow10s : num;
	},
	getAverageFromNumArr = function( numArr, numOfDec ){
		if( !isArray( numArr ) ){ return false;	}
		var i = numArr.length,
			sum = 0;
		while( i-- ){
			sum += numArr[ i ];
		}
		return getNumWithSetDec( (sum / numArr.length ), numOfDec );
	},
	getVariance = function( numArr, numOfDec ){
		if( !isArray(numArr) ){ return false; }
		var avg = getAverageFromNumArr( numArr, numOfDec ),
			i = numArr.length,
			v = 0;

		while( i-- ){
			v += Math.pow( (numArr[ i ] - avg), 2 );
		}
		v /= numArr.length;
		return getNumWithSetDec( v, numOfDec );
	},
	getStandardDeviation = function( numArr, numOfDec ){
		if( !isArray(numArr) ){ return false; }
		var stdDev = Math.sqrt( getVariance( numArr, numOfDec ) );
		return getNumWithSetDec( stdDev, numOfDec );
	};

	var prec = 1;
	var iter = 10;

	$(function(){
		$('#btn_set_iter').click(function(){
			var t = $('#txt_iter').val();
			iter = parseInt(t);

			var s = $("#txt_type").val();
			s = s.toLowerCase();
			var f = filenames1;
			switch(s){
			case "10m":
				f = filenames1;
				break;
			case "5m":
				f = filenames2;
				break;
			case "1m":
				f = filenames3;
				break;
			case "512k":
				f = filenames4;
				break;
			case "256k":
				f = filenames5;
				break;
			case "100k":
				f = filenames6;
				break;
			}
			filenames = f;
			setSizes();
		});
	});

	var perf_aes = function(){
		println();
		var password = 'password';


		var enc_times = {};
		var dec_times = {};
		$.each(filenames, function(i, name){
			enc_times[name] = [];
			dec_times[name] = [];
		});

		var s = '';
		$.each(new Array(10), function(){
			s += sjcl.decrypt('worm up', sjcl.encrypt('worm up', 'worm up text'+Math.random()));
		});

		$.each(new Array(iter), function(){
			var encrypted_data = {};

			console.log('Begin generating data files');
			var test_files = generate_data_files();
//		var test_files = download_files;
			console.log('Finish generating data files');

			$.each(test_files, function(name, data){
				console.log('encrypt', name, data.length);
				var r = time(function(){
					return sjcl.encrypt(password, data);
				});
				encrypted_data[name] = r.result;
				enc_times[name].push(r.time);
			});

			$.each(encrypted_data, function(name, data){
				console.log('decrypt', name, data.length);
				var r = time(function(){
					return sjcl.decrypt(password, data);
				});
				dec_times[name].push(r.time);
			});
		});

		println();
		println('================== AES Result ===============');
//		var prec = 1;
		printtabln('#type','\tname','avg','var','std_dev');
		$.each(filenames, function(i, name){
			var lst = enc_times[name];
			printtabln('Encryption', name, getAverageFromNumArr(lst,prec), getVariance(lst,prec), getStandardDeviation(lst,prec));


		});
		println()
		printtabln('#type','\tname','avg','var','std_dev');
		$.each(filenames, function(i, name){
			var lst = enc_times[name];
			lst = dec_times[name];
			printtabln('Decryption', name, getAverageFromNumArr(lst,prec), getVariance(lst,prec), getStandardDeviation(lst,prec));
		});

	};

	var pcrypto = P.pio.crypto;
	var time_records = {};
	var last_time = 0;
	pcrypto.messagerpc.proxy.log_time = function(type, time, comments){
		last_time = time;
		var records = time_records[type] || [];
		records.push(time);
		time_records[type] = records;
		console.log(type, time, comments);
	};

	var perf_pio_cpabe = function(){

		function run(){
			var deferred = $.Deferred();
			var policy = "@@ @liang friend";
			var cpabe = null;
			var cpabe_priv_key = null;
			var cpabe_enc_key = null;

			pcrypto.cpabe.cpabe_setup().done(function(ret){
				cpabe = ret;
				pcrypto.cpabe.cpabe_get_private_key(cpabe.pub_key, cpabe.master_key, policy).done(function(ret){
					cpabe_priv_key = ret;
					pcrypto.cpabe.cpabe_enc(cpabe.pub_key, '@@').done(function(ret){
						cpabe_enc_key = ret.enc_key;
						var aes_key = ret.aes_key;
						pcrypto.cpabe.cpabe_dec(cpabe.pub_key, cpabe_priv_key, cpabe_enc_key).done(function(ret){
							if(aes_key != ret) throw Error('CPABE decrypt key fail.');
							console.log('Finish one round of CPABE.');
							deferred.resolve();
						});
					}).fail(function(e){
						console.log('cpabe_enc',e);
					});
				});
			});
			return deferred.promise();
		}

		var waitings = [];
		$.each(new Array(iter), function(){
			waitings.push(run());
		});

		$.when.apply(null, waitings).done(function(){
			println();
			println('========= CPABE ============');
			printtabln('#type','avg','var','std_dev');
			$.each(time_records, function(type, times){
				var lst = times;
				printtabln(type, getAverageFromNumArr(lst,prec), getVariance(lst,prec), getStandardDeviation(lst,prec));
			});
		});

	};

	var perf_pio_rsa = function(){

		var pass = generate_random_string(1024);
		var data = generate_random_string(50);

		function run(){
			var deferred = jQuery.Deferred();

			pcrypto.rsa.generateRSAKey(pass, RSA_KEY_BITS).done(function(rsa){
//				console.log(rsa);
				pcrypto.rsa.publicKeyString(rsa).done(function(pub_rsa){
					pcrypto.rsa.encrypt(data, pub_rsa, rsa).done(function(cipher){
//						console.log(cipher);
						pcrypto.rsa.decrypt(cipher.cipher, rsa).done(function(de_data){
							if(data != de_data.plaintext) throw new Error('RSA decrypt fail.');
							console.log('Finish one round of RSA.');
							deferred.resolve();
						});
					});
				});
			});
			return deferred.promise();
		}

		var waitings = [];
		$.each(new Array(iter), function(){
			waitings.push(run());
		});

		$.when.apply(null, waitings).done(function(){
			println();
			println('========= RSA ============');
			printtabln('#type','avg','var','std_dev');
			$.each(time_records, function(type, times){
				var lst = times;
				printtabln(type, getAverageFromNumArr(lst,prec), getVariance(lst,prec), getStandardDeviation(lst,prec));
			});
		});
	};

	var $btn = $('<button>AES</button>');
	$btn.click(function(){
		perf_aes();
	});
	$('#controls').append($btn);

	var $btn = $('<button>CPABE</button>');
	$btn.click(function(){
		perf_pio_cpabe();
	});
	$('#controls').append($btn);

	var $btn = $('<button>RSA</button>');
	$btn.click(function(){
		perf_pio_rsa();
	});
	$('#controls').append($btn);

}();