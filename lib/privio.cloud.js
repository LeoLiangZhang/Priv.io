//##FILE /Users/liang/Works/Projects/cloud/JsCloud/src/util.lang.js
// JavaScript Language extension.

/**
 * Return an array of given array_like object.
 * @param array_like {Object} Can be access by array_like[i], i in [start, end)
 * @param start {int} Inclusive start index.
 * @param end {int} Exclusive end index.
 */
toArray = function(array_like, start, end){
	var len = array_like.length;
	if(len < 0)
		throw new Error("Object does NOT have length property.");
	start = start >= 0 ? start : 0;
	end = end >= 0 ? end : len;
	var lst = [];

	for(var i = start; i < end; i++){
		lst.push(array_like[i]);
	}
	return lst;
};

// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.com/#x15.4.4.18
if (!Array.prototype.forEach) {

	Array.prototype.forEach = function(callback, thisArg) {

		var T, k;

		if (this == null) {
			throw new TypeError(" this is null or not defined");
		}

		// 1. Let O be the result of calling ToObject passing the |this| value
		// as the argument.
		var O = Object(this);

		// 2. Let lenValue be the result of calling the Get internal method of O
		// with the argument "length".
		// 3. Let len be ToUint32(lenValue).
		var len = O.length >>> 0; // Hack to convert O.length to a UInt32

		// 4. If IsCallable(callback) is false, throw a TypeError exception.
		// See: http://es5.github.com/#x9.11
		if ({}.toString.call(callback) != "[object Function]") {
			throw new TypeError(callback + " is not a function");
		}

		// 5. If thisArg was supplied, let T be thisArg; else let T be
		// undefined.
		if (thisArg) {
			T = thisArg;
		}

		// 6. Let k be 0
		k = 0;

		// 7. Repeat, while k < len
		while (k < len) {

			var kValue;

			// a. Let Pk be ToString(k).
			// This is implicit for LHS operands of the in operator
			// b. Let kPresent be the result of calling the HasProperty internal
			// method of O with argument Pk.
			// This step can be combined with c
			// c. If kPresent is true, then
			if (k in O) {

				// i. Let kValue be the result of calling the Get internal
				// method of O with argument Pk.
				kValue = O[k];

				// ii. Call the Call internal method of callback with T as the
				// this value and
				// argument list containing kValue, k, and O.
				callback.call(T, kValue, k, O);
			}
			// d. Increase k by 1.
			k++;
		}
		// 8. return undefined
	};
}

if (!Object.keys) {
    Object.keys = (function () {
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !({
                toString: null
            }).propertyIsEnumerable('toString'),
            dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'],
            dontEnumsLength = dontEnums.length;

        return function (obj) {
            if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object')

            var result = [];

            for (var prop in obj) {
                if (hasOwnProperty.call(obj, prop)) result.push(prop);
            }

            if (hasDontEnumBug) {
                for (var i = 0; i < dontEnumsLength; i++) {
                    if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i])
                }
            }
            return result;
        };
    })();
};

/**
 * Extend obj attributes with given args.
 *
 * @param obj {Object}
 * @param args {Object[]}
 * @returns
 */
extend = function(obj) {
	var len = arguments.length;
	for ( var i = 1; i < len; i++) {
		var source = arguments[i];
		for ( var prop in source) {
			obj[prop] = source[prop];
		}
	}
	return obj;
};

if (!Object.create) {
	Object.create = function(o) {
		function F() {};
		F.prototype = o;
		if (arguments.length > 1){
			var obj = F.prototype;
			var len = arguments.length;
			for ( var i = 1; i < len; i++) {
				extend(obj, arguments[i]);
			}
		}
		return new F();
	};
}

inherits = function(ctor, superCtor) {
	ctor.super_ = superCtor;
	ctor.prototype = Object.create(superCtor.prototype, {
		constructor : {
			value : ctor,
			enumerable : false,
			writable : true,
			configurable : true
		}
	});
};


//##FILE /Users/liang/Works/Projects/cloud/JsCloud/src/util.logging.js
//##import util.lang.js

//Most of the time, log equals console.
if(!console){
	(function () {
        var _console = {};
        _console.alertable = false;

        function createFoo(type) {
            _console['msg_' + type] = [];
            var foo = function (msg) {
                _console['msg_' + type].push(msg);
                if (_console.alertable) alert('' + type + ': ' + msg);
            };
            return foo;
        }
        _console.log = createFoo('log');
        _console.log = createFoo('info');
        _console.warn = createFoo('warn');
        _console.error = createFoo('error');
        _console.debug = createFoo('debug');

        window.console = _console;
    })();
}

//log = Object.create(console);
log = console;

(function(){
	if(!console.debug){ // An IE hack
		console.debug = console.info = console.warn = console.error = console.log;
	}
	try{
//		log.info('Testing Logger.');
	} catch(e){
		log = {};
		['log', 'info', 'warn', 'error', 'debug'].forEach(function(t){
			log[t] = function(){
				console[t].apply(console, toArray(arguments));
			};
		});
	}
})();

//##FILE /Users/liang/Works/Projects/cloud/JsCloud/src/util.event.js
//##import util.lang.js
//##import util.logging.js

EventListenerMixin = {

	__getEventListeners : function(type) {
		if (!this.__eventListeners)
			this.__eventListeners = {};
		var listeners = this.__eventListeners[type];
		if (!listeners)
			listeners = this.__eventListeners[type] = [];
		return listeners;
	},

	addEventListener : function(type, listener) {
		if (!listener)
			return;
		var listeners = this.__getEventListeners(type);
		for ( var i = 0; i < listeners.length; i++) { // event cannot be added
														// repeatedly
			if (listeners[i] == listener)
				return;
		}
		listeners.push(listener);
	},

	removeEventListener : function(type, listener) {
		if (!listener)
			return;
		var listeners = this.__getEventListeners(type);
		var i = 0;
		while (i < listeners.length) {
			var l = listeners[i];
			if (l == listeners)
				listeners.splice(i, 1);
			else
				i++;
		}
	},

	dispatchEvent : function(type, evt) {
//		log.debug('dispatchEvent', type, evt);
		var listeners = this.__getEventListeners(type);
		var args = toArray(arguments, 1);
		listeners.forEach(function(l) {
			l.apply(this, args);
		}, this);
		var foo = null; // call on"eventname" callback
		if (foo = this["on" + type]){
			foo.apply(this, args);
		}
	}
};
//##FILE /Users/liang/Works/Projects/cloud/JsCloud/src/util.js
//##import util.lang.js
//##import util.logging.js
//##import util.event.js

