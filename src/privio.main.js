//#import privio.const.js
//#import privio.helper.js
//#import privio.controller.js

//////////////////////////////////////////
////////// Main Entry Point //////////////
//////////////////////////////////////////

function log_time(){
	return;
	var args = toArray(arguments);
	args.unshift(getTime());
	log.debug.apply(log, args);
}

var P = null;
(function(){
	// Hot fix for not redirecting browser after click "submit" button.
	$("form").submit(function() {
		return false;
	});

	var flobj_id = "flCloud";
	var fl_path = "fl/flCloud.swf";
	var bridge;
	var flashver = swfobject.getFlashPlayerVersion();
	var hasFlash = flashver.major > 0;

	function main(msg){
		log.debug(msg);
		jstrace = function(){
//				console.log(getTime(), arguments);
		}; // disable flash rawjstrace.

		if(hasFlash){
			bridge = new Bridge(flobj_id);
			FlashURL.setBridge(bridge);
		}

		P = new Privio();
	};

	function loadswf(){
		function onload_flash(e){
			// NOTE: the swf file loaded does NOT mean that the script
			// is init.
		};

		var onflashinit = "__onFlashInit_" +getTime();
		window[onflashinit] = main;
		function onload_swfobjects(){
			swfobject.embedSWF(fl_path, flobj_id,
					"0", "0", "10.1.0", "playerProductInstall.swf",
					{main_callback: onflashinit}, //Flash Vars
					{allowscriptaccess: "always"}, {},
					onload_flash);
		};
		onload_swfobjects();

	};

	if(hasFlash){
		loadswf();
	} else {
		main("Flash not found.");
	}

})();