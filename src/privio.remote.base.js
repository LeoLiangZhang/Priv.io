//#import privio.message.xss.js


// This function creates a new anchor element and uses location
// properties (inherent) to get the desired URL data. Some String
// operations are used (to normalize results across browsers).
// http://james.padolsey.com/javascript/parsing-urls-with-the-dom/

function parseURL(url) {
    var a =  document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':',''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        params: (function(){
            var ret = {},
                seg = a.search.replace(/^\?/,'').split('&'),
                len = seg.length, i = 0, s;
            for (;i<len;i++) {
                if (!seg[i]) { continue; }
                s = seg[i].split('=');
                ret[s[0]] = s[1];
            }
            return ret;
        })(),
        file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
        hash: a.hash.replace('#',''),
        path: a.pathname.replace(/^([^\/])/,'/$1'),
        relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
        segments: a.pathname.replace(/^\//,'').split('/')
    };
}

var P = (function(){
var module = {};

var PrivioCommander = function(){
	this.cdr = null;
};

PrivioCommander.prototype.postBack = function(data){
	this.cdr.postMessage(data);
};

PrivioCommander.prototype.ajax = function(settings, ref){
	var self = this;
	var ajax = $.ajax(settings).done(function(data){
		var jdata = data;
		if(data instanceof Document)
			data = ajax.responseText;
		self.postBack({cmd:'ajax_done', args:[data, ref]});
	}).fail(function(jqXHR, status){
		self.postBack({cmd:'ajax_fail', args:[status, ref]});
	});
	return ajax;
};

function main(){

	var pc = new PrivioCommander();
	var cdr = null;

	cdr = new CrossDomainRequest();
	cdr.addEventListener('connected', function(e){
//		log.debug('api connected', e);
		});
	cdr.addEventListener('message', function(e){});
	cdr.addEventListener('ping', function(e){cdr.postMessage({type:'event', data:e.data});});

	cdr.addMessageHandler(pc);
	pc.cdr = cdr;

	var connectto = document.referrer;// || location.href;
	if(!connectto){
		var parts = parseURL(location.href);
		var com = decodeURIComponent(parts.query);
		connectto = com.replace('?referrer=','');
	}
//	log.debug('connecting to '+ connectto + " from "+ location.href);
	cdr.connect(connectto);

}

main();

return module;
})();