/**
 * @author Liang
 *
 * This file contains helper functions.
 *
 */


/**
 * Return micro second since epoc. A short cut to new Date().getTime().
 * @returns {int}
 */
getTime = function(){
	return new Date().getTime();
};


//##FILE /Users/liang/Works/Projects/cloud/JsCloud/src/flash.interop.js
//##import util.js

// For rawjstrace function in Flash.
window.jstrace = function(){
	var arr = toArray(arguments);
	log.debug.apply(log, arr);
};

/**
 * JS Bridge class that connect FL Bridge class so they both can
 * exchange data by invocation of functions.
 *
 * This class is a foundation of many Flash interpolate classes.
 * @constructor {Brdige}
 */
function Bridge(flobj) {
	this.flobj;
	this.objs = {};
	this.statics = {};
	this.counter = 0;
	this.bridge_name = "__js_fl_bridge__" + getTime();
	var self = this;

	// Init
	this.objs[Bridge.SelfID] = self;
	this.statics['jstrace'] = self.jstrace;
	window[this.bridge_name] = function(invoke){
		return self.dispatch(invoke);
	};

	if(!flobj) return;
	// Init the Bridge
	if(typeof flobj === 'string'){ // init by Flash Object id
		var flobj_id = flobj;
		this.flobj = document.getElementById(flobj_id);
		if(!this.flobj) throw new Error('Flash object not found.');
	} else {
		// assume flobj is the real flash object
		this.flobj = flobj;
	}
	this.init(this.flobj);

};

Bridge.SelfID = 'bridge';

Bridge.prototype.init = function(flobj){
	this.flobj = flobj;

	// Init flash bridge object with *this.bridge_name*, so that
	// flash object can call back.
	this.flcall('bridge', "initJS", this.bridge_name);
};

Bridge.prototype.jstrace = function(){
	log.info.apply(log, arguments);
};

/**
 * Return result of calling *fun* of flash *ref*.
 * @param ref {String/null} null for static method.
 * @param fun {String} Function name.
 * @param *args
 * @returns
 */
Bridge.prototype.flcall = function(ref, fun){
	var args = toArray(arguments, 2);
	return this.flapply(ref, fun, args);
};

/**
 * Return result of applying *fun* of flash *ref*.
 * @param ref {String/null} null for static method.
 * @param fun {String} Function name.
 * @param *args {Array} An Array of arguemnts.
 * @returns
 */
Bridge.prototype.flapply = function(ref, fun, args){
	var invoke = {ref: ref, fun: fun, args: args};
	// Assume flash side handler is called dispatch
	log_time('INVOKE_FLASH_START', ref, fun);
	var ret = this.flobj.dispatch(invoke);
	log_time('INVOKE_FLASH_END', ref, fun);
	if(ret["error"]){
		throw new Error(ret["error"]);
	} else {
		return ret["result"];
	}
};

/**
 * Dispatch an invoke object to target method.
 * An invoke object should contain these fields:
 *  - ref:String // name of the target object, null to look for static function.
 *  - fun:String // method name
 *  - args:Array // an array of arguments.
 * @param invoke {Object}
 * @returns {Object} return what target function return.
 */
Bridge.prototype.dispatch = function(invoke) {
	var ref = invoke.ref;
	var fun = invoke.fun;
	var args = invoke.args;

	log_time('DISPATCH_FLASH_START', ref, fun);

	var foo = null; // a function pointer
	var msg = '';
	var obj = null;
	if(ref){
		var o = this.objs[ref];
		if(!o){
			msg = "Bridge: '" + ref + "' object has not found.";
			log.error(msg);
			throw new Error(msg);
		}
		foo = o[fun];
		if(!foo){
			msg = "Bridge: Function '" + fun + "' in '" +
						ref + "' object has not found.";
			log.error(msg);
			throw new Error(msg);
		}
		obj = o;

	} else {
		foo = this.statics[fun];
		if(!foo){
			msg = "Bridge: Function '" + fun + "' has not found.";
			log.error(msg);
			throw new Error(msg);
		}

	};
	var ret = null;
	try{
		var result = foo.apply(obj, args);
		ret = {result: result};
	} catch (e){
		ret = {error: ""+e};
		log.error("JS_Dispatcher error", e, invoke);
	}

	log_time('DISPATCH_FLASH_END', ref, fun);
	return ret;

};

// To test this, run the following in JS console,
// bridge.flcall('bridge', 'test', 'bridge', 'test', 123)
// It will call flash side bridge object's test function, and the test will
// call back this js test method, passing 123 back.
Bridge.prototype.test = function(){
	log.info.apply(log, arguments);
};

/**
 * Register an object with given ref.
 * @param ref {String}
 * @param obj {Object}
 * @param is_static {Boolean}
 */
Bridge.prototype.register = function(obj, is_static){
	var ref = "obj_" + this.counter ++;
	if (is_static)
		this.statics[ref] = obj;
	else
		this.objs[ref] = obj;
	return ref;
};

/**
 * Remove an object with given ref.
 * @param ref {String}
 * @param is_static {Boolean}
 */
Bridge.prototype.remove = function(ref, is_static){
	if (is_static)
		delete this.statics[ref];
	else
		delete this.objs[ref];
};

/**
 * Check if given ref exists in either this.statics or this.objs
 * @param ref {String}
 * @param is_static {Boolean}
 * @returns {Boolean}
 */
Bridge.prototype.exist = function(ref, is_static)
{
	if (is_static)
		return ref in this.statics;
	else
		return ref in this.objs;
};

Bridge.prototype.getObject = function(ref)
{
	return this.objs[ref];
};



