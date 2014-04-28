//#import privio.helper.js

var ajax = function(url){
	return P.flashAjax(url);
};

var MySQS = function(){
	var self = this;
	var accessKeyId = '';
	var secretKey = '';

	self.setCredential = function(key, secret){
		accessKeyId = key;
		secretKey = secret;
	};

	self.listQueue = function(options){ // return [list of query_url]
		var deferred = new jQuery.Deferred();
		var form = jQuery.extend({QueueNamePrefix: ""}, options);
		var url = sqs.generateSignedURL("ListQueues",form, accessKeyId, secretKey, "http://queue.amazonaws.com/", "2009-02-01");
		var data = '';
		P.flashAjax(url).done(function(d){
			data = d;
			var obj = null;
			if(window.paja){
				obj = paja.parseXMLToObj(data);
			}else{
				xmldata = $.parseXML(data);
				obj = xmlToObj(xmldata);
			}
			var qurl = obj.listQueuesResult && obj.listQueuesResult.queueUrl;
			var result = [];
			if(!obj.listQueuesResult){

			}else if($.isArray(qurl)){
				result = qurl;
			}else{
				result = [qurl];
			}
			deferred.resolve(result);
		}).fail(function(err){
			deferred.reject(err);
		});
		return deferred.promise();
	};

	self.receiveMessage = function(qurl, options){ // return [list of query_url]
		var deferred = new jQuery.Deferred();
		var form = jQuery.extend({MaxNumberOfMessages: "5", VisibilityTimeout: '',WaitTimeSeconds: "10"}, options);
		var newver = '2012-11-05', oldver = "2009-02-01";
		var ver = newver;
		var url = sqs.generateSignedURL("ReceiveMessage",form, accessKeyId, secretKey, qurl, ver);
		var data = '';
		P.flashAjax(url).done(function(d){
			data = d;
			var result = [];

			deferred.resolve(data);
		}).fail(function(err){
			deferred.reject(err);
		});
		return deferred.promise();
	};

	self.sendMessage = function(qurl, options){ // return [list of query_url]
		var deferred = new jQuery.Deferred();
		var form = jQuery.extend({MessageBody: "", DelaySeconds: ''}, options);
		var url = sqs.generateSignedURL("SendMessage",form, accessKeyId, secretKey, qurl, "2009-02-01");
		var data = '';
		P.flashAjax(url).done(function(d){
			data = d;
			var result = [];

			deferred.resolve(result);
		}).fail(function(err){
			deferred.reject(err);
		});
		return deferred.promise();
	};
	
	self.deleteMessage = function(qurl, options){
		var deferred = new jQuery.Deferred();
		var form = jQuery.extend({ReceiptHandle: ""}, options);
		var url = sqs.generateSignedURL("DeleteMessage",form, accessKeyId, secretKey, qurl, "2009-02-01");
		var data = '';
		P.flashAjax(url).done(function(d){
			data = d;
			var result = [];
			deferred.resolve(result);
		}).fail(function(err){
			deferred.reject(err);
		});
		return deferred.promise();
	};

	return self;
};

var consoleDebug = function(){
	var lst = $.makeArray(arguments);
//	lst.unshift(arguments.callee.name);
	console.log.apply(console, lst);
};

var myalert = function(){
	var lst = $.makeArray(arguments);
//	lst.unshift(arguments.callee.name);
	console.log.apply(console, lst);
	P.notify.apply(P, {message: JSON.stringify(lst)});
};

