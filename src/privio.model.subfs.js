var SubFS = function(connection){
	var self = this;
	this.connection = connection; // CrossDomainRequest object
	this.refCounter = 0;
	this.ref_waitings = {}; // ref:jQuery.Deferred

	var ConnectionHandlers = function(){
		this.ajax_done = function(data, ref){
			var deferred = self.ref_waitings[ref];
			deferred.resolveWith(self, [data]);
		};

		this.ajax_fail = function(status, ref){
			var deferred = self.ref_waitings[ref];
			deferred.rejectWith(self, [status]);
		};
	};

	var handlers = new ConnectionHandlers();
	this.connection.addMessageHandler(handlers);
	this.connection.addEventListener('error', function(err){
		var objs = jQuery.extend({}, self.ref_waitings);
		self.ref_waitings = {};
		jQuery.each(objs, function(i, o){
			o.rejectWith(self, [err]);
		});
	}, false);
};

SubFS.prototype.incrRef = function(){ // increase reference
	return this.refCounter ++;
};

SubFS.prototype.ajax = function(settings){
	return this._action("ajax", "ajax", [settings]).promise();
};

SubFS.prototype.simpleGet = function(path){
	return this.ajax({url:path, cache:false});
};

SubFS.prototype.getObject = function(access_key, access_secret, bucket, path){
	return this.simpleGet("/"+path);
};

SubFS.prototype.putObject = function(access_key, access_secret, bucket, path, data, content_type){
	var s3obj = new S3().auth(access_key, access_secret)
						.bucket(bucket).object(path);
	var settings = s3obj.put(data, content_type);
	return this.ajax(settings);
};

SubFS.prototype.delObject = function(access_key, access_secret, bucket, path){
	throw new Error('Not Impl.');
};

SubFS.prototype.listObject = function(access_key, access_secret, bucket, path, offset){
	var _path = "/"+bucket+"/"+path;
	if(!_path){
		_path = "/";
	} else {
		_path = "/?delimiter=/&prefix="+_path;
	}

	return this.ajax({url:_path, cache:false, dataType:"text"}).pipe(function(data){
		var xml = jQuery.parseXML( data );
		var obj = xmlToObj(xml);
		return obj;
	});
};

SubFS.prototype._action = function(tag, cmd, args){
	var self = this;
	var ref = this.incrRef();
	args.push(ref);
	var deferred = new jQuery.Deferred();
	this.ref_waitings[ref] = deferred;

	deferred.always(function(){
		delete self.ref_waitings[ref];
	});

	if(this.connection.postMessage({cmd:cmd, args:args})){

	}else{
		deferred.rejectWith(self, ["ERROR:SubFS: postMessage"]);
	}
	return deferred;
};

SubFS.subfses = {};

SubFS.getSubFS = function(bucket){
	var url = 'http://' + bucket +'.priv.io/' + REMOTE_FILENAME;
	if(url in SubFS.subfses){
		return SubFS.subfses[url];
	} else {
		var connection = new CrossDomainRequest(true);
		var subfs = new SubFS(connection);
		SubFS.subfses[url] = subfs;
		connection.connect(url);
		return subfs;
	}
};