Bridge.prototype.shadow = function(obj, classname){
	if(!obj) throw new Error("Shadow object cannot be null.");
	var ref = this.register(obj);
	var remote_ref = this.flcall(Bridge.SelfID, 'shadow', ref, classname);
	var binder = new Binder(this, ref, remote_ref);
	obj.binding(binder);
	return ref;
};

/**
 * Binding object between JS and FL.
 * @param bridge {Bridge}
 * @param local_ref {String}
 * @param remote_ref {String}
 * @returns
 */
function Binder(bridge, local_ref, remote_ref)
{
	this.bridge = bridge;
	this.local_ref = local_ref;
	this.remote_ref = remote_ref;
}

Binder.prototype.flcall = function(fun){
	var args = toArray(arguments, 1);
	return this.bridge.flapply(this.remote_ref, fun, args);
};

Binder.prototype.flapply = function(fun, args){
	return this.bridge.flapply(this.remote_ref, fun, args);
};

Binder.prototype.destroy = function(){
	this.bridge.flcall(Bridge.SelfID, 'remove', this.remote_ref);
	this.bridge.remove(this.local_ref);
};

Binder.shadowMethods = function(names){
	methods = {};
	names.forEach(function(name){
		methods[name] = (function(){
			var _name = name;
			return function(){
				args = toArray(arguments);
				return this.binder.flapply(_name, args);
			};
		})();
	});
	return methods;
};

Binder.wrappedMethods = function(names){
	methods = {};
	names.forEach(function(name){
		methods[name] = (function(){
			var _name = name;
			return function(){
				args = toArray(arguments);
				return this.binder.flapply('wrappedApply', [_name, args]);
			};
		})();
	});
	return methods;
};

Binder.BindingMixin = {
		binder : null,
		binding : function(binder){
			this.binder = binder;
		}
};



//##FILE /Users/liang/Works/Projects/cloud/JsCloud/src/flash.net.js
//##import flash.interop.js

function FlashConnection(bridge){
	bridge.shadow(this, "net.FlashConnection");
}

extend(FlashConnection.prototype,
		EventListenerMixin,
		Binder.BindingMixin,
		Binder.shadowMethods(["getProperty", "setProperty"]),
		Binder.wrappedMethods(["connect", "close", "addHeader"]));

FlashConnection.prototype.remoteCall = function(command, responder){
	var ref = null;
	if(responder){
		ref = this.binder.bridge.register(responder);
	}
	var args = toArray(arguments, 2);
	this.binder.flcall('remoteCall', command, ref, args);
};

FlashConnection.prototype.createStream = function(peerID){
	var stream = new FlashStream(this.binder.bridge);

	// Bound this NetStream with given remote_ref FlashConnection
	stream.initConnection(this.binder.remote_ref, peerID);
	return stream;
};


function Responder(){
	this.result = function(){};
	this.status = function(){};
}

function FlashStream(bridge){
	bridge.shadow(this, 'net.FlashStream');
}

extend(FlashStream.prototype,
		EventListenerMixin,
		Binder.BindingMixin,
		Binder.shadowMethods(["getProperty", "setProperty",
		                      "initConnection", "addClientHandler"]),
		Binder.wrappedMethods(["play", "publish", "send",
		                       "appendBytes", "appendBytesAction", "close"]));

FlashStream.prototype._createStream = function(){
	var stream = new FlashStream(this.binder.bridge);
	return stream.binder.remote_ref;
};

FlashStream.prototype._onPeerConnect = function(fs_ref){
	var flashstream = this.binder.bridge.getObject(fs_ref);
	return this.onPeerConnect(flashstream);
};

FlashStream.prototype.onPeerConnect = function(flashstream){
	return true;
};


function FlashLocalConnection(bridge){
	bridge.shadow(this, 'net.FlashLocalConnection');
}

extend(FlashLocalConnection.prototype,
		EventListenerMixin,
		Binder.BindingMixin,
		Binder.shadowMethods(["getProperty", "setProperty", "addClientHandler"]),
		Binder.wrappedMethods(["allowDomain", "allowInsecureDomain", "close",
		                       "connect", "send"]));

FlashLocalConnection.onstatus = function(evt){//evt:{code:String, status:String}

};



//##FILE /Users/liang/Works/Projects/cloud/JsCloud/src/flash.net.peer.js
//##import util.js
//##import flash.net.js

P2PStreamPrefix = 'media_';
MessageHandlerName = 'message';

function FlashPeer(connection){
	this.connection = connection;
	this.neerID = connection.getProperty('nearID');
	this.farID = "";
	this.inStream = null;
	this.outStream = null;
	this.connected = false;
	this.outStreamPublish = '';
	this.inStreamPublish = '';
	this.connected = false;
};

extend(FlashPeer.prototype,
		EventListenerMixin);

FlashPeer.prototype.connect = function(farID){
	if(this.farID != '') throw new Error('FlashPeer: Cannot connect to another peer.');
	this._connect(farID);
};

FlashPeer.prototype._connect = function(farID){
	var self = this;
	this.farID = farID;
	this.outStreamPublish = P2PStreamPrefix+this.neerID+"_"+this.farID;
	this.inStreamPublish = P2PStreamPrefix+this.farID+"_"+this.neerID;

	var has_outStream_onPeerConnect_happened = false;
	this.outStream = this.connection.createStream("directConnections");
	this.outStream.addEventListener("netStatus", function(evt){
		log.debug("outStream Event", evt);
		if(evt.code == "NetStream.Play.Start"
			|| evt.code == "NetStream.Publish.Start"
				){
			if(has_outStream_onPeerConnect_happened)
				self._streamConnected(self.outStream);
		} else {
		}
	});
	this.outStream.onPeerConnect = function(){
		log.debug("OUTSTREAM_onPeerConnect");
		has_outStream_onPeerConnect_happened = true;
//		self._streamConnected(self.outStream);
		return true;
	};

	this.inStream = this.connection.createStream(farID);
	this.inStream.addEventListener("netStatus", function(evt){
		log.debug("inStream Event", evt);
		if(evt.code == "NetStream.Play.Start" ||
				evt.code == 'NetStream.Play.PublishNotify'){
			self._streamConnected(self.inStream);
		} else {
		}
	});
	this.inStream.addClientHandler(MessageHandlerName);
	this.inStream[MessageHandlerName] = function(data){
		self.dispatchEvent('message', data);
	};
	this.inStream.onPeerConnect = function(){
		log.debug("INSTREAM_onPeerConnect");
		self._streamConnected(self.inStream);
		return true;
	};

	this.outStream.publish(this.outStreamPublish);
	this.inStream.play(this.inStreamPublish);
};

