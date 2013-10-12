if(!/Chrome\/\d\d\.\d/.test(navigator.userAgent)){
	document.addEventListener("deviceready", initApp, false);
}
else{
	initApp();
}

function initApp(){
	'use strict';
	
	if( /(iPad|iPhone);.*CPU.*OS 7_\d/i.test(navigator.userAgent) || /testos=ios7/.test(location.href.split('?')[1]) ){
		$('html').addClass('ios7');
	}
	
	if(/cleardata\=true/.test(location.href.split('?')[1])){
		delete localStorage.creds;
		delete localStorage.data;
	}
	
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
	
	if( !supports_html5_storage() ){
		alert('AAP Gateway Reader is not supported for this device.');
		return false;
	}
	
	var
		AAP_GATEWAY_ROOT = 'http://66.9.140.53:801/',
		
		creds = getCreds(),
	
		articleListTemplate = [
			'<li data-page="{{pageNumber}}">',
				'<h4>{{headline}}</h4>',
				'<p class="listDate">',
					'<b>Published: </b><span>{{publishDate}}</span>',
					'<b class="added_label">Added: </b><span>{{addedDate}}</span>',
				'</p>',
				'<span class="go_to_article_icon">&gt;</span>',
			'</li>'
		],
	
	
		$_login = $('#login'),
			$_loginForm = $('#login_form'),
			$_uname = $('#uname'),
			$_pword = $('#pword'),
			$_loadingMsg = $('#loading_msg')
	;
	
	if(!creds){
	
		$_loginForm.submit( function(e){
			e.preventDefault();
			
			var
				isValid = true,
				creds = {
					uname:$_uname.val(),
					pword:$_pword.val()
				}
			;
				
			if( !creds.uname ){
				isValid = false;
			}
			if( !creds.pword ){
				isValid = false;
			}
			
			if(isValid){
				$_loadingMsg.toggle();
				var loadingTimer = setInterval( function(){ $_loadingMsg.toggle(); },500 ),
				url =/Chrome\/\d\d\.\d/.test(navigator.userAgent) ? 'https://dl.dropboxusercontent.com/u/28072275/data.txt' : AAP_GATEWAY_ROOT + 'sendtodata/getdata?uid='+creds.uname+'&pwd='+creds.pword+'&duid=12345&dname=CaptainPlanetsjPhoney&os=jos20';//'&duid='+device.uuid+'&dname='+device.name+'&os='+device.platform,
				$.getJSON(
					url,
					buildContent
				)
				.fail(function(e){ console.log(e); })
				.always(function(){
					clearInterval(loadingTimer);
				});
			}
			else {
				alert('At least one, perhaps both form fields are empty. This validator will leave what needs to happen next to your imagination.');
			}
			return false;
		} );
		
		$_login.show();
	}
	else {
		//compareData(creds, function(){ buildContent(localStore['data']); });
		buildContent( JSON.parse(localStorage['data']) );
	}
	
	function buildContent(data){
		
		
		stashCreds( creds );
		
		if(typeof data === 'string'){
			localStorage['data'] = data;
			data = JSON.parse(data);
		}
		else {
			localStorage['data'] = JSON.stringify(data);
		}
		
		var
			i = data.length,
			articleListLIs = [],
			contentPages = []
		;
		
		console.log(data.length);
		
		while(i--){
			(function(i){
				var
					thisData = data[i];
				var
					
					listItemVars = {
						headline : thisData.Title,
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
		
			$_articleList = $('#article_list'),
				$_selectArticleBtn = $('#article_list li'),
			
			$_contentViewer = $('#content_viewer'),
				$_contentNavigation = $('#content_navigation'),
				$_forwardBackBtns =  $_contentNavigation.find('.forward, .back'),
				$_forwardBtn =  $_contentNavigation.find('.forward'),
				$_backBtn = $_contentNavigation.find('.back'),
				$_slider = $('#slider'),
				$_showArticleListBtn = $('#content_navigation > .show_article_list_btn')
			
		;//end initial vars
		
		


		$_selectArticleBtn.click( function(){
			console.log('not hallucinating');
			$_articleList.hide();
			$_contentViewer.show();
			gotoPage( parseInt( $(this).data('page') ) );
		} );

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

		function gotoPage(e){
			
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
	
	}
	
};