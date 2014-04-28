var MessageRPC = function(){
	var self = {};

	var counter = 0;
	var count = function(){
		if(counter > 65536)
			counter = 0;
		return counter ++;
	};

	self.proxy = {}; // proxy functions;
	self.waitinglist = {};
	self.postMessage = function(){}; // set this before using

	self.onmessage = function(msg){
		var type = msg.type;
		var id = msg.id;
		var func_name = msg.func_name;
		var args = msg.args;
		var error = msg.error;
		var result = msg.result;
		if(type == "invoke"){
			var func = self.proxy[func_name];
			var ret = null;
			try{
				ret = func.apply(null, args);
			} catch(e){
				self.postMessage({id: id, type:"error", error:""+e});
				return;
			}
			self.postMessage({id: id, type:"result", result:ret});
		} else if(type == "result"){
			var deferred = self.waitinglist[id];
			delete self.waitinglist[id];
			deferred.resolve(result);
		} else if(type == "error"){
			var deferred = self.waitinglist[id];
			delete self.waitinglist[id];
			deferred.reject(error);
		} else {
			throw new Error('MessageRPC message format error: unknown type '+type);
		}
	};

	self.apply = function(func_name, args){
		args = args || [];
		var id = count();
		var deferred;
		var has_jQuery = function(){
			return !!this.jQuery;
		};
		if(has_jQuery()) {
			deferred = jQuery.Deferred();
		}else{
			deferred = SimpleDeferred();
		}
		self.postMessage({id: id, func_name:func_name, type:"invoke", args:args});
		self.waitinglist[id] = deferred;
		return deferred.promise();;
	};

	self.shadow = function(func_names){
		var obj = {};
		for(var i = 0; i < func_names.length; i++){
			obj[func_names[i]] = (function(func_name){
				return function(){
					var args = Array.prototype.slice.call(arguments);
					return self.apply(func_name, args);
				};
			})(func_names[i]);
		}
		return obj;
	};

	return self;
};

var SimpleDeferred = function(){
	var self = {};
	var status = 'init'; // "init", "resolve", "reject"
	var lst_done = [];
	var lst_fail = [];
	var finished_args = [];

	var safe_invoke = function(foo, args){
		if(!(foo instanceof Function)) return;
		if(args instanceof Array){
			try{
				foo.apply(null, args);
			} catch(e){
				//TODO: print something
				// be careful, console might not exist.
			}
		}
	};

	var safe_call_lst = function(lst, args){
		for(var i = 0; i < lst.length; i++){
			var foo = lst[i];
			safe_invoke(foo, args);
		}
	};

	self.resolve = function(){
		finished_args = Array.prototype.slice.call(arguments);
		safe_call_lst(lst_done, finished_args);
		return self;
	};

	self.reject = function(){
		finished_args = Array.prototype.slice.call(arguments);
		safe_call_lst(lst_fail, finished_args);
		return self;
	};

	self.done = function(foo){
		if(status == "resolve"){
			safe_invoke(foo, finished_args);
		} else if(status == "init") {
			lst_done.push(foo);
		}
		return self;
	};

	self.fail = function(foo){
		if(status == "reject"){
			safe_invoke(foo, finished_args);
		} else if(status == "init") {
			lst_fail.push(foo);
		}
		return self;
	};

	self.promise = function(){
		return self;
	};

	return self;
};