FlashPeer.prototype._streamConnected = function(stream){
	var whichone = '';
	if(stream == this.outStream) whichone = 'outStream';
	if(stream == this.inStream) whichone = 'inStream';
	log.debug('INVOKE_streamConnected_BEGIN', whichone);

	stream.__FlashPeer_connected = true;
	if(this.inStream.__FlashPeer_connected &&
			this.outStream.__FlashPeer_connected){
		if(!this.connected){
			log.debug('INVOKE_streamConnected_CONNECTED', whichone);
			this.connected = true;
			this.dispatchEvent('connected', this.farID);
		}
	}
};

FlashPeer.prototype.send = function(msg){
	this.outStream.send(MessageHandlerName, msg);
};

// Events
FlashPeer.prototype.onconnected = function(){};
FlashPeer.prototype.onmessage = function(){};


function FlashPeerManager(bridge){
	var self = this;
	this.connected = false;
	this.bridge = bridge;
	this.connection = new FlashConnection(this.bridge);
	this.connection.addEventListener('netStatus', function(evt){
		if(evt.code == 'NetConnection.Connect.Success'){
			self.connected = true;
			self._publishListeningStream();
			self.dispatchEvent('connected', self.connection);
		} else {
			log.debug("ConnectionNetStatus", evt);
		}
	});
	this.nearID = '';
	this.peers = {}; //connected peers
	this.pubStream = null;
	this.connectingPeers = {}; //
};

extend(FlashPeerManager.prototype,
		EventListenerMixin);

FlashPeerManager.prototype._publishListeningStream = function(){
	var connection = this.connection;
	var self = this;
	var nearID = connection.getProperty('nearID');
	this.nearID = nearID;
	this.pubStream = connection.createStream("directConnections");
	this.pubStream.addEventListener('netStatus', function(evt){
		log.debug('pubStream', evt); // Waiting for connecting peers.
	});
	this.pubStream.onPeerConnect = function(_stream){
		var farID = _stream.getProperty('farID');
		log.debug('pubStream onPeerConnect', farID);
		self._createPeer(farID);
		return false;
	};
	this.pubStream.publish(P2PStreamPrefix+nearID);
};

FlashPeerManager.prototype._createPeer = function(farID){
	var self = this;
	var peer = new FlashPeer(self.connection);
	peer.addEventListener('connected', function(evt){
		log.debug('FlashPeerManager_peer_CONNECTED', farID);
		delete self.connectingPeers[farID];
		self.peers[farID] = peer;
		self.dispatchEvent('peerConnected', peer);
	});
	peer.addEventListener('message', function(data){
		self.dispatchEvent('peerMessage', {data:data, peer:peer});
	});
	self.connectingPeers[farID] = peer;
	peer.connect(farID);
	return peer;
};

FlashPeerManager.prototype.connected = function(){
	return this.connection.getProperty('connected');
};

FlashPeerManager.prototype.connectServer = function(command){
	// Flash NetConnection.connect()
	// public function connect(command:String, ... arguments):void
	this.connection.connect(command);
};

FlashPeerManager.prototype.connectPeer = function(farID){
	if(this.connectingPeers[farID] || this.peers[farID]) return;

	this._createPeer(farID);
	// Probe stream, inform farID peer that this peer is going to connect.
	var probeStream = this.connection.createStream(farID);
	probeStream.addEventListener('netStatus', function(evt){
		log.debug('probeStream', evt);
	});
	probeStream.play(P2PStreamPrefix+farID);
};

FlashPeerManager.prototype.hasConnectedPeer = function(farID){
	return farID in this.peers;
};

FlashPeerManager.prototype.send = function(farID, msg){
	if(farID == this.nearID) throw new Error('FlashPeerManager cannot send message to self.');
	var peer = this.peers[farID];
	if(peer){
		peer.send(msg);
		return true;
	}
	return false;
};

FlashPeerManager.prototype.onconnected = function(){};
FlashPeerManager.prototype.onpeerMessage = function(){};
FlashPeerManager.prototype.onpeerConnected = function(){};


//##FILE /Users/liang/Works/Projects/cloud/JsCloud/src/flash.net.messenger.js
//##import util.js
//##import flash.net.js
//##import flash.net.peer.js

/**
 * A high level Flash P2P Messenger.
 *
 * It automatically connects to new peer, and buffer unsent messages. Resume
 * sending when peer connection established.
 */
function FlashPeerMessenger(manager){
	this.manager = null;
	this.sending_buffer = [];

	if(manager)
		this.init(manager);
}

extend(FlashPeerMessenger.prototype,
		EventListenerMixin);

FlashPeerMessenger.prototype.init = function(manager){
	if(!manager) throw new Error("FlashPeerMessenger cannot init with null object.");
	if(this.manager) throw new Error("FlashPeerMessenger cannot be re-init.");

	var self = this;
	this.manager = manager;
	var _wrapped_processSending = function(){
		self._processSending();
	};
	this.manager.addEventListener('connected', _wrapped_processSending);
	this.manager.addEventListener('peerConnected', _wrapped_processSending);
	this.manager.addEventListener('peerMessage', function(evt){
		var receiving = {farID: evt.peer.farID, msg: evt.data, _evt:evt};
		self.dispatchEvent('message', receiving);
	});
	self._processSending();
};

FlashPeerMessenger.prototype._processSending = function(){
	if(!(this.ready() && this.manager.connected)) return;

	var lst = [];
	this.sending_buffer.forEach(function(sendmsg){
		var farID = sendmsg.farID;
		var msg = sendmsg.msg;
		var callback = sendmsg.callback;
		if(!this.manager.hasConnectedPeer(farID)){
			lst.push(sendmsg);
			this.manager.connectPeer(farID);
		} else {
			log.debug('FlashPeerMessenger_send', farID);
			this.manager.send(farID, msg);
			try{
				if(callback)
					callback(sendmsg);
			} catch (e){
				log.error("FlashPeerMessenger caught an error on invoking after sending callback.", e);
			}
		}
	}, this);
	this.sending_buffer = lst;
};

