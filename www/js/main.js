(function(){

'use strict';

/*
	Original Author's style conventions
	
	naming:
	
	HARD_CODED_VALUE_YOU_MIGHT_WANT_TO_CHANGE_AT_SOME_POINT
	ObjectConstructor
	hasVerbSoFunction
	noVerbSoVar
	$_jquerySelection
	
	
	structure: Typically in order of: "What matters? What does it do? How does it work?"
	
	Most vars declared at top of whatever scope they need to be in
	Invocation/jquery event handler set in the middle
	Most functions declared at bottom of whatever scope they need to be in (js functions hoist)
*/	

var
	//configurables 
	AAP_GATEWAY_ROOT = 'http://66.9.140.53:801/',
	
	USER_ALERTS = {
		missingLoginFields:'Please fill in user name and password',
		deviceNotSupported:'AAP Gateway Reader is not supported for this device.'
	},
	
	MODULE_IMG_MAP = {
		
		//these are used to set module classes that map the corresponding images as icons for article_list
		
		//SO:
		//"AAP Grand Rounds":"tn-AAPGrandRounds.png"
		
		//BECOMES:
		//.aap_grand_rounds { background-image:url('images/tn-AAPGrandRounds.png') no-repeat left 50%; }
		//and the article li in #article_list gets class="aap_grand_rounds" if its module name is "AAP Grand Rounds"
		
		"AAP Grand Rounds":"tn-AAPGrandRounds.png",
		"AAP News":"tn-AAPNews.png",
		"AAP Policy":"tn-AAPPolicy.png",
		"Hospital Pediatrics":"tn-HospitalPediatrics.png",
		"NeoReviews":"tn-NeoReviews.png",
		"Pediatrics":"tn-Pediatrics.png",
		"Pediatrics Digest":"tn-PediatricsDigest.png",
		"Pediatrics in Review":"tn-PediatricsInReview.png",
		"PREP Audio":"tn-PREPAudio.png",
		"PREP Reference":"tn-PREPReference.png",
		"Red Book":"tn-RedBook.png",
		"Streaming Media":"tn-StreamingMedia.png"
	},
	
	//class added to body mapped to regEx used for test of navigator.userAgent
	//add whatever you need here and the name becomes a body class if the value is found in the user agents
	USER_AGENT_MAP = {
		desktop_chrome:/Chrome\/\d\d\.\d/,
		ios7:/(iPad|iPhone);.*CPU.*OS 7_\d/i,
		android_lt_3:/Android [12]\./
	}
;

var
	img_cache = [],
	dataStorage
;


for(var x in MODULE_IMG_MAP){
	img_cache.unshift(new Image());
	img_cache[0].src = 'img/' + MODULE_IMG_MAP[x];
}

for(var x in USER_AGENT_MAP){
	if( USER_AGENT_MAP[x].test(navigator.userAgent) ){
		$('body').addClass(x);
		break;
	}
}

	
if( !$('body').hasClass('desktop_chrome') ){
		document.addEventListener("deviceready", onDeviceReady, function(){alert('fs fail');} );
}
else{
	if(!window.device){
		window.device = { //fake device object for debug
			uuid:12345,
			name:'CaptainPlanetsjPhoney',
			platform:'jos20'
		};
	}
	dataStorage = new DesktopData();
	
	initApp();
}

function initApp(){
		/*var dcCnt = 0;
		(function deviceCheck(){
			if(!device || dcCnt +=1 >= 25){
				if(dcCnt >=25){
					alert('device object load timed out');
					return false;
				}
				else {
					alert('device loaded after deviceready');
					return true;
				}
				setTimeout( deviceCheck, 200);
			}
		});*/
		

		if( /testos\=ios7/.test(location.href.split('?')[1]) ){
			$('body').addClass('ios7');
		}
		
		//unneeded in production
		if(/cleardata\=true/.test(location.href.split('?')[1])){
			delete localStorage.creds;
			delete localStorage.data;
		}
		
		/*if( !supports_html5_storage() ){
			alert(USER_ALERTS.deviceNotSupported);
			return false;
		}*/
		
		var
			
			creds = dataStorage.creds(),
		
			articleListTemplate = [
				'<li class="{{moduleClass}}" data-page="{{pageNumber}}">',
					'<h4>{{headline}}</h4>',
					'<p class="listDate">',
						'<b>Published: </b><span>{{publishDate}}</span>',
						'<b class="added_label">Added: </b><span>{{addedDate}}</span>',
					'</p>',
					'<span class="go_to_article_icon">&gt;</span>',
					'<button class="delete_article">X</span>',
				'</li>'
			],
		
		
			$_login = $('#login'),
				$_loginForm = $('#login_form'),
				$_uname = $('#uname'),
				$_pword = $('#pword'),
				$_loadingMsg = $('#loading_msg'),
				
			$_articleList = $('#article_list'),
			
			$_contentViewer = $('#content_viewer'),
				$_contentNavigation = $('#content_navigation'),
				$_forwardBackBtns =  $_contentNavigation.find('.forward, .back'),
				$_forwardBtn =  $_contentNavigation.find('.forward'),
				$_backBtn = $_contentNavigation.find('.back'),
				$_slider = $('#slider'),
				$_showArticleListBtn = $('#content_navigation > .show_article_list_btn')
		;
		
		if(!creds){
		
			$_loginForm.submit( handleLogin );
			
			$_login.show();
		}
		else {
			//compareData(creds, function(){ buildContent(localStore['data']); });
			buildContent( dataStorage.data() );
		}
		
		function handleLogin(e){
			e.preventDefault();
			
			var
				isValid = true,
				creds = {
					uname:$_uname.val(),
					pword:$_pword.val()
				}
			;
			
			dataStorage.creds( creds );
				
			if( !creds.uname ){
				isValid = false;
			}
			if( !creds.pword ){
				isValid = false;
			}
			
			if(isValid){
				
				var
					url = /*$('body').hasClass('desktop_chrome') ? 'https://dl.dropboxusercontent.com/u/28072275/data2.txt' : */ (AAP_GATEWAY_ROOT + 'sendtodata/getdata' +
					[
						'?uid='+creds.uname,
						'&pwd='+creds.pword,
						'&duid='+device.uuid,
						'&dname='+device.name,
						'&os=' + device.platform,
						localStorage.lastClipDate ? '&lastClipDate=' + localStorage.lastClipDate : ''
					].join(''))
				;
					
				getData(url, buildContent);
			}
			else {
				alert(USER_ALERTS.missingLoginFields);
			}
			return false;
		}
		
		function getData(url, callBack){
			
			if( ! dataStorage.data() ){
				dataStorage.data( { Count:5, data:[] } );
			}
			
			$_loadingMsg.toggle();
			
			var
				loadingTimer = setInterval( function(){ $_loadingMsg.toggle(); },500 ),
				count = 0
			;
			
			( function getDataChunk(data){
				console.log(typeof dataStorage.data() );
				dataStorage.data( { Count:data.Count, data:dataStorage.data().data.concat(data.data) } );
				var newUrl = url + '&start=' + count;
				if( count < dataStorage.data().Count ){
					count += 5;
					$.getJSON(
						newUrl,
						getDataChunk
					)
					.fail(function(jqXHR,status,err){ console.log(status+', '+err); })
					.always(function(){
						
					});
				}
				else { //data load success
					clearInterval(loadingTimer);
					dataStorage.creds( creds );
					callBack(dataStorage.data().data);
				}
			} )(dataStorage.data());
		}
		
		function buildContent(data){
			
			$('head').append( buildModuleStyleDecs(MODULE_IMG_MAP) );
			
			var
				i = data.length,
				articleListLIs = [],
				contentPages = []
			;
			
			console.log(data.length);
			
			while(i--){
				(function(i){
					var
						thisData = data[i],
						
						listItemVars = {
							headline : thisData.Title,
							moduleClass:thisData.SourceModule.replace(/ /g,'_').toLowerCase(),
							publishDate : 'N/A' ,
							addedDate : new Date( parseInt(  thisData.clipDate.replace(/\D+/g,'') ) ),
							pageNumber : i+1
						},
						dateObj = listItemVars.addedDate,
						
						articleListItem = articleListTemplate.join('')
					;
					
					listItemVars.addedDate = [dateObj.getMonth()+1,dateObj.getDate(),dateObj.getFullYear()].join('-');
					
					for(var x in listItemVars){
						articleListItem = articleListItem.replace( new RegExp('{{'+x+'}}','g'), listItemVars[x] );
					}
					
					thisData.Content = thisData.Content.replace(/(id|xmlns)="[^"]+"\s+/g,'');
					thisData.Content = thisData.Content.replace(/src="\//g,'src="' + AAP_GATEWAY_ROOT);
					thisData.Content = thisData.Content.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*)<\/a>/, '<button class="converted_link" data-link="http://www.google.com">$2</button>');
					
					contentPages.unshift('<div class="page"><div class="content">' + thisData.Content + '</div></div>');
					articleListLIs.unshift(articleListItem);
				})(i);
			}
			
			$('#article_list > ul').html( articleListLIs.join('') );
			$('#slider').html(contentPages.join(''));
			
			$('#login').hide();
			$('#article_list').show();
			
			behaviorInit();
		
		}
		
		function behaviorInit(){
		
			var
				currentPage = 0,
				
				$_window = $(window),
				
				$_selectArticleBtn = $('#article_list li')
				
			;//end initial vars
			
			$('#edit_mode_toggle').click( function(){
				$_articleList.addClass('edit_mode').trigger('editmode');
			} );
			
			$('#normal_mode_toggle').click( function(){
				$_articleList.removeClass('edit_mode').trigger('normalmode');
			} );
			
			articleSelectOn();
			
			$_articleList.on('editmode', articleSelectOff);
			$_articleList.on('normalmode', articleSelectOn);
			
			function articleSelectOn(){
				$_selectArticleBtn.on('click.mode_toggled', function(){
					console.log('not hallucinating');
					$_articleList.hide();
					$_contentViewer.show();
					gotoPage( parseInt( $(this).data('page') ) );
				} );
			}
			
			function articleSelectOff(){
				$_selectArticleBtn.off('click.mode_toggled');
			}

			$_forwardBackBtns.on('click', gotoPage );

			$_window.resize( function(){ gotoPage(currentPage + 1); } );

			//Enable swiping...
			$_slider.swipe( {
				//Generic swipe handler for all directions
				swipeLeft:function(event, direction, distance, duration, fingerCount) {
					if(duration < 350){
						gotoPage( { target:$_slider[0], direction:'left' } );
					}
				},
				swipeRight:function(event, direction, distance, duration, fingerCount) {
					if(duration < 350){
						gotoPage( { target:$_slider[0], direction:'right' } );
					}
				},
				allowPageScroll:'auto'
			});
			/*
			$_slider.swipeleft( function(e) {
				gotoPage( { target:$_slider[0], direction:'left' } );
			} );
			
			$_slider.swiperight( function(e) {
				gotoPage( { target:$_slider[0], direction:'right' } );
			} );
			*/
			$_showArticleListBtn.click( function(){ $_contentViewer.hide(); $_articleList.show(); } );
			
			if( $(document.body).hasClass('desktop_chrome') ){
				$('.stupid_android_lt3_button_up, .stupid_android_lt3_button_down').mousedown( scrollContent );
			}
			
			$('.converted_link').click( function(e) {
				e.preventDefault();
				loadURL( $(this).data('link') );
			});
			
			function gotoPage(e){
				console.log('goto');
				var sliderLimit = ($_slider.find('.page').size() - 1);
				
				if(typeof e === 'object'){ //slide if object, set to page w no animation if number

					var
						sliderPos = currentPage,//Math.round( $_slider[0] !== 0 ? $_slider[0].scrollLeft / $(window).width() : 0 );
						isLeft = true;
						
					if( $(this).is('button') ){
						if( $(e.target).hasClass('forward') ){
							isLeft = false;
						}
					}
					else{
						console.log(e);
						if( e.direction === 'left' ){
							isLeft = false;
						}
					}
						
					if( isLeft ){
						sliderPos -= 1;
						//console.log(sliderPos +' : '+sliderLimit);
						if(sliderPos >= 0){
							$_slider.animate({scrollLeft:sliderPos * $_window.width()}, 250);
							currentPage = sliderPos;
						}
					}
					else {
						sliderPos+=1;
						console.log(sliderPos +' : '+sliderLimit);
						if(sliderPos <= sliderLimit){
							$_slider.animate({scrollLeft:sliderPos * $_window.width()}, 250);
							currentPage = sliderPos;
						}
					}
				
				}//end typeof e === 'object'
				else if(typeof e === 'number') {
					var currentPos = e-1;
					$_slider[0].scrollLeft = currentPos * $_window.width();
					currentPage = currentPos;
				}
				
				//show/hide buttons
				console.log(currentPage + ':' + sliderLimit);
				if(currentPage === sliderLimit){
					$_forwardBtn.hide();
				}
				else {
					$_forwardBtn.show();
				}
				
				if(currentPage === 0){
					$_backBtn.hide();
				}
				else {
					$_backBtn.show();
				}
				
				$_contentNavigation.find('.article_count').text( (currentPage + 1) + '/' + (sliderLimit + 1) );
			}
			
			function scrollContent(){
				
				function scrollAdjustUp(increment){
					pagePos = pagePos - increment;
					return pagePos;
				}
				
				function scrollAdjustDown(increment){
					pagePos = pagePos + increment;
					return pagePos;
				}
				
				var
					$_this =  $(this),
					$_page = $('.page').eq(currentPage),
					pagePos = $_page[0].scrollTop,
					pageHeight = $_page.innerHeight(),
					holdScroll = false,
					pageScroller,
					scrollAdjust
				;
				
				if( $_this.hasClass('stupid_android_lt3_button_up') ){
					scrollAdjust = scrollAdjustUp;
				}
				else {
					scrollAdjust = scrollAdjustDown;
				}
				
				var scrollTimer = setTimeout( function(){
					holdScroll = true;
					pageScroller = setInterval( function(){
						$_page.scrollTop( scrollAdjust(pageHeight/8) );
					}, 30 );
				}, 350);
				
				$(this).off('mouseup').mouseup( function(){
					
					clearTimeout(scrollTimer);
				
					clearInterval(pageScroller);
					
					if(!holdScroll){
						
						console.log(pagePos);
						$_page.animate( { scrollTop:scrollAdjust(pageHeight) + 'px' } );
					
					}
					
				} );
					
			}

			function loadURL(url){
				if(navigator && navigator.app){
					navigator.app.loadUrl(url, { openExternal:true } );
				}
				else {
					console.log(url);
					location.href = url;
				}
			} 
			
		} //end behaviorInit
		
		function supports_html5_storage() {
			try {
				return 'localStorage' in window && window['localStorage'] !== null;
			} catch (e) {
				return false;
			}
		}
		
		function stashCreds(u,p){
			localStorage['creds'] = JSON.stringify({uname:u,pword:p});
		}
		
		function getCreds(){
			if(localStorage['creds']){
				return JSON.parse(localStorage['creds']);
			}
			else {
				return false;
			}
		}
		
		function buildModuleStyleDecs(map){
			var
				stylesArr = [],
				buildStyle = function(moduleName,imgSrc){
					return ('\t#article_list .' + moduleName.replace(/ /g,'_').toLowerCase() +' { background-image:url(\'img/'+imgSrc+'\'); }\n' );
				}
			;
			for(var x in map){
				stylesArr.push( buildStyle(x,map[x]) );
			}
			return '<style>\n' + stylesArr.join('') + '</style>';
		}
	
	//});
	
};

function DesktopData(){
	localStorage.data = false;
	localStorage.clipDate = new Date(0).getTime();
	
	this.creds = function(arg){
		if(arg !== undefined){
			localStorage.creds = arg;
		}
		else {
			return localStorage.creds;
		}
	};
	
	this.data = function(arg){
		if(arg !== undefined){
			localStorage.data = JSON.stringify(arg);
		}
		else {
			if(localStorage.data !== undefined){
				return JSON.parse( localStorage.data );
			}
			else {
				return localStorage.data;
			}
		}
	};
	
	this.lastClipDate = function(arg){
		if(arg !== undefined){
			localStorage.clipDate = arg;
		}
		else {
			return localStorage.clipDate;
		}
	};
	
	this.download = function(url, target){
		$.getJSON( url, function(data){
			localStorage[target] = data;
		} );
	};
	
}

function onDeviceReady() {
		/*dataStorage = new ( function MobileStorage(){
			
		} );*/
		initApp();
}

})();//end 'use strict'; wrapper func