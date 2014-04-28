var accessKeyId = '', secretKey = "";

// list queue
var form = {QueueNamePrefix: ""}
var url = sqs.generateSignedURL("ListQueues",form, accessKeyId, secretKey, "http://queue.amazonaws.com/", "2009-02-01");
var data = null;
P.flashAjax(url).done(function(d){data = d}).fail(function(err){console.log(err)})


xmlToObj($.parseXML(data))

print = function(){
	var arr = $.makeArray(arguments);
	console.log.apply(console, arr);
}

listQueue = function(options){ // return [list of query_url]
		var deferred = new jQuery.Deferred();
		var form = jQuery.extend({QueueNamePrefix: ""}, options);
		var url = sqs.generateSignedURL("ListQueues",form, accessKeyId, secretKey, "http://queue.amazonaws.com/", "2009-02-01");
		var data = '';
		P.flashAjax(url).done(function(d){
			data = d;
			var obj = xmlToObj($.parseXML(data));
			var qurl = obj.listQueuesResult && obj.listQueuesResult.queueUrl;
			var result = [];
			if(!obj.listQueuesResult){
				
			}else if($.isArray(qurl)){
				result = qurl;
			}else{
				result = [qurl];
			}
			deferred.resolve(result);
		}).fail(function(err){
			deferred.reject(err);
		});
		return deferred.promise();
	};
	
	
	receiveMessage = function(qurl, options){ // return [list of query_url]
			var deferred = new jQuery.Deferred();
			var form = jQuery.extend({MaxNumberOfMessages: "", VisibilityTimeout: ''}, options);
			var url = sqs.generateSignedURL("ReceiveMessage",form, accessKeyId, secretKey, qurl, "2009-02-01");
			var data = '';
			P.flashAjax(url).done(function(d){
				data = d;
				var result = [];
				
				deferred.resolve(result);
			}).fail(function(err){
				deferred.reject(err);
			});
			return deferred.promise();
		};
		
		
		sendMessage = function(qurl, options){ // return [list of query_url]
				var deferred = new jQuery.Deferred();
				var form = jQuery.extend({MessageBody: "", DelaySeconds: ''}, options);
				var url = sqs.generateSignedURL("SendMessage",form, accessKeyId, secretKey, qurl, "2009-02-01");
				var data = '';
				P.flashAjax(url).done(function(d){
					data = d;
					var result = [];

					deferred.resolve(result);
				}).fail(function(err){
					deferred.reject(err);
				});
				return deferred.promise();
			};