/**
 * Return true if FlashPeerMessenger has initialed with FlashPeerManager.
 */
FlashPeerMessenger.prototype.ready = function(){
	return this.manager ? true : false;
};

FlashPeerMessenger.prototype.send = function(farID, msg, callback){
	var sendmsg = {farID: farID, msg: msg, callback: callback};
	this.sending_buffer.push(sendmsg);
	this._processSending();
	return sendmsg;
};

FlashPeerMessenger.prototype.onmessage = function(evt){};


/*
 * FlashLocalMessenger
 * - packet(packet: Packet):void
 * - open(endpoint: String):void throws Error #if endpoint is occupied
 * - close():void
 * - send(endpoint: String, message: String, callback): void
 * - onmessage(msg: Message):void
 *
 * Message
 * - from: String
 * - to  : String
 * - data: String
 *
 * Packet
 * - from: String
 * - to  : String
 * - type: PacketTypeEnum
 *  + MessageBegin
 *  + MessageEnd
 *  + Ack
 * - ref : int  # reference counter
 * - data: string # payload, only string is supported at the moment.
 *
 */

function FlashLocalMessenger(bridge){
	var self = this;
	this.bridge = bridge;
	this.lc = null; // create when call open
	this.lc = new FlashLocalConnection(this.bridge);
	this.lc.addClientHandler(FlashLocalMessenger.PACKET);
	this.lc.addEventListener(function(evt){self._status(evt);});
	this.lc.packet = (function(pkt){self.packet(pkt);});
	this.endpoint = '';

	this.message_queue = [];
	this.senderWindow = new SenderWindow(this);
	this.recvWindow = new RecvWindow(this);
}

extend(FlashLocalMessenger.prototype,
		EventListenerMixin);

FlashLocalMessenger.SEND_LIMIT = 10240;
// There is a 40 kilobyte limit to the amount of data you can pass as
// parameters to this command.
// http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/net/LocalConnection.html
FlashLocalMessenger.MSG_MSG = "MSG_MSG";
FlashLocalMessenger.MSG_END = "MSG_END";
FlashLocalMessenger.MSG_ACK = "MSG_ACK";
FlashLocalMessenger.PACKET = 'packet';

FlashLocalMessenger.prototype._status = function(evt){
	if(evt.level == 'error'){
		if(this.senderWindow.message.callback){
			var pkt = this.senderWindow.pkt;
			var evt = {from: pkt.from, to: pkt.to, content:
				this.senderWindow.message.content,
				status: 'error'};
			this.senderWindow.message.callback(evt); // TODO: try_catch
		}
		this.senderWindow.clear();
		this._send();
	}
};

FlashLocalMessenger.prototype.packet = function(pkt){
	if(pkt.type == FlashLocalMessenger.MSG_ACK){
		this._send();
	} else {
		var _pkt = this.recvWindow.recv(pkt);
		this.lc.send(_pkt.to, FlashLocalMessenger.PACKET, _pkt);
	}
};

FlashLocalMessenger.prototype.open = function(endpoint){
	this.lc.connect(endpoint);
	this.endpoint = endpoint;
};

FlashLocalMessenger.prototype.close = function(){
	this.lc.close();
	this.endpoint = '';
};

FlashLocalMessenger.prototype.send = function(endpoint, content, callback){
	if(this.endpoint == '') throw new Error('The connection is not open.');
	var sendingMsg = new SendingMessage(endpoint, content, callback);
	this.message_queue.push(sendingMsg);
	this._send();
	return sendingMsg;
};

FlashLocalMessenger.prototype._send = function(){
	var pkt = null;
	if(this.senderWindow.message){
		pkt = this.senderWindow.nextPkt();
		if(pkt == null){
			this.senderWindow.message = null;
		}
	}

	if(this.message_queue.length > 0 && this.senderWindow.message == null){
		pkt = this.senderWindow.nextPkt(this.message_queue.shift());
	}
	if(this.senderWindow.message == null) {
		// finished sending
		return;
	}

	this.lc.send(pkt.to, FlashLocalMessenger.PACKET, pkt); // TODO: refact send
};

FlashLocalMessenger.prototype.onmessage = function(){

};

function SendingMessage(endpoint, content, callback){
	this.endpoint = endpoint;
	this.content = content;
	this.callback = callback;
}

function SenderWindow(messenger){
	this.messenger = messenger;
	this.message = null;
	this.pkt = null;
	this.pkt_offset = 0;
	this.pkt_length = 0;
	this.ref = 0;
}

SenderWindow.prototype.nextPkt = function(message){
	if(message){
		this.message = message;
		this.pkt_offset = 0;
		var len = message.content.length;
		this.pkt_length = len <= FlashLocalMessenger.SEND_LIMIT ? len : FlashLocalMessenger.SEND_LIMIT;
	} else {
		var len = this.message.content.length;
		if(this.pkt_offset + this.pkt_length >= len){
			if(this.message.callback){
				var pkt = this.pkt;
				var evt = {from: pkt.from, to: pkt.to, content:
					this.message.content,
					status: 'DONE'};
				this.message.callback(evt); // TODO: try_catch
			}
			return null;
		} else {
			this.pkt_offset += this.pkt_length;
			this.pkt_length = this.pkt_offset + FlashLocalMessenger.SEND_LIMIT <= len ?
					FlashLocalMessenger.SEND_LIMIT : len - this.pkt_offset;
		}
	}
	var _type = (this.pkt_offset + this.pkt_length) == this.message.content.length ?
			FlashLocalMessenger.MSG_END : FlashLocalMessenger.MSG_MSG;
	var data = this.message.content.substr(this.pkt_offset, this.pkt_length);
	this.pkt = {
			from: this.messenger.endpoint,
			to: this.message.endpoint,
			type: _type,
			data: data,
			ref : this.nextRef()
	};
	return this.pkt;
};

SenderWindow.prototype.clear = function(){
	this.message == null;
};

