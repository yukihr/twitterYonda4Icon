// ==UserScript==
// @name           Twitter yonda4 Icon for Profile
// @namespace      http://4kwh.net/
// @description    An icon on twitter profile indicating the user is using yonda4.
// @version        0.0.2
// @license        The MIT License: http://www.opensource.org/licenses/mit-license.php
// @include        http://twitter.com/*
// @include        https://twitter.com/*
// @exclude        http://twitter.com/#search?q=*
// @exclude        https://twitter.com/#search?q=*
// ==/UserScript==

//HISTORY:
//    26-09-09 fixed not work on https
//    30-07-09 prettier popup
//    29-07-09 popup for display books (0.0.2)
//    25-07-09 first version

//TODO:
//	add link tip
//	style on new page
//	its dull to wait event.load of widow

window.addEventListener('DOMContentLoaded', function() {
	var $;
	window.addEventListener('load', function() {
		var realWindow = (typeof jQuery == "undefined") ? unsafeWindow : window;
		$ = realWindow.jQuery;
	},false);

	//utilities
	//http://d.hatena.ne.jp/janus_wel/20090110/1231604002
	function wrapSecurely(f) {
		return function () {
			setTimeout.apply(window, [f, 0].concat(Array.slice(arguments)));
		};
	}

	//Popup Class
	var BooksPopup = function() {
		this.initialize.apply(this, arguments);
	};
	BooksPopup.prototype = {
		trigerId: '',
		id: '',
		node: '',
		$pu: '',
		bookClass: '',
		tipClass: '',
		popupTmpl: '<div id="y4popup" style="display:none"></div>',
		bookTmpl: '<div class="y4book"><a href="{HREF}" target="_y4">{BOOK_NAME}</a></div>',
		tipTmpl: '<div class="y4tip">{TIP}</div>',
		//each book data is hashed texts, and hash keys are; guid, link, title, description, pubDate, asin, user (27-07-09)
		books : [],
		initialize : function(books, max) {
			var that, i;
			that = this;

			this.$pu = $(this.popupTmpl);
			this.id = this.$pu.attr('id');
			this.bookClass = $(this.bookTmpl).attr('class');
			this.tipClass = $(this.tipTmpl).attr('class');

			this.$pu.append(this.tipTmpl.replace(/\{TIP\}/, 'latest ' + max + ' books'));
			this.books = books;
			for(i=0,len=this.books.length; i<len ; i++) {
				this.$pu.append(this.bookTmpl.replace(/\{HREF\}/, this.books[i].link).replace(/\{BOOK_NAME\}/, this.books[i].title));
			}
		},
		appear : function() {
							 this.node.style.display = 'block';
						 },
		disappear : function() {
									this.node.style.display = 'none';
								},
		addTrigger : function(selector) {
									var that = this;

									$(selector).after(this.$pu);

									this.node = document.getElementById(this.id);
									$(selector).hover(function(){that.appear();}, function(){that.disappear();});
									$('#' + this.id).hover(function(){that.appear();}, function(){that.disappear();});
									$('.' + this.bookClass).hover(function(){that.appear();}, function(){that.disappear();});
									$('.' + this.tipClass).hover(function(){that.appear();}, function(){that.disappear();});
								}
	};
	GM_addStyle('#y4popup .y4book { background-color: #e8e8e8; border: 2px solid #800000; font-size: 20px; line-height: 26px;}' +
			'#y4popup .y4tip { background-color: #800000; color: #e8e8e8; text-align: right; }' +
			'#y4popup { border: 2px solid #800000; z-index: 100; position: absolute; color: #444 !important;}');

	//main
	var maxBookNum = 20,
			y4Icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAAA1BMVEWAAABGTyZaAAAADElEQVQImWNgIA0AAAAwAAFDlLdnAAAAAElFTkSuQmCC',
			y4TitleOnProfile = 'Click to see yonda4.com user page.',
			y4Tmpl = '<div id="y4iconp"></div>',
			y4LinkTmpl = '<a id="y4" href="{HREF}" title="{TITLE}" target="_y4"><img id="y4icon" src="' + y4Icon + '"/></a>';

	GM_addStyle('#y4icon { height: 16px; width: 16px; } #y4iconp { margin: 0px; padding: 3px; }');

	//check if specified user is using yonda4, using REST API
	//userName: string, callback: function(result, api data, yonda4 user url, error)
	function hasBooksOnY4(userName, callback) {
		var y4URL = 'http://yonda4.com/user/' + userName,
				y4API = 'http://yonda4.com/api/user/' + userName + '?num=' + maxBookNum,

				errCb = function(res){
					console.log('Http request has failed with status: ' + res.status + ' ' + resStatusText + ' ' + res.readyState);
					callback(false, false,'', true);
				},
				cb = function(res) {
					try {
						var obj = JSON.parse(res.responseText);
						if(obj.value.items.length) {
							callback(true, obj, y4URL, false);
						} else {
							callback(false, obj, '', false);
						}
					} catch(e) { console.log(e); }
				};

		wrapSecurely(function() {
			GM_xmlhttpRequest({
				method: 'GET',
				url: y4API,
				headers: {'User-Agent': 'Mozilla/5.0 (compatible) Greasemonkey',
					'Content-type': 'application/x-www-form-urlencoded'},
				onerror: errCb,
				onload: cb
			});
		})();
	}

	function renderIcon($before, username) {
		hasBooksOnY4(username, function(result, data, url, error) {
			// $before.append('<div id='y4iconp_debug'>return!</div>');
			if(result && !error) {
				$before.after(
					$(y4Tmpl).append(y4LinkTmpl.replace(/\{HREF\}/, url).replace(/\{TITLE\}/, y4TitleOnProfile))
					);
				var pu = new BooksPopup(data.value.items, maxBookNum);
				pu.addTrigger('#y4');
			} else if(error) {
				$before.append('<div id="y4iconp_error">error</div>');
			}
		});
	}


	//main
	var $before, name, tpof;
	tpof = document.getElementsByClassName('turn-phx-off-form');
	if(!tpof.length) {
		// old page
		window.addEventListener('load', function() {
			$before = $('h2.thumb');
			name = $('div.screen-name').text();
			renderIcon($before, name);
		});
	} else {
		// new page
		// user detail pane
		var profilePaneDetector = (function() {
			var idlist={},id,name,fns=[],nodes,i,elm;

			function _work() {
				nodes = document.getElementsByClassName('profile-text');
				if(nodes && nodes.length) {
					for(i=0,len=nodes.length; i<len; i++) {
						elm = nodes[i];
						id = elm.getElementsByClassName('thumb')[0].getAttribute('data-user-id');

						if(idlist.hasOwnProperty(id)) { continue; }

						name = elm.getElementsByTagName('a')[0].getAttribute('href').replace('/#!/','');
						idlist[id] = { elm: elm, name: name };
						for(i=0,len=fns.length; i<len; i++) {
							fns[i](elm,name);
						}
					}
				}
			}

			window.setInterval(_work, 500);

			function onNew(fn) {
				return fns.push(fn);
			}

			return {
				onNew: onNew
			};
		})();

		profilePaneDetector.onNew(function(elm,name) {
			renderIcon($(elm),name);
		});
		// profile
		// $before = $('div.profile-details div.full-name'), name = $before
	}

}, false);

