(function(){
	if(!window.paja) return;
	
	var console = {};
	(function(){
		var cmds = ['log', 'error', 'warn', 'info'];
		for(var i in cmds){
			var c = cmds[i];
			console[c] = (function(){
				var cmd = c;
				//log2("Making", cmd);
				return function(){
					var args = $.makeArray(arguments);
					args.unshift(cmd);
					paja.log.apply(null, args);
				};
			})();
		}
	})();
	window.console = console; 
	
})();

var P = window.P = (function(){
	if(window.P) return;

	var DOMAIN = 'http://priv.io';
//	if(document.referrer.substr(0,5)!="http:"){
		DOMAIN = 'https://priv.io';
//	}
	var counter = 0;

	var postMessage = function(message){
		if(window.paja){
			paja.postMessage(message);
		} else{
			window.parent.postMessage(message, DOMAIN);
		}
	};

	var waiting_list = {};

	var addWaiting = function(id, data){
		waiting_list[id] = data;
	};

	var callWaiting = function(id, data){
		var wlst = waiting_list[id];
		if(!wlst){
//			console.error('Waiting ID not exist for result of', data.cmd);
			return;
		}
		delete waiting_list[id];
		var deferred = wlst.deferred;
		var status = data.status;
		var args = data.result;
		if(status == 'resolved'){
			deferred.resolve.apply(deferred, args);
		} else {
			deferred.reject.apply(deferred, args);
		}
	};

	var receiveMessage = function(event){
		var data = event.data;
		var origin = event.origin;
//		if(origin != DOMAIN) {
//			console.error('Got unknown message.', event);
//			return;
//		}
		callWaiting(data.id, data);
	};

	var receiveMessageHandler = function(event){
		receiveMessage(event);
	};
	if(window.paja){
		paja.addMessageCallback(receiveMessageHandler);
	} else{
		window.addEventListener("message", receiveMessageHandler, false);
	}

	var make_function = function(cmd){
		return function(){
			var args = $.makeArray(arguments);
			var data = {id: new Date().getTime()+"+"+counter++, cmd:cmd, args: args};
			postMessage(data);
			var deferred = jQuery.Deferred();

			addWaiting(data.id, {deferred: deferred, id:data.id});
			return deferred.promise();
		};
	};

	var cmds = ['saveObject', 'loadObject', 'postMessage', 'pullMessage',
	            'getUsername', 'getName', 'listFriends', 'updateFrameHeight',
	            'cpabe_encrypt', 'cpabe_decrypt', 'getFriendPolicyTags',
	            'loadPublicProfile', 'openlink', 'log', 'notify', 'flashAjax',
	            'stat_begin', 'stat_finish'];

	var api = {};
	cmds.forEach(function(cmd){
		api[cmd] = make_function(cmd);
	});

	return api;
})();


(function(){
	
	(!window.paja) && (function(){
		function getDocHeight() {
			var D = document;
			if(!D.documentElement || !D.body) return 0;
			return Math.max(
					Math.max(D.body.scrollHeight, D.documentElement.scrollHeight),
					Math.max(D.body.offsetHeight, D.documentElement.offsetHeight),
					Math.max(D.body.clientHeight, D.documentElement.clientHeight)
			);
		}
		var height = getDocHeight();
		var eventhandler = function(){
			var h = getDocHeight();
			if(height != h){
				height = h;
				P.updateFrameHeight(height+30);
//				console.info('App height', height);
			}
		};
		var elm = document.documentElement;
//		elm.addEventListener('DOMAttrModified', eventhandler, false);
//		window.addEventListener('resize', eventhandler, false);
		window.addEventListener('scroll', eventhandler, false);
		elm.addEventListener('DOMSubtreeModified', eventhandler, false);
	})();

	
	var setDataURI_counter = 0;
	P.setDataURI = function(elm, data){
		if(window.paja){
			$(elm).attr('tmpid', ++setDataURI_counter);
			paja.setDataURI(setDataURI_counter, data);
		} else {
			$(elm).attr('src', data);
		}
	};
	
	
	P.openFile = function(callback){
		
	};
})();