SenderWindow.prototype.nextRef = function(){
	this.ref = SenderWindow.next_ref(this.ref);
	return this.ref;
};

SenderWindow.MAX_REF_COUNT = 65535;

SenderWindow.next_ref = function(ref){
	return (ref + 1) % SenderWindow.MAX_REF_COUNT;
};


function RecvWindow(messenger){
	this.messenger = messenger;
	this.buffers = {};
}

RecvWindow.prototype.recv = function(pkt){
	if(this.messenger.endpoint != pkt.to) throw new Error('Endpoint assert fail.');
	var buffer = this.buffers[pkt.from];
	if(!buffer){
		buffer = new RecvWindowBuffer(this.messenger, pkt.from);
		this.buffers[pkt.from] = buffer;
	}
	return buffer.recv(pkt);
};

function RecvWindowBuffer(messenger, from){
	this.messenger = messenger;
	this.from = from;
	this.ref = 0;
	this.buf = [];
}

RecvWindowBuffer.prototype.recv = function(pkt){
	this.ref = SenderWindow.next_ref(pkt.ref);
	this.buf.push(pkt.data);
	if(pkt.type == FlashLocalMessenger.MSG_END){
		var evt = {from: pkt.from, to:pkt.to,
				content: this.buf.join(''), status: 'OK'};
		this.messenger.dispatchEvent('message', evt);
		this.buf = [];
	}
	return {
		from: pkt.to,
		to: pkt.from,
		type: FlashLocalMessenger.MSG_ACK,
		data: '',
		ref: this.ref
		};
};




//##FILE /Users/liang/Works/Projects/cloud/JsCloud/src/flash.net.urlloader.js
//##import flash.interop.js

function FlashURLRequest(bridge){
	bridge.shadow(this, "net.FlashURLRequest");
};

extend(FlashURLRequest.prototype,
		Binder.BindingMixin,
		Binder.shadowMethods(["getProperty", "setProperty"]));


function FlashURLLoader(bridge){
	bridge.shadow(this, "net.FlashURLLoader");
	// events: ["complete", "open", "progress", "securityError",
	//          "httpStatus", undefined, "ioError"]
};

extend(FlashURLLoader.prototype,
		EventListenerMixin,
		Binder.BindingMixin,
		Binder.shadowMethods(["getProperty", "setProperty"]),
		Binder.wrappedMethods(["close"]));

FlashURLLoader.prototype.load = function(request){
	var ref = request.binder.remote_ref;
	return this.binder.flapply("load", [ref]);
};

FlashURLLoader.prototype.getData = function(){
	return this.getProperty('data');
};

//FlashURLLoader.prototype.dispatchEvent = function(){
//	var args = toArray(arguments);
//	log.debug(args);
//	EventListenerMixin.dispatchEvent.apply(this, args);
//};


var FlashURL = {};

FlashURL.setBridge = function(bridge){
	FlashURL.bridge = bridge;
};

FlashURL.getBridge = function(){
	return FlashURL.bridge;
};

FlashURL.ajax = function(url, settings){
	settings = settings || {};
	if(typeof(url) === 'string'){
		settings.url = url;
	}

	var bridge = settings.bridge || FlashURL.getBridge();
	if(!bridge) throw new Error('Flash bridge not found.');

	var $j = jQuery || window.jQuery;
	if(!$j) throw new Error('jQuery not found.');
	var deferred = new $j.Deferred();

	var request = new FlashURLRequest(bridge);
	request.setProperty('url', settings.url);

	var loader = new FlashURLLoader(bridge);
	loader.load(request);

	// "complete", "open", "progress", "securityError",
	//          "httpStatus", undefined, "ioError"]

	loader.addEventListener("complete", function(evt){
		log.debug("FlashURL Ajax complete", evt);
		evt.loader = loader;
		deferred.resolve(evt);
	});
	loader.addEventListener("open", function(evt){
		log.debug("FlashURL Ajax open", evt);
		evt.loader = loader;
	});
	loader.addEventListener("progress", function(evt){
		log.debug("FlashURL Ajax progress", evt);
	});
	loader.addEventListener("securityError", function(evt){
		log.debug("FlashURL Ajax securityError", evt);
		evt.loader = loader;
		deferred.reject(evt);
	});
	loader.addEventListener("httpStatus", function(evt){
		log.debug("FlashURL Ajax httpStatus", evt);
	});
	loader.addEventListener("ioError", function(evt){
		log.debug("FlashURL Ajax ioError", evt);
		evt.loader = loader;
		deferred.reject(evt);
	});


	return deferred.promise();
};

//##FILE /Users/liang/Works/Projects/cloud/JsCloud/src/flash.js
//##import flash.interop.js
//##import flash.net.js
//##import flash.net.peer.js
//##import flash.net.messenger.js
//##import flash.net.urlloader.js
//##FILE /Users/liang/Works/Projects/cloud/JsCloud/src/util.base64.js
Base64 = {
		_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
		encode: function (input) {
			var output = "";
			var bch2 = false, bch3 = false;
			var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
			var i = 0;
			while (i < input.length) {
				chr1 = input.charCodeAt(i++) & 0xff;
				bch2 = isNaN(input.charCodeAt(i));
				chr2 = input.charCodeAt(i++) & 0xff;
				bch3 = isNaN(input.charCodeAt(i));
				chr3 = input.charCodeAt(i++) & 0xff;
				enc1 = chr1 >> 2;
				enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
				enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
				enc4 = chr3 & 63;
				if (bch2) {
					enc3 = enc4 = 64;
				}
				else if (bch3) {
					enc4 = 64;
				}
				output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
			}
			return output;
		},

		// public method for decoding
		decode : function (input) {
			var output = "";
			var chr1, chr2, chr3;
			var enc1, enc2, enc3, enc4;
			var i = 0;

			//input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

			while (i < input.length) {

				enc1 = this._keyStr.indexOf(input.charAt(i++));
				enc2 = this._keyStr.indexOf(input.charAt(i++));
				enc3 = this._keyStr.indexOf(input.charAt(i++));
				enc4 = this._keyStr.indexOf(input.charAt(i++));

				chr1 = (enc1 << 2) | (enc2 >> 4);
				chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
				chr3 = ((enc3 & 3) << 6) | enc4;

				output = output + String.fromCharCode(chr1);

				if (enc3 != 64) {
					output = output + String.fromCharCode(chr2);
				}
				if (enc4 != 64) {
					output = output + String.fromCharCode(chr3);
				}

				chr1 = chr2 = chr3 = "";
		        enc1 = enc2 = enc3 = enc4 = "";


			}

			//output = Base64._utf8_decode(output);

			return output;

		}
};
//##FILE /Users/liang/Works/Projects/cloud/JsCloud/src/browser.storage.js
/**
 * Create a LRUStorage obj. This is a wrapper of original storage.
 * The storage is http://dev.w3.org/html5/webstorage/
 * @constructor
 * @param {Storage} storage The under hook storage obj.
 */