$(function(){

	// UI
	var $invite_key = $('<input type="password">')
	, $check = $('<button class="btn btn-primary">Check</button>').click(function(){
		check();
	})
	, $receiver = $('<input type="text" value="receiver">')
	, $message = $('<input type="text" value="message">')
	, $send = $('<button class="btn">send</button>').click(function(){
		ui_send_message();
	})
	, $txt_delete = $('<input type="text" value="ReceiptHandle">')
	, $delete = $('<button class="btn">delete</button>').click(function(){delete_message();})
	, $info = $('<div>')
	, $msgBody = $('<div>')
	, $msgContainer = $('<pre>')
	, $deleteReceivedMessage = $('<input type="checkbox">').prop('checked', true)
	, $autoPoll = $('<input type="checkbox">').prop('checked', true)
	, $btn_ping = $("<button class='btn'>ping</button>").click(function(){
		ui_send_ping();
	})
	;

	$('body').append($('<div class="well">').append(
			"Invitation:", $invite_key, $check ,"<br>",
			"@", $receiver, $message, $send, $btn_ping,"<br>",
			$txt_delete, $delete, "<br>",
			$('<label>').append($deleteReceivedMessage, "DeleteReceivedMessageOnServer"),
			$('<label>').append($autoPoll, "AutoPoll"),
			$info,"<br>"),
			$('<div class="well">').append($msgBody, $msgContainer)
			
			);


	// make sure connection by: url = 'http://queue.amazonaws.com/crossdomain.xml'


	// Controller
	var mysqs = new MySQS();

	var cipher = '';
	var access = null;
	var my_username = null;
	var my_queue_url = "";

	P.getUsername().done(function(username){
		my_username = username;
	});

	var getInvitation = function(){
		return $invite_key.val();
	};
	
	console.log("Finished loading APP.")
	P.stat_finish('LoadApp');
	
//	consoleDebug(sjcl.decrypt("pass", sjcl.encrypt("pass", "hello")));

	var check = function(){
		consoleDebug("check: checking new message")
		try{
      access = sjcl.decrypt(getInvitation(), cipher);
			access = JSON.parse(access);
		} catch (err){
			consoleDebug('ABORT: Sorry, only invited user at the moment.');
			myalert('ABORT: Sorry, only invited user at the moment.');
			return;
		}

		mysqs.setCredential(access.access_key, access.access_secret);

		checkMessage();
		if(my_queue_url) return;

		mysqs.listQueue({QueueNamePrefix: my_username+'-privio'}).done(function(lst_qurl){
			console.log(lst_qurl);
			$info.append($("<span>"+lst_qurl+"</span>"));
			if(lst_qurl.length){
				my_queue_url = lst_qurl[0];
				checkMessage();

			}
			myalert('Set my_queue_url to: '+my_queue_url);
		}).fail(function(err){
			console.log("Chat.check.1:", err);
		});

	};
	
	var print = function(text){
		$msgContainer.text(text);
	};
	
	var displayMessage = function(msg){
		$msgBody.append($('<p>').text('At '+new Date()+" received: "+msg.body));
	};
	
	
	var checkMessage = function(){
		if(my_queue_url){
			mysqs.receiveMessage(my_queue_url).done(function(data){
				var xdoc = $.parseXML(data);
				var obj = xmlToObj(xdoc);
				if(obj['receiveMessageResult'] && obj['receiveMessageResult']['message'] && !$.isArray(obj['receiveMessageResult']['message'])){
					obj['receiveMessageResult']['message'] = [obj['receiveMessageResult']['message']];
				}
				var msgs = obj['receiveMessageResult'] && obj['receiveMessageResult']['message'];
				if(msgs){
					msgs.forEach(function(msg){
						displayMessage(msg);
						console.debug(msg);
						if($deleteReceivedMessage.prop('checked')){
							mysqs.deleteMessage(my_queue_url, {ReceiptHandle: msg.receiptHandle}).done(function(ret){
								console.log('mysqs.deleteMessage', ret);
							}).fail(function(err){
								console.log('mysqs.deleteMessage', err);
							});
						}
						try{
							var cmdobj = JSON.parse(msg.body);
							if(cmdobj.cmd == "ping"){
								var reply = {cmd:"pong", qurl: my_queue_url, 
										ping_ts: cmdobj.ts, ts: new Date().getTime()};
								reply = JSON.stringify(reply);
								send_message2(cmdobj.qurl, reply);
							}
							if(cmdobj.cmd == "pong"){
								var now = new Date().getTime();
								displayMessage({body:"PingPong in "+(now-cmdobj.ping_ts)});
							}
						}catch(ex){
							console.log("Chat cmdobj ERROR:", ex);
						}
					});
				}
				print(JSON.stringify(obj));
				P.log("Received Message.");
				
				if($autoPoll.prop('checked')){
					setTimeout(checkMessage, 1);
				}
				
			});
			return;
		}
	};
	
	var ui_send_ping = function(){
		var receiver = $receiver.val();
		if(!receiver || receiver == ""){
			myalert('ABORT: Who is the receiver?');
			return;
		}
		if(!my_queue_url){
			myalert('Please check your queue URL first.');
			return;
		}
		get_user_qurl(receiver).done(function(receiver_qurl){
			var msg = {
					cmd:"ping", qurl: my_queue_url,
					ts: new Date().getTime()
			};
			msg = JSON.stringify(msg);
			send_message2(receiver_qurl, msg);
		});
	};
	
	var cache_qurls = {};
	var get_user_qurl = function(user){
		var deferred = new jQuery.Deferred();
		var receiver_qurl = '';
		if(cache_qurls[user]){
			deferred.resolve(cache_qurls[user]);
		} else {			
			mysqs.listQueue({QueueNamePrefix: user+'-privio'}).done(function(lst_qurl){
				if(lst_qurl.length){
					receiver_qurl = lst_qurl[0];
					cache_qurls[user] = receiver_qurl;
					deferred.resolve(receiver_qurl);
				}else{
					myalert("Receiver queue not found.");
				}
			}).fail(function(err){
				deferred.reject(err);
				console.log("Chat.check.2:", err);
			});
		}
		return deferred.promise();
	};
	
	var ui_send_message = function(){
		var receiver = $receiver.val();
		var message = $message.val();

		if(!access){
			myalert('Please input your inviation code.');
			return;
		}
		if(!receiver || receiver == ""){
			myalert('ABORT: Who is the receiver?');
			return;
		}
		send_message1(receiver, message);
	};
	
	var send_message1 = function(receiver, message){
		get_user_qurl(receiver).done(function(receiver_qurl){
			send_message2(receiver_qurl, message);
		});
	};

	var send_message2 = function(receiver_qurl, message){
		
		P.log('Sending Message');
		mysqs.sendMessage(receiver_qurl, {MessageBody: message}).done(function(ret){
			console.log('mysqs.sendMessage', ret);
		}).fail(function(err){
			console.log('mysqs.sendMessage', err);
		});
	};
	
	var delete_message = function(){
		var receiptHandle = $txt_delete.val();
		var receiver = $receiver.val();
		get_user_qurl(receiver).done(function(receiver_qurl){
			mysqs.deleteMessage(receiver_qurl, {ReceiptHandle: receiptHandle}).done(function(ret){
				console.log('mysqs.deleteMessage', ret);
			}).fail(function(err){
				console.log('mysqs.deleteMessage', err);
			}); 
		});
		
		
	}
});