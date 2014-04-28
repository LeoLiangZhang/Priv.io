/*
 * Simple notification UI.
 *
 * Usage:
 * - FloatNotification.show(alert)
 *  + An alert is a object with these properties:
 *    * message: can be html, see bootstrap.
 *    * title: a String of text
 *    * type: one of ["alert-warn", "alert-success", "alert-info", "alert-error"]
 *            alert-warn is the default, or leave it empty;
 */
var FloatNotification = (function(){
	// Const;
	var TickInterval = 1000;
	var MaximunAlerts = 3;
	var AlertLife = 5;
	var notification_container = $('<div class="privio-float-notification"></div>');
	$('body').append(notification_container);

	var self = {};
	self.alerts = [];
	var addAlert = function(alert){
		self.alerts.push(alert);
		if(self.alerts.length > MaximunAlerts){
			var a = self.alerts.shift();
			a.close();
		}
	};

	self.show =function(alert){
		var a = {message:"", title:null, 
			type:"default", auto_dispose:true};
		for(var i in a){alert.hasOwnProperty(i) && (a[i] = alert[i]);}
		alert = a;
		alert.life = AlertLife;
		alert.mousein = false;
		var message = alert.message, title = alert.title, type = alert.type;
		var html = '<div class="alert fade in" style="margin: 1px; opacity: 0.8;">'+
		'<a class="close" data-dismiss="alert" href="#">&times;</a>'+
		(title ? '<h4 class="alert-heading">'+title+'</h4>' : "") +
		message +
		'</div>';
		var elm = $(html);
		switch(type){
		case "alert-error":
			elm.addClass("alert-error");
			break;
		case "alert-success":
			elm.addClass("alert-success");
			break;
		case "alert-info":
			elm.addClass("alert-info");
			break;
		default:
			break;
		}
		elm.mouseenter(function(){
			elm.fadeTo("fast", 1.0);
			alert.life = AlertLife;
			alert.mousein = true;
		});
		elm.mouseleave(function(){
			elm.fadeTo("fast", 0.8);
			alert.mousein = false;
		});

		elm.bind('close', function(){
			elm.slideUp("fast", function(){
				elm.detach();
			});
		});
		elm.fadeIn("fast");
		notification_container.append(elm);
		alert.close = function(){
			elm.alert('close');
		};

		addAlert(alert);
		return elm;
	};

	// Shortcut methods.
	["warn", "success", "error", "info"].forEach(function(type){
		var t = "alert-"+type;
		self[type] = function(alert){
			if(typeof alert === "string"){
				alert = {message:alert, title:null};
			}
			alert.type = t;
			return self.show(alert);
		};
	});

	self.tickHandle = setInterval(function(){
		self.alerts.forEach(function(alert){
			if(alert.mousein || alert.life == 0 || !alert.auto_dispose) return;
			if(--alert.life == 0){
				alert.close();
			}
		});
	}, TickInterval);
	return self;
})();