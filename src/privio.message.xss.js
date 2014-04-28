//#import priviobase.js

var CrossDomainRequest = function(ishost){

	this.ishost = ishost === void 0 ? window.parent == window : ishost;
	this.container = document.body;
	this.iframe = null;
	this.contentWindow = null;
	this.url = '';
	this.domain = '';
	this.receiveMessageHandler = null;
	this.connected = false;
	this.isFailureConnection = false;

	this.messageHandler = null;

	this.buffer = [];
};

extend(CrossDomainRequest.prototype,
		EventListenerMixin);

CrossDomainRequest.ConnectionTimeout = 1000;

CrossDomainRequest.prototype.appendIframe = function(iframe, container){
	var self = this;
	if(!iframe){
		iframe = document.createElement('iframe');
		var url = this.url;
		if(url.substr(0,5).toLowerCase() != location.protocol){
			url+="?"+jQuery.param({referrer:location.href});
			this.url = url;
		}
		$(iframe).attr('src', url).hide();
		$(iframe).load(function(event){
//			console.debug('iframe', self.url, 'loaded', event);
			setTimeout(function(){
				if(!self.connected){
					self.isFailureConnection = true;
					self.dispatchEvent('error', "ERROR:CrossDomainRequest: Connection Fail.");
				}
			}, CrossDomainRequest.ConnectionTimeout);
		});
	}
	this.iframe = iframe;
	if(container){
		this.container = container;
	}
	$(this.container).append(this.iframe);
	this.contentWindow = iframe.contentWindow;
};

CrossDomainRequest.prototype.receiveMessage = function(event){
	var origin = event.origin;
	if(origin != this.domain)return;
	this.dispatchEvent('message', event);
	var obj = event.data;
	if(obj && obj.type == 'event'){
		var evtname = obj.name;
		var evt = obj; evt.raw = event;
		this.dispatchEvent(evtname, evt);
	}
};

/**
 * Post data to target iframe. If not connected, data will be buffered.
 */
CrossDomainRequest.prototype.postMessage = function(data){
	if(this.isFailureConnection) return false;
	if(!this.connected){
		this.buffer.push(data);
		return true;
	}
	this.contentWindow.postMessage(data, this.domain);
	return true;
};

CrossDomainRequest.prototype.connect = function(url){
	if(this.receiveMessageHandler)
		throw new Exception('The connect has been called.');
	var self = this;
	this.url = url;
	this.domain = ''+url.match(/http[s]?\:\/\/[^\/]*/);
	this.receiveMessageHandler = function(event){
		var source = event.source;
		if(source != self.contentWindow) return;
		self.receiveMessage(event);
	};
	window.addEventListener("message", this.receiveMessageHandler, false);
	if(this.ishost){
		this.appendIframe();
	} else {
		this.contentWindow = window.parent;
		var evt = {type:'event', name:'connected'};
		this.postMessage(evt);
		this.dispatchEvent('connected', evt);
	}
};

CrossDomainRequest.prototype.addMessageHandler = function(handler){
	this.messageHandler = handler;
};

CrossDomainRequest.prototype.onmessage = function(event){
	var handler = this.messageHandler;

	var msg = event.data;
	var func = msg && msg.cmd && handler && handler[msg.cmd];

//	log.debug('receiveMessage from', event.origin, event);

	if(func){
//		console.log('SubFS receiveMessage', msg.cmd, msg.args);
		func.apply(handler, msg.args);
	} else {
	}
};

CrossDomainRequest.prototype.onerror = function(){};

CrossDomainRequest.prototype.onconnected = function(){
	this.connected = true;
	this.buffer.forEach(function(data){
		this.postMessage(data);
	}, this);
};

