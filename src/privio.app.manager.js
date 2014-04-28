var AppManager = function(pio){
	if(!pio) return;
	var self = {};

	self.app_windows = {};

	var deferred_action = function(context, local_deferred){
		local_deferred.done(function(){
			context.resolve($.makeArray(arguments));
		}).fail(function(){
			context.reject($.makeArray(arguments));
		});
	};

	var immediate_action = function(context, result){
		context.resolve([result]);
	};

	var store_filter = function(context){
		var args = context.args.slice();
		var abspath = context.args[0];
		if(!abspath) new Error('Path is missing.');
//		var arr = WebFS.de_abspath(abspath);
//		var bucket = arr[0], path = arr[1];
		var rp = pio.resolvePath(abspath);
		var bucket = rp.bucket;
		var gen_path = "app/" + context.appid + '/' + rp.path;
		var gen_abspath = WebFS.abspath(bucket, gen_path);
		args[0] = gen_abspath;
		return args;
	};

	var message_filter = function(context){
		var args = context.args.slice();
		args.unshift(context.appid);
		return args;
	};

	var make_action = function(action, filter){
		return function(context){
			var args = context.args;
			if(filter){
				args = filter(context);
			}
			var cmd = context.cmd;
			var func = pio[cmd];
			var ret = null;
			try{
				ret = func.apply(pio, args);
			} catch(error){
				context.reject([error+'']);
				return;
			}
			action(context, ret);
		};
	};

	var commands = {};

	commands.saveObject = make_action(deferred_action, store_filter);
	commands.loadObject = make_action(deferred_action, store_filter);

	commands.cpabe_encrypt = make_action(deferred_action);
	commands.cpabe_decrypt = make_action(deferred_action);

	commands.loadPublicProfile = make_action(deferred_action);
	commands.openlink = make_action(immediate_action, message_filter);

	commands.postMessage = make_action(deferred_action, message_filter);
	commands.pullMessage = make_action(deferred_action, message_filter);

	commands.flashAjax = make_action(deferred_action);

	var simple_immediate_action = make_action(immediate_action);
	['getUsername', 'getName', 'listFriends', 'notify', 
	 'getFriendPolicyTags', 'log',
	 'stat_begin', 'stat_finish'].forEach(function(f){
		commands[f] = simple_immediate_action;
	});

	commands.updateFrameHeight = function(context){
		var args = context.args;
		var height = args[0];
		var iframe = context.source;
//		$(iframe).css("height", height+"px");
//		iframe.style['height'] = height+"px";
		$('iframe.privio-app-iframe').height(height);
//		$('iframe.privio-app-iframe').css('overflow', 'hidden');
		context.resolve([true]);
	};

	var receiveMessage = function(event){
		var origin = event.origin;
		var source = event.source; // source window object
		if(origin == "null") {
			origin = self.app_windows[source];
//			$('iframe').each(function(i, elm){
//				if(elm.contentWindow == source)
//					origin = $(elm).attr('src');
//			});
			appid = URI(origin).hostname();
//			log.debug(self.app_windows[source]);
		}
		var appid = URI(origin).hostname();

		var data = event.data;
		var id = data.id;
		var cmd = data.cmd;
		var args = data.args;

		if(appid.indexOf('.app.')<0) return;
		
		if(appid == "caja.app.priv.io"){
			appid = "feed.app.priv.io";
		} else if(appid == "caja.app.priv.io"){
			appid = "chat.app.priv.io";
		}

		var context = {id:id, cmd:cmd, args:args, appid:appid, source:source};
		context.reject = function(result){
			data.result = result;
			data.status = "rejected";
			source.postMessage(data, origin);
		};
		context.resolve = function(result){
			data.result = result;
			data.status = "resolved";
			source.postMessage(data, origin);
		};

		var func = commands[cmd];
		if(func) func.call(this, context);
		else {
			log.error('Invoke non-exist function.', event);
		}
	};

	var receiveMessageHandler = function(event){
		if(!pio) return;
		receiveMessage(event);
	};
	window.addEventListener("message", receiveMessageHandler, false);

	return self;
};
