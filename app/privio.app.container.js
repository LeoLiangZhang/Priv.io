// This code depends on jQuery.

var DOMAIN = 'https://priv.io';
//var app_url = 'http://priv.io/caja_exp/app1.html';
//app_url = 'http://feed.app.priv.io/index.html';
//app_url = 'http://caja.app.priv.io/app/cajafeed/index.html';

var app_url = location.search;
app_url = app_url.split('=')[1];
app_url = decodeURIComponent(app_url);
console.log("Cajaing:", app_url);

var uriPolicy = {
		rewrite: function(uri) {
			console.log("rewrite: "+uri);
			//if (/liang/.test(uri)) { return uri; }
			return uri;
		}
};
uriPolicy = null;
var consoleDebug = function(){
//	console.debug("DEBUG:", arguments);
};

caja.initialize({
	cajaServer: '//priv.io/caja/',
	debug: false,
	es5Mode:false,
	console: {log:consoleDebug},
	log:consoleDebug
//	,forceES5Mode: true
});


caja.whenReady(function(){

});

var paja = {};
var make_caja_objects = function(){

	var consoleLog = function(){
		console.log(arguments);
	};
	

	var listeners = [];
	var addMessageCallback = function(callback){
		listeners.push(callback);
	};

	var setDataURI = function(num, data){
		num = num - 0; // make sure it's a number
		$('[data-caja-tmpid='+num+']').attr('src', data);
//		if(data.indexOf('data:') == 0){ // This causes /img/p.png not showing
//		}
	};

	var receiveMessageHandler = function(event){
		consoleDebug("receiveMessageHandler begin:", event, event.data);
		var data = event.data;
		//caja.markReadOnlyRecord(event);
	    var tamedEvent = {data:data, origin:DOMAIN};//caja.tame(data);
	    
	    for (var i = 0; i < listeners.length; i++) {
	      listeners[i](tamedEvent);  
	    }
	    
	    consoleDebug("receiveMessageHandler finished:", event);
		
	};
	window.addEventListener("message", receiveMessageHandler, false);

	
	var _sanitize = function(arg){
		delete arg['Prototype___'];
		var lst = [];
		for(var i in arg){
			if(i.search("_index;") == 0){
				lst.push(i);
			}
		}
		lst.forEach(function(elm){
			delete arg[elm];
		});
		return arg;
	};

	var sanitize = function(args){
		var lst = [];
		args.forEach(function(arg){
			arg = _sanitize(arg);
			lst.push(arg);
		});
		return lst;
	};

	var postMessage = function(message){
		consoleDebug('Before post.', message);
		var args = sanitize(message.args);
		var msg = {id:message.id, cmd:message.cmd, args:args};
		window.parent.postMessage(msg, DOMAIN);
		consoleDebug("After post", msg);
	};
	
	
	var openFile = (function(){
		var has_init = false;
		var callback = null;
		var $elm = $('<input type="file" style="display:none">');
		var init_FileElm = function(){
			if(has_init) return;
			$('body').append($elm);
			$elm.on('change', function(event){
				if(!$.isFunction(callback)) return; // don't read when no callback is registered.
				var lst_data = [];
				var len = $elm[0].files.length;
				var addFile = function(meta){
					lst_data.push(meta);
					if(lst_data.length == len){
						callback(lst_data);
					}
				};
				$.each($elm[0].files, function(i, file){
					var reader = new FileReader();
					reader.onload = function(evt) {
						var meta = {
								data: evt.target.result,
								name: file.name,
								size: file.size,
								type: file.type,
								lastModifiedDate: file.lastModifiedDate
						};
						addFile(meta);
					};
					reader.readAsDataURL(file);
				});
			});
			has_init = true;
		};
		return function(cb){
			init_FileElm();
			callback = cb;
			$elm.click();
			// callback: function([list_of_file])
		};
	})();
	
	var xmlToObj = function(node, obj) {
		var i, l;
		if (!obj) {
			node = node.firstChild;
			obj = {};
		}
		if (node.childNodes.length) {
			for (i = 0, l = node.childNodes.length; i < l; i++) {
				var child = node.childNodes[i];

				// if this node only contains text, just return the text
				if (l === 1 && child.nodeType === 3) return child.nodeValue;

				var name = child.nodeName.replace(/^[A-Z]/, function(match) {
					return match.toLowerCase();
				});
				if (node.getElementsByTagName(child.tagName).length > 1) {
					// this is an array, create it and add to it
					if (!obj[name]) obj[name] = [];
					obj[name].push(xmlToObj(child, {}));
				} else if (child.nodeName && child.nodeName != '#cdata-section') {
					obj[name] = xmlToObj(child, {});
				}
			}
		} else {
			return null;
		}
		return obj;
	};
	
	var parseXMLToObj = function(xml_text){
		var obj = xmlToObj($.parseXML(xml_text));
		return obj;
	};
	
	paja = {
			postMessage: caja.markFunction(postMessage),
			addMessageCallback: caja.markFunction(addMessageCallback),
			setDataURI: caja.markFunction(setDataURI),
			openFile: caja.markFunction(openFile),
			parseXMLToObj: caja.markFunction(parseXMLToObj),
			log: caja.markFunction(consoleLog),
			ctest: caja.markFunction(function(){
				return '{"root":"hello world","msgs":["msg1","msg2"]}';
			})
	};
	
	var obj = {
			paja: caja.tame(paja)
	};
	
	return obj;
};

caja.load(document.getElementById('caja_guest'), uriPolicy, function(frame) {
	frame.code(app_url, 'text/html')
	.api(make_caja_objects())
	.run();
});

(function(){
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
	
	var updateFrameHeight = function(){
		var cmd = 'updateFrameHeight';
		var args = $.makeArray(arguments);
		var data = {id: new Date().getTime()+"+"+height, cmd:cmd, args: args};
		paja.postMessage && paja.postMessage(data);
		//var deferred = jQuery.Deferred();
		//addWaiting(data.id, {deferred: deferred, id:data.id});
		return null;
	};
	
	var eventhandler = function(){
		var h = getDocHeight();
		if(height != h){
			height = h;
			updateFrameHeight(height+30);
//			console.info('App height', height);
		}
	};
	var elm = document.documentElement;
//	elm.addEventListener('DOMAttrModified', eventhandler, false);
//	window.addEventListener('resize', eventhandler, false);
	window.addEventListener('scroll', eventhandler, false);
	elm.addEventListener('DOMSubtreeModified', eventhandler, false);
})(); 