var WC_DEBUG = true;
function LRUStorage(storage) {
	if (!window.localStorage) {
		if (WC_DEBUG) log.error('localStorage not supported.');
	}

	this._storage = storage || window.localStorage;
};
LRUStorage.STORAGE_ITME_LIST_KEY = "LOCAL_LIST";
LRUStorage.prototype = {

		getItem: function (key) {
			var val = this._storage.getItem(key);
			if (!val) return val;

			// key exist
			var ilist = this._getItemList();
			var list = [];
			for (var i = 0, j = ilist.length; i < j; i++) {
				var it = ilist[i];
				if (it == key) continue;
				list.push(it);
			}
			list.push(key);
			this._updateItemList(list);
			return val;
		},

		setItem: function (key, data) {
			var ilist = this._getItemList();
			var list = [];
			for (var i = 0, j = ilist.length; i < j; i++) {
				var it = ilist[i];
				if (it == key) continue;
				list.push(it);
			}
			list.push(key);
			while (list) {
				try {
					this._storage.setItem(key, data);
					break;
				}
				catch (e) {
					// in Chrome e.name=='QUOTA_EXCEEDED_ERR'
					var di = list.shift();
					this._storage.removeItem(di);
					if (WC_DEBUG) log.log('QUOTA_EXCEEDED_ERR: ' + key + ", remove: " + di);
				}
			}
			this._updateItemList(list);
		},
		removeItem: function (key) {

			// key exist
			var ilist = this._getItemList();
			var list = [];
			for (var i = 0, j = ilist.length; i < j; i++) {
				var it = ilist[i];
				if (it == key) continue;
				list.push(it);
			}
			this._storage.removeItem(key);
			this._updateItemList(list);
		},
		itemList: function () {
			return this._getItemList();
		},
		_getItemList: function () {
			var itemlistkey = LRUStorage.STORAGE_ITME_LIST_KEY;
			var str = this._storage.getItem(itemlistkey);
			var itemlist = null;
			if (str === undefined || str == null) {
				itemlist = [];
				str = JSON.stringify(itemlist);
				this._storage.setItem(itemlistkey, str);
			} else {
				itemlist = JSON.parse(str);
			}
			return itemlist;
		},
		_updateItemList: function (itemlist) {
			var itemlistkey = LRUStorage.STORAGE_ITME_LIST_KEY;
			//var itemlist = this._storage.getItem(itemlistkey);
			var list = itemlist;
			while (list) {
				var str = JSON.stringify(list);
				try {
					this._storage.setItem(itemlistkey, str);
					break;
				}
				catch (e) {
					var ets = typeof e;
					if (ets == 'QUOTA_EXCEEDED_ERR') {
						var di = list.shift();
						this._storage.removeItem(di);
						if (WC_DEBUG) log.log('QUOTA_EXCEEDED_ERR: _updateItemList: remove: ' + di);
					} else {
						if (WC_DEBUG) log.error('LRUStorage: ' + e); // Something weird happen.
						break;
					}
				}
			}
		}
};

//##FILE /Users/liang/Works/Projects/cloud/JsCloud/src/cloud.resource.js
//##import util.lang.js
//##import flash.js

function NetLoader(bridge){
	this.bridge = bridge;
}

NetLoader.prototype.load = function(){

};

function Loading(key, url, callback){
	this.key = key;
	this.url = url;
	this.callback = callback;
	this.status = 'init';// wait_server|wait_peer|error|done
	this.peer = '';
	this.tick = 0; // count down counter
	this.data = null;
}
Loading.INIT = 'init';
Loading.WAIT_SERVER = 'wait_server';
Loading.WAIT_PEER = 'wait_peer';
Loading.ERROR = 'error';
Loading.DONE = 'done';


function CachePool(){
	this._cache = new LRUStorage();
}

extend(CachePool.prototype,
		EventListenerMixin);

CachePool.prototype.get = function(key){
	return this._cache.getItem(key);
};

CachePool.prototype.set = function(key, value){
	var oldkeys = this.keys();
	this._cache.setItem(key, value);
	var newkeys = this.keys();
	var evt = {pool: this, oldkeys:oldkeys, newkeys:newkeys, key:key, value:value};
	this.dispatchEvent('update', evt);
};

CachePool.prototype.keys = function(){
	return this._cache.itemList();
};

CachePool.prototype.onupdate = function(){};


function guessMimeType(filename) {
	var type = "image/jpeg";
	if (filename.match(/.jpg$/i)) type = "image/jpeg";
	else if (filename.match(/.jpeg$/i)) type = "image/jpeg";
	else if (filename.match(/.gif$/i)) type = "image/gif";
	else if (filename.match(/.png$/i)) type = "image/png";
	else {
//		log.warn("Warning: Unable to determine content type of " + filename);
		type = "application/x-binary";
	}
	return type;
}

