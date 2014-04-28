///////////////////////////////////////////
////              Helper               ////
///////////////////////////////////////////

var getFormValues = function(form){
	var form_vals = {};
	for(var i = 0; i < form.elements.length; i ++){
		var elm = form.elements[i];
		if(elm.name){
			form_vals[elm.name] = elm.value;
		}
	}
	return form_vals;
};

var isError = function(obj){
	if(obj && obj.constructor === Error) return true;
	return false;
};


var generateRandomPassword = function(){
	while(true){
		if(sjcl.random.isReady()){
			var r = sjcl.random.randomWords(512);
			return sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(r));
		}
		var n = Math.floor(Math.random()*65536) - 65536/2;
		sjcl.random.addEntropy(n);
	}
};

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

//var makeCachableDeferredActionWrapper = function(func, func_id){
//	var piped_deferreds = {};
//
//	return function(){
//		var self = this;
//		var args = toArray(arguments);
//		var id = func_id.apply(self, args);
//		var deferred = new jQuery.Deferred();
//
//		var process = function(){
//			var _deferred = func.apply(self, args);
//			_deferred =
//		};
//
//		var prepare_process = function(){
//			if(piped_deferreds[id]){
//				var _deferred = piped_deferreds[id];
//				_deferred.done(function(){
//					process();
//				}).fail(function(){
//					prepare_process();
//				});
//			} else {
//				piped_deferreds[id] = deferred;
//				deferred.always(function(){
//					delete piped_deferreds[id];
//				});
//				process();
//			}
//		};
//		prepare_process();
//
//		return deferred;
//	};
//};