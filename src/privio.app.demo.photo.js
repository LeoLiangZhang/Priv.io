//#import privio.app.demo.helper.js
//#import privio.app.components.js
//#import lib/crypto/shautils.js

var DropZone = function(){
	var self = this;
	var current_selection = [];

	self.getCurrentSelection = function(){
		return current_selection;
	};

	self.clear = function(){
		document.getElementById('list').innerHTML = "";
		current_selection = [];
	};

	function handleFileSelect(evt) {
		evt.stopPropagation();
		evt.preventDefault();

		var files = evt.dataTransfer.files; // FileList object.
		current_selection = files;
		// files is a FileList of File objects. List some properties.
		var output = [];
		for (var i = 0, f; f = files[i]; i++) {
			output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
					f.size, ' bytes, last modified: ',
					f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
			'</li>');
		}
		document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
	}

	function handleDragOver(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
	}

	// Setup the dnd listeners.
	var dropZone = document.getElementById('drop_zone');
	dropZone.addEventListener('dragover', handleDragOver, false);
	dropZone.addEventListener('drop', handleFileSelect, false);

	return self;
};

var PhotoAlbum = function(username){
	var self = this;

	self.username = username;
	self.handle_drop_zone = new DropZone();

	self.createAlbum = function(){
		var deferred = new jQuery.Deferred();
		var policy = getPolicy();
		var name = getAlbumName();
		var files = self.handle_drop_zone.getCurrentSelection();

		var img_ids = [];

		var _postmsg = function(){
			var abspath = "/"+username+"/album/"+new Date().getTime();
			var album = {
					name: name,
					imgs: img_ids
			};
			var raw = JSON.stringify(album);
			P.saveObjectEx(abspath, raw, {friendid: username, policy:policy})
			.done(function(ret){
				P.loadObject("album/list").done(function(data){
					var o = JSON.parse(data);
					o.push(abspath);
					var s = JSON.stringify(o);
					P.saveObject("album/list", s);
				}).fail(function(){
					var o = [];
					o.push(abspath);
					var s = JSON.stringify(o);
					P.saveObject("album/list", s);
				}).always(function(){
					clear_form();
					self.handle_drop_zone.clear();
					deferred.resolve();
				});
			});

		};

		$.each(files, function(i, f){
			read_file(f).done(function(id, img){
				var img_uuid = id;
				var img_abspath = "/"+username+"/img/"+img_uuid;
				P.saveObjectEx(img_abspath, img, {friendid: username, policy:policy}).done(function(){
					img_ids.push(img_abspath);
					if(img_ids.length == files.length)
						_postmsg();
				});
			});
		});
		return deferred;
	};

	var show_album = function(album){
		var imgs_data = [];
		var show_album = function(){
			var html = '';
			var ul_html = '';
			$.each(imgs_data, function(i, img_dataurl){
				ul_html += '<li>'
					+ '<img src="'+ img_dataurl +'" style="max-width:90%"></img>'
					+ '</li>';
			});
			html = '<strong>' +album.name+ '</strong>'
				+ '<ul>' + ul_html + '</ul>';
			html = '<div style="text-align: center;color: #BBB;border: 2px dashed #BBB;border-radius: 5px;">' + html + '</div>';
			$('#div_albumContainer').append($(html));
		};

		$.each(album.imgs, function(i, img_abspath){
			P.loadObjectEx(img_abspath).done(function(img){
				imgs_data.push(img);
				if(imgs_data.length == album.imgs.length){
					show_album();
				}
			});
		});
	};

	var load_friend_album = function(friend){
		P.loadObject("/"+friend+"/album/list").done(function(data){
			var lst = JSON.parse(data);
			$.each(lst, function(i, album_abspath){
				P.loadObjectEx(album_abspath).done(function(raw){
					var album = JSON.parse(raw);
					show_album(album);
				});
			});
		});
	};

	self.refresh = function(){
		$('#div_albumContainer').html(''); // clear

		P.listFriends().done(function(_friends){
			var friends = _friends;
			var lst = friends.slice();
			lst.unshift(self.username);
			$.each(lst, function(i, friend){
				load_friend_album(friend);
			});
		});
	};
};

var clear_form = function(){
	$('form')[0].reset();
};

var read_file = function(file){
	var deferred = new jQuery.Deferred();
	var reader = new FileReader();

	reader.onload = function(evt) {
		var imgdata = evt.target.result;
		var hex = shautils.hex(imgdata);
		deferred.resolve(hex, imgdata);
		console.log("loaded image;", file);//, hex
	};
	reader.readAsDataURL(file);//readAsBinaryString(file);
	return deferred;
};

var getPolicy = function(){
//	return $('#policy').val();
	return btn_share.getPolicy();
};

var getAlbumName = function(){
	return $('form input[name="album_name"]').val();
};

var photo_ablum;
var btn_share;

$(function(){
	btn_share = new ShareControlButton({placeholder:$('#btn_share')});

	P.getUsername().done(function(username){
		photo_ablum = new PhotoAlbum(username);
		photo_ablum.refresh();
	});

	$('form').submit(function(e) {
		return false;
	});

	$('form').submit(function(){
		photo_ablum.createAlbum();
	});

	$('#btn_addAlbum').click(function(){
		$('#div_createAlbum').slideToggle('fast');
	});


});
