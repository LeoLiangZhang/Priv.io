//#import privio.app.demo.helper.js

//#import privio.app.components.js

//#import privio.app.demo.feed.ui.js
//#import privio.app.demo.feed.controller.js

var controller = null;

$(function(){
	$("form").submit(function() {
		return false;
	});
//	window.parent.postMessage("I'm ready.", 'http://www.priv.io/');
	P.getUsername().done(function(username){
		console.log('load name from app', username);
		controller = new FeedController();
		controller.username = username;
		console.debug("Init a controller.");
		P.stat_finish('LoadApp');
//		controller.loadFeeds(function(msg){
//			controller.ui.displayMessage(msg);
//		});
	});
});

