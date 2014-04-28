//#import lib/date.format.js
//#import priviobase.js

/**
 * FILE: privio.s3.js
 * ==================
 * Foundation Javascript API to operate Amazon S3 bucket.
 *
 * Notes:
 * - This file depends on AJAX functions from jQuery library.
 *
 */

var S3 = function(){
	this.key = null;
	this.secret = null;
	this.type = S3.CNAME;
};

S3.CNAME = 1;
S3.VHOST = 2;
S3.SLASH = 3;

S3.prototype.auth = function(key, secret){
	this.key = key;
	this.secret = secret;
	return this;
};

S3.prototype.bucket = function(name){
	return new S3Bucket(this, name);
};

S3.prototype._constructAmzHeaderString = function(headers){
	// ref:
	// http://docs.amazonwebservices.com/AmazonS3/latest/dev/RESTAuthentication.html#RESTAuthenticationConstructingCanonicalizedAmzHeaders
	var keys = [];
	var result = '';

	for(var i in headers){
		keys.push(i.toLowerCase());
	}

	keys.sort();
	keys.forEach(function(header){
		result += header + ":" + headers[header] +"\n";
	});
	return result;
};

S3.prototype.request = function(options){
	/*
	 * options is in the form of
	 * {
	 *  url: '',
	 *  http_verb: "", // GET, PUT ...
	 * 	resource: "", // S3 Canonicalized Resource
	 *  data: null, // (Optional)
	 * 	amz_headers: {}, //(Optional)
	 * }
	 */
	var url = options.url;
	var data = options.data;
	var http_verb = options.http_verb; // GET, PUT, HEAD, DELETE..
	var content_md5 = "";
	var content_type = "";
	var amz_date = new Date().format('UTC:ddd, dd mmm yyyy HH:MM:ss "+0000"');
	var amz_headers = options.amz_headers  || {};
	var canonicalizedResource = options.resource; // includes subresources
	var headers = {};

	amz_headers["x-amz-date"] = amz_date;

	if(http_verb == 'PUT' && data){
		content_type = options.content_type || 'application/octet-stream';
		content_md5 = md5.base64(data);
		headers['Content-Type'] = content_type;
		headers['Content-MD5'] = content_md5;
	}

	var canonicalizedAmzHeaders = this._constructAmzHeaderString(amz_headers);


	var stringtosign = "";
	if(!(this.key && this.secret))
		throw new Error("Auth info is missing.")
	stringtosign += http_verb + "\n";
	stringtosign += content_md5 + "\n";
	stringtosign += content_type + "\n";
	stringtosign += "" + "\n"; // Date, replaced by "x-amz-date"
	stringtosign += canonicalizedAmzHeaders;
	stringtosign += canonicalizedResource;

	var signature = shautils.base64_hmac(this.secret, Utf8.encode(stringtosign));
	amz_headers['Authorization'] = "AWS " + this.key + ":" + signature;

	for(var k in amz_headers){
		headers[k] = amz_headers[k];
	}
	var context = {options: options};
	var setting = { //jQuery Ajax setting
			type: http_verb,
			url: url,
			headers: headers,
			data: data,
			cache: false,
//			dataType: "xmlobj",
//			converters: {"xml xmlobj": xmlToObj},
			context: context
		};

//	_requesting = $.ajax(setting);
//	return _requesting;
	return setting;
};

var S3Bucket = function(s3, name){
	this.s3 = s3;
	this.name = name;
};

S3Bucket.prototype.getBaseUrl = function(){
	var url = '';
	if(this.s3.type == S3.SLASH){
		url = "/" + this.name;
	}
	return url;
};

S3Bucket.prototype.getBaseOption = function(uri, sub, verb){
	sub = sub || ""; verb = verb || "GET";
	var url = this.getBaseUrl() + uri + sub;
	var resource = "/" + this.name + uri + sub;
	var options = {url: url, resource: resource, http_verb: verb};
	return options;
};

S3Bucket.prototype._request = function(options){
	return this.s3.request(options);
};

/**
 * Valid acl values are: private | public-read | public-read-write |
 *   authenticated-read | bucket-owner-read | bucket-owner-full-control
 */
S3Bucket.prototype.create = function(acl){
	var options = this.getBaseOption('/', "", "PUT");
	if(acl){
		options.amz_headers = {'x-amz-acl': acl};
	}
	return this._request(options);
};

S3Bucket.prototype.list = function(delimiter, marker, max_keys, prefix){
	var lst = [delimiter && 'delimiter=' + delimiter,
	           marker && 'marker=' + marker,
	           max_keys && 'max-keys=' + max_keys,
	           prefix && 'prefix=' + prefix];
	var sub = '';
	lst.forEach(function(x){
		sub += x && "&"+x;
	}, this);
	sub = sub && '?'+sub.substr(1);

	var options = this.getBaseOption('/', sub);
	options.resource = "/" + this.name + '/';
	return this._request(options);
};

S3Bucket.prototype.policy = function(policy){
	var options = this.getBaseOption('/', "?policy");
	if(policy){
		options.http_verb = 'PUT';
		options.content_type = "text/plain; charset=UTF-8";
		options.data = policy;
	}
	return this._request(options);
};

S3Bucket.prototype.website = function(website){
	var options = this.getBaseOption('/', "?website");
	if(website){
		options.http_verb = 'PUT';
		options.content_type = "text/plain; charset=UTF-8";
		options.data = website;
	}
	return this._request(options);
};

S3Bucket.prototype.object = function(key){
	return new S3Object(this, key);
};

var S3Object = function(s3bucket, key){
	this.s3bucket = s3bucket;
	this.key = key;
};

S3Object.prototype.getBaseOption = function(sub, verb){
	return this.s3bucket.getBaseOption('/', this.key + sub, verb);
};

S3Object.prototype._request = function(options){
	return this.s3bucket.s3.request(options);
};

S3Object.prototype.put = function(data, content_type){
	var options = this.getBaseOption('', 'PUT');
	if(data)
		options.data = data;
	if(content_type)
		options.content_type = content_type;
	return this._request(options);
};

S3Object.prototype.del = function(){
	var options = this.getBaseOption("", "DELETE");
	return this._request(options);
};


