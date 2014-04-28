
var BucketConfig = function(access_key, access_secret){
	this.access_key = access_key;
	this.access_secret = access_secret;
};

var WebFS = function(){
	this.config = {};
	this.subfses = {};
};

extend(WebFS.prototype, EventListenerMixin);

WebFS.prototype.setBucketConfig = function(bucket, config){
	this.config[bucket] = config; // extend this feature so that can config what actions in certain bucket use what access policy
};

WebFS.prototype.getBucketConfig = function(bucket){
	return this.config[bucket];
};

WebFS.prototype.getSubFS = function(bucket){
	return SubFS.getSubFS(bucket);
};

WebFS.prototype.listObjects = function(bucket, path){
	var subfs = this.getSubFS(bucket);
	return subfs.getObject(
			null, null,
			bucket, path);
};

WebFS.prototype.loadObject = function(bucket, path){
	var subfs = this.getSubFS(bucket);
	return subfs.getObject(
			null, null,
			bucket, path);
};

WebFS.prototype.saveObject = function(bucket, path, data, type){
	var subfs = this.getSubFS(bucket);
	var config = this.getBucketConfig(bucket);
	return subfs.putObject(
			config.access_key, config.access_secret,
			bucket+'.priv.io', path,
			data, type);
};

WebFS.prototype.removeObject = function(bucket, path){
	var subfs = this.getSubFS(bucket);
	var config = this.getBucketConfig(bucket);
	return subfs.delObject(
			config.access_key, config.access_secret,
			bucket, path);
};

WebFS.prototype.onupdate = function(){
	// Not impl.
	// for future; fire when invalidated cached item
};

WebFS.abspath = function(bucket, path){
	return "/"+bucket+"/"+path;
};

WebFS.de_abspath = function(abspath){
	var i = abspath.indexOf('/', 1);
	var bucket = abspath.substring(1, i);
	var path = abspath.substring(i+1);
	return [bucket, path];
};