function PeerLoader(bridge){
	var self = this;
	this.pm = new FlashPeerManager(bridge);
	this.pm.addEventListener('connected', function(connection){
		log.info('Connected to server', self.pm.nearID);
	});
	this.msgr = new FlashPeerMessenger(this.pm);
	this.msgr.addEventListener('message', function(sender){
		var evt = sender.msg;
		var cmd = evt.cmd;
		log.debug('onPeerMessage', cmd);
		if(cmd == 'requestPeerItem'){
			var item = evt.item;
			var data = self.cachepool.get(item);
			self.msgr.send(sender.farID,
					{cmd:'responsePeerItem', data: data, item: item}, null);
		}
		if(cmd == 'responsePeerItem'){
			var key = evt.item;
			var datauri = evt.data;
			self.cachepool.set(key, datauri);
		}
	});

	this.loading_list = [];
	this.cachepool = new CachePool();
	this.cachepool.addEventListener('update', function(evt){
		var oldkeys = evt.oldkeys;
		var newkeys = evt.newkeys;
		var key = evt.key;

		// Load DONE
		var lst = [];
		var calllst = [];
		self.loading_list.forEach(function(loading){
			if(loading.key == key){
				loading.data = evt.value;
				loading.status = Loading.DONE;
				calllst.push(loading);
			}else{
				lst.push(loading);
			}
		}, self);
		self.loading_list = lst;
		calllst.forEach(function(loading){
			self._loading_callback(loading);
		}, this);

		self.sendCacheList(oldkeys, newkeys);

	});
}

PeerLoader.prototype._loading_callback = function(loading){
	if(loading.callback){
		try{
			loading.callback(loading);
		} catch(e){
			log.error('Caught an error while executing loading.callback().', e);
		}
	}
};

PeerLoader.prototype.sendCacheList = function(oldkeys, newkeys){
	var self = this;
	if(!oldkeys && !newkeys){
		oldkeys = []; newkeys = self.cachepool.keys();
	}
	function _processItemList(oldItems, newItems){

		items = newItems;

		var adds = [];
		var dels = [];
		var tmp = {};
		oldItems.forEach(function(elm, idx, arr){
			tmp[elm] = true;
		});
		items.forEach(function(elm, idx, arr){
			if(!elm) return;
			if(elm in tmp) {
				delete tmp[elm];
				return;
			} else {
				adds.push(elm);
			}
		});
		dels = Object.keys(tmp);

		_sendItems('addItems', adds);
		_sendItems('removeItems', dels);

	}

	function _sendItems(cmdname, items){
		if(!items || items.length == 0 ) return;

		var lst = items.slice(0);
		var k = lst.length;

		while(lst.length != 0){
			var itms = lst.slice(0, k);
			var s = itms.join('","');
			if(s.length > 1000){
				k = k / 2;
				if(k == 0) throw new Error("ERROR_FILENAME_TOO_LONG", lst);
				continue;
			}

			var cmd = {cmd: cmdname, items: itms};
			_sendJsonMsg(cmdname, cmd);

			lst = lst.slice(k);
			k = lst.length;
		}
	}

	function _sendJsonMsg(cmdname, obj){
		var cmd = JSON.stringify(obj);
		self.remoteCall(cmdname, null, cmd);
	}
	_processItemList(oldkeys, newkeys);
};

PeerLoader.prototype.connect = function(serverAddress){
	this.pm.connectServer(serverAddress);
};

PeerLoader.prototype.remoteCall = function(cmd, responder, obj){
	this.pm.connection.remoteCall(cmd, responder, obj);
};

PeerLoader.prototype.requestPeerItem = function(peerid, key){
	this.msgr.send(peerid, {cmd:'requestPeerItem', item:key}, null);
};

PeerLoader.prototype.process = function(){
	var self = this;
	var lst = [];
	var calllst = [];
	this.loading_list.forEach(function(loading){
		if(loading.status == Loading.INIT){
			var key  = loading.key;
			var item = key;

			var data = self.cachepool.get(key);
			if(data){
				loading.data = data;
				loading.status = Loading.DONE;
				calllst.push(loading);
				return;
			}

			var responder = new Responder();
			responder.result = function(result){
//				log_time('get back from server', result.item);
				log.debug('requestItem_responder_result', result.cmd, result.item, result.peerid);

				if(result.cmd == 'requestItem'){

					if(!result.peerid){
						self.loadOrigin(result.item);
						return;
					}
//					console.log('requestItem', result.item, result.peerid);
					loading.status = Loading.WAIT_PEER;
					self.requestPeerItem(result.peerid, key);
				}
			};
			responder.status = function(){
				// TODO: handle error
				log.debug('requestItem_responder_status', arguments);
				// call load_fail
			};
//			log_time('start request server', item);
			self.remoteCall('requestItem', responder, {cmd: 'requestItem', item: item});
			loading.status = Loading.WAIT_SERVER;
		};
		lst.push(loading);
	}, this);
	self.loading_list = lst;
	calllst.forEach(function(loading){
		self._loading_callback(loading);
	}, this);
};

PeerLoader.prototype._load_fail = function(key){
	var self = this;
	var lst = [];
	var calllst = [];
	self.loading_list.forEach(function(loading){
		if(loading.key == key){
			loading.status = Loading.ERROR;
			calllst.push(loading);
		}else{
			lst.push(loading);
		}
	}, self);
	self.loading_list = lst;
	calllst.forEach(function(loading){
		_loading_callback(loading);
	}, this);
};

PeerLoader.prototype.loadOrigin = function(item){
	var self = this;
	var xhr = new XMLHttpRequest();
	xhr.open('GET', item, true);
	xhr.overrideMimeType('text/plain; charset=x-user-defined');
	xhr.onreadystatechange = (function (){
		return function (aEvt) {
			if (xhr.readyState == 4) {
				if(xhr.status == 200){
					var txt = xhr.responseText;
					var b64_txt = Base64.encode(txt);
					var mime = guessMimeType(item);
					var datauri = 'data:' + mime + ';base64,' + b64_txt;
					self.cachepool.set(item, datauri);
				}
				else{
					log.error('Error', xhr.statusText);
					self._load_fail(item);
				};
			};
		};
	})();
	xhr.send(null);
};

PeerLoader.prototype.load = function(loading){
	this.loading_list.push(loading);
	this.process();
};
//##FILE /Users/liang/Works/Projects/cloud/JsCloud/src/cloud.js
//##import flash.js
//##import util.base64.js
//##import browser.storage.js
//##import cloud.resource.js
//##FILE /Users/liang/Works/Projects/cloud/JsCloud/app/privio.cloud.js
//##import cloud.js
