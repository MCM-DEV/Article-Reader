(function () {

    'use strict';

    console.log('app starting');
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
        //AAP_GATEWAY_ROOT = 'http://66.9.140.53:801/',
        AAP_GATEWAY_ROOT = 'http://aapgateway.magnani.com/',

        USER_ALERTS = {
            missingLoginFields: 'Please fill in user name and password',
            deviceNotSupported: 'AAP Gateway Reader is not supported for this device.'
        },

        MODULE_IMG_MAP = {

            //these are used to set module classes that map the corresponding images as icons for article_list

            //SO:
            //"AAP Grand Rounds":"tn-AAPGrandRounds.png"

            //BECOMES:
            //.aap_grand_rounds { background-image:url('images/tn-AAPGrandRounds.png') no-repeat left 50%; }
            //and the article li in #article_list gets class="aap_grand_rounds" if its module name is "AAP Grand Rounds"

            "AAP Grand Rounds": "tn-AAPGrandRounds.png",
            "AAP News": "tn-AAPNews.png",
            "AAP Policy": "tn-AAPPolicy.png",
            "Hospital Pediatrics": "tn-HospitalPediatrics.png",
            "NeoReviews": "tn-NeoReviews.png",
            "Pediatrics": "tn-Pediatrics.png",
            "Pediatrics Digest": "tn-PediatricsDigest.png",
            "Pediatrics in Review": "tn-PediatricsInReview.png",
            "PREP Audio": "tn-PREPAudio.png",
            "PREP Reference": "tn-PREPReference.png",
            "Red Book": "tn-RedBook.png",
            "Streaming Media": "tn-StreamingMedia.png"
        },

        //class added to body mapped to regEx used for test of navigator.userAgent
        //add whatever you need here and the name becomes a body class if the value is found in the user agents
        USER_AGENT_MAP = {
            desktop_chrome: /Chrome\/\d\d\.\d/,
            ios7: /(iPad|iPhone);.*CPU.*OS 7_\d/i,
            android_lt_3: /Android [12]\./
        }
    ;

    var
        img_cache = [],
        dataStorage //most branching between mobile /desktop happens at this guy
    ;


    for (var x in MODULE_IMG_MAP) {
        img_cache.unshift(new Image());
        img_cache[0].src = 'img/' + MODULE_IMG_MAP[x];
    }

    for (var x in USER_AGENT_MAP) {
        if (USER_AGENT_MAP[x].test(navigator.userAgent)) {
            $('body').addClass(x);
            break;
        }
    }



    if (!$('body').hasClass('desktop_chrome')) {
        document.addEventListener("deviceready", onDeviceReady, function () { alert('fs fail'); });
    }
    else {
        if (!window.device) {
            window.device = { //fake device object for debug
                uuid: 12345,
                name: 'CaptainPlanetsjPhoney',
                platform: 'jos20'
            };

        }
       // alert("desktop?");
        dataStorage = new DesktopData();
        initApp();
    }


    function onDeviceReady() {

        function onSuccess(fileSystem) {

            dataStorage = new (function MobileStorage() {
                var
                    thisObj = this,
                    _data = null,
                    _creds = null,
                    _clipDate = null,
                    fileOptions = { create: true, exclusive: false },
                    testReader = new FileReader(),
                    filesExist = false,
                    fileNameMap = {}
                ;
                /*
                testReader.onloadend = function(evt){
                    console.log('loadend for testReader fires');
                    if(evt.target.result === null){
                        console.log('need to create new file');
                        fileOptions = null;
                    }
                    else {
                        console.log('file already exists');
                    }
                    
                    fileSystem.root.getFile('data.txt', fileOptions, createDataInterface, function(e){ alert(e); });
                    fileSystem.root.getFile('creds.txt', fileOptions, createCredsInterface, function(e){ alert(e); });
                    fileSystem.root.getFile('clipDate.txt', fileOptions, createClipDateInterface, function(e){ alert(e);});
                }
                
                
                fileSystem.root.getFile('data.txt', fileOptions, createDataInterface, function(e){ alert('getFile error:' + e.code); });
    
                fileSystem.root.getFile('creds.txt', fileOptions, createCredsInterface, function(e){ alert('getFile error:' + e.code); });
    
                fileSystem.root.getFile('clipDate.txt', fileOptions, createClipDateInterface, function(e){ alert('getFile error:' + e.code);});
                */

                fileSystem.root.getFile('creds.txt', { create: false}, fileExists, noFiles);


                function fileExists(fileEntry) {
                    //alert("exists");
                    filesExist = true;
                    fileOptions = null;
                    fileSystem.root.getFile('data.txt', fileOptions, createDataInterface, function (e) { alert(e.code); });
                    fileSystem.root.getFile('creds.txt', fileOptions, createCredsInterface, function (e) { alert(e.code); });
                    fileSystem.root.getFile('clipDate.txt', fileOptions, createClipDateInterface, function (e) { alert(e.code); });
                }

                function noFiles() {
                    //alert("no files");
                    //alert(FileError.NOT_FOUND_ERR);
                    //FileError.NOT_FOUND_ERR
                    fileSystem.root.getFile('data.txt', fileOptions, createDataInterface, function (e) { alert(e.code); });
                    fileSystem.root.getFile('creds.txt', fileOptions, createCredsInterface, function (e) { alert(e.code); });
                    fileSystem.root.getFile('clipDate.txt', fileOptions, createClipDateInterface, function (e) { alert(e.code); });
                }


                function createDataInterface(fileEntry) {
                    _data = new FileInterface(fileEntry);
                }

                function createCredsInterface(fileEntry) {
                    _creds = new FileInterface(fileEntry);
                }

                function createClipDateInterface(fileEntry) {
                    _clipDate = new FileInterface(fileEntry);
                }

                $(thisObj).on('interfaceready', function () {

                    if (_data.isReady && _creds.isReady && _clipDate.isReady) {

                        thisObj.data = function (arg) {
                            if (arg !== undefined) {
                                console.log('data set');
                                _data.write(arg);
                            }
                            else {
                                console.log('data get');
                                var retVal = _data.read();
                                if (!retVal || retVal === 'undefined') {
                                    return false;
                                }
                                else {
                                    return JSON.parse(retVal);
                                }
                            }
                        };

                        thisObj.creds = function (arg) {
                            if (arg !== undefined) {
                                console.log('creds set: ' + typeof arg === 'object' ? arg.toString() : arg.toString());
                                _creds.write(arg);
                            }
                            else {
                                console.log('creds get');
                                var retVal = _creds.read();
                                if (!retVal || retVal === 'undefined') {
                                    return false;
                                }
                                else {
                                    return JSON.parse(retVal);
                                }
                            }
                        };

                        thisObj.lastClipDate = function (arg) {
                            if (arg !== undefined) {
                                console.log('clipDate set');
                                _clipDate.write(arg);
                            }
                            else {
                                console.log('clipDate get');
                                var retVal = _clipDate.read();
                                if (!retVal || retVal === 'undefined') {
                                    return false;
                                }
                                else {
                                    return retVal;
                                }
                            }
                        };


                        thisObj.deleteFiles = function () { // file1, file2, file..., [callBackFunction]
                            var i = arguments.length,
                            callBack = function () { },
                            fileCount = (typeof arguments[i - 1] === 'function') ? i - 1 : i;

                            function fileDeleted() {
                                fileCount--;
                                if (fileCount === 0) {
                                    callBack();
                                }
                            }

                            function deleteFile(fileEntry) {
                                fileEntry.remove(fileDeleted, function (e) {
                                    Console.log("Delete Error: {0}", e.code);
                                });
                            }

                            while (i--) {
                                var thisArg = arguments[i];
                                if (typeof thisArg === 'string') {
                                    fileNameMap[thisArg].clearValue();
                                    fileSystem.root.getFile(thisArg, { create: false, exclusive: false }, deleteFile, function (e) {
                                        //alert(e.code);
                                        //ignore errors
                                        Console.log("get file Err: {0}",e.code);
                                    });
                                }
                                else if (typeof thisArg === 'function') {
                                    callBack = thisArg;
                                }
                            }
                        };

                        this.download = function (url, target) {
                            $.getJSON(url, function (data) {
                                localStorage[target] = data;
                            });
                        };

                        $(thisObj).trigger('dataStorageReady');

                    }
                });

                //the _vars are meant to become instances of this constructor
               
                function FileInterface(fileEntry) {

                    var
                        reader = new FileReader(),
                        thisInterface = this,
                        fileObj,
                        locked = true,
                        firstRead = true,
                        value
                    ;

                    fileNameMap[fileEntry.name] = this;
                    this.clearValue = function () { value = null; }

                    this.isReady = false;

                    this.write = function (content) {
                        if (typeof content !== 'string') {
                            if (typeof content === 'object') {
                                content = JSON.stringify(content);
                            }
                            else {
                                content = content.toString();
                            }
                        }
                        locked = true;
                        value = content;

                        fileEntry.createWriter(function (writer) {
                            writer.write(value);
                        });
                    };

                    this.read = function () {
                        return value;
                    };

                    fileEntry.file(function (e) {

                        reader.onload = function (evt) {
                            value = evt.target.result;
                            thisInterface.write(value);

                            locked = false;

                            if (firstRead) {
                                firstRead = false;
                                locked = true;
                                fileEntry.createWriter(function (initWriter) {
                                    initWriter.onwriteend = function () {
                                        thisInterface.isReady = true;
                                        fileObj = e;
                                        $(thisObj).trigger('interfaceready');
                                    }
                                    initWriter.write(value);
                                });
                            }
                        };

                        reader.onerror = function () {
                            alert('read failed');
                        };

                        reader.readAsText(e);

                    }, function () { alert('file obj create failed'); });

                    function waitForIt(handler) {
                        if (!locked) {
                            handler();
                        }
                        else {
                            var lockCheck = setInterval(function () {
                                if (!locked) { clearInterval(lockCheck); handler(); }
                            }, 200);
                        }
                    }

                }
            });


            $(dataStorage).on('dataStorageReady', initApp);

        }

        // request the persistent file system
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, null);
    }

   

    function initApp() {
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


        if (/testos\=ios7/.test(location.href.split('?')[1])) {
            $('body').addClass('ios7');
        }

        //unneeded in production
        if (/cleardata\=true/.test(location.href.split('?')[1])) {
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
						//'<b>Published: </b><span>{{publishDate}}</span>',
						'<b class="added_label">Added: </b><span>{{addedDate}}</span>',
					'</p>',
					'<span class="go_to_article_icon">&gt;</span>',
					'<button class="delete_article">&times;</span>',
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
				$_forwardBackBtns = $_contentNavigation.find('.forward, .back'),
				$_forwardBtn = $_contentNavigation.find('.forward'),
				$_backBtn = $_contentNavigation.find('.back'),
				$_slider = $('#slider'),
				$_showArticleListBtn = $('#content_navigation > .show_article_list_btn')
        ;
        if (!creds) {
            $_loginForm.submit(handleLogin);
            $_login.show();
        }
        else {
            //compareData(creds, function(){ buildContent(localStore['data']); });

            var url = AAP_GATEWAY_ROOT + 'sendtodata/getdata' +
				[
					'?uid=' + creds.uname,
					'&pwd=' + creds.pword,
					'&duid=' + device.uuid,
					'&dname=' + device.name,
					'&os=' + device.platform,
					'&lastClipDate=' + dataStorage.lastClipDate()
				].join('')
            ;

            getData(url, buildContent);
        }

        function handleLogin(e) {
            e.preventDefault();

            var
				isValid = true,
				creds = {
				    uname: $_uname.val(),
				    pword: $_pword.val()
				}
            ;

            if (!creds.uname) {
                isValid = false;
            }
            if (!creds.pword) {
                isValid = false;
            }

            if (isValid) {

                var
					url = AAP_GATEWAY_ROOT + 'sendtodata/getdata' +
					[
						'?uid=' + creds.uname,
						'&pwd=' + creds.pword,
						'&duid=' + device.uuid,
						'&dname=' + device.name,
						'&os=' + device.platform,
						'&lastClipDate='
					].join('')
                ;


                dataStorage.creds(creds);

                getData(url, buildContent);
            }
            else {
                alert(USER_ALERTS.missingLoginFields);
            }
            return false;
        }

        function getData(url, callBack) {

            if (!dataStorage.data()) {
                dataStorage.data({ Count: 5, data: [] });
            }

            $_loadingMsg.show();

            var
				count = 0,
				fullData = []
            ;

            (function getDataChunk(data) {
                fullData = fullData.concat(data.data);
                var newUrl = url + '&start=' + count;
                if (count < data.Count) {
                    count += 5;
                    $.getJSON(
						newUrl,
						getDataChunk
					)
					.fail(function (jqXHR, status, err) { alert(status + ', ' + err); })
					.always(function () {

					});
                }
                else { //data load success
                    $_loadingMsg.hide();

                    dataStorage.data().Count = data.Count; //concat data later so we only process new data
                    callBack(fullData);
                }
            })({ Count: 5, data: [] });
        }

        function sortByClipDate(a, b) {
            var retVal = parseInt(a.clipDate.replace(/[^\d]+/g, '')) - parseInt(b.clipDate.replace(/[^\d]+/g, ''));
            return retVal;
        }

        function buildContent(data) {
            //alert('buildContent begins');
            $('head').append(buildModuleStyleDecs(MODULE_IMG_MAP));

            data = data.concat(dataStorage.data().data);

            var
				i = data.length,
				articleListLIs = [],
				contentPages = []
            ;

            console.log(dataStorage.data());

            data.sort(sortByClipDate);

            data.reverse();

            if (data[0]) {
                dataStorage.lastClipDate(parseInt(data[0].clipDate.replace(/[^\d]+/g, '')));
            }
            else {
                dataStorage.lastClipDate(0);
            }

            console.log(dataStorage.lastClipDate());

            //alert('data processing starts here');

            while (i--) {
                (function (i) {
                    var
						thisData = data[i],
						mediaList = thisData.MediaList || [],
						mlen = mediaList.length,

						listItemVars = {
						    headline: thisData.Title,
						    moduleClass: thisData.SourceModule.replace(/ /g, '_').toLowerCase(),
						    publishDate: 'N/A',
						    addedDate: new Date(parseInt(thisData.clipDate.replace(/\D+/g, ''))),
						    pageNumber: i + 1
						},
						dateObj = listItemVars.addedDate,

						articleListItem = articleListTemplate.join('')
                    ;


                    listItemVars.addedDate = [dateObj.getMonth() + 1, dateObj.getDate(), dateObj.getFullYear()].join('-');

                    for (var x in listItemVars) {
                        articleListItem = articleListItem.replace(new RegExp('{{' + x + '}}', 'g'), listItemVars[x]);
                    }
                    if (!thisData.isProcessed) {

                        while (mlen--) {
                            var thisList = mediaList[mlen];
                            thisData.Content.replace(new RegExp(thisList.id, 'g'), AAP_GATEWAY_ROOT + thisList.locaton);
                        }

                        thisData.Content = thisData.Content.replace(/(id|xmlns)\="[^"]+"\s+/g, '');
                        //thisData.Content = thisData.Content.replace(/<root>/, '');
                        //thisData.Content = thisData.Content.replace(/http:\/\/66\.9\.140\.53\:801\//g, AAP_GATEWAY_ROOT);
                        //thisData.Content = thisData.Content.replace(/src="\//g,'src="' + AAP_GATEWAY_ROOT);
                        //thisData.Content = thisData.Content.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*)<\/a>/g, '<button class="converted_link" data-link="$1">Visit Link</button>');

                        //thisData.Content = '<div class="content"><div class="module_'+listItemVars.moduleClass+'"><h4 class="module_name">'+ (thisData.SourceModule !== 'NeoReview' ?  thisData.SourceModule : 'Neo Review') +'</h4>' + thisData.Content + '</div></div>';

                        thisData.isProcessed = true;

                    }
                    contentPages.push('<div class="page"></div>');
                    articleListLIs.unshift(articleListItem);
                })(i);
            }

            //alert('data processing finished');
            //alert(data.length);
            dataStorage.data({ Count: data.length, data: data });
            //alert('after data : 567');
            $('#article_list > ul').html(articleListLIs.join(''));
            $('#slider').html(contentPages.join(''));
            //alert('after slider : 570');
            //alert('login should hide after this');

            $('#login').hide();
            $('#article_list').show();

            behaviorInit();

        }

        function behaviorInit() {

            var
				currentPage = 0,

				$_window = $(window),

				$_selectArticleBtn = $('#article_list li')

            ;//end initial vars

            function loadURL(url) {
                $('#external_popup > iframe')[0].src = url;
                $('#external_popup').show();
            }

            $('#content_viewer').on('click', '.converted_link', function (e) {
                loadURL($(this).data('link'));
            });

            $('#edit_mode_toggle').click(function () {
                $_articleList.addClass('edit_mode').trigger('editmode');
            });

            $('#normal_mode_toggle').click(function () {
                $_articleList.removeClass('edit_mode').trigger('normalmode');
            });

            $('#article_list .delete_article').click(function () {
                var
					index = parseInt($(this).parent().data('page')) - 1,
					data = dataStorage.data()
                ;
                currentPage = 0;
                console.log(currentPage);
                $('#article_list li').eq(index).fadeOut(function () {
                    $(this).remove();
                    $('#article_list li').each(function (i) { $(this).data('page', i + 1); })
                });
                console.log(data);
                console.log(data.data);
                console.log(data.data.length);

                $('.page').eq(index).remove();
                var test = data.data.splice(index, 1);
                data.Count--;
                //data.data = data.data.splice(index, 1);

                

                dataStorage.data({ Count: data.Count, data: data.data });

                //may need to update further
            });

            articleSelectOn();

            $_articleList.on('editmode', articleSelectOff);
            $_articleList.on('normalmode', articleSelectOn);

            function articleSelectOn() {
                $_selectArticleBtn.on('click.mode_toggled', function () {
                    $_articleList.hide();
                    $_contentViewer.show();
                    gotoPage(parseInt($(this).data('page')));
                });
            }

            function articleSelectOff() {
                $_selectArticleBtn.off('click.mode_toggled');
            }

            $_forwardBackBtns.on('click', gotoPage);

            $_window.resize(function () { gotoPage(currentPage + 1); });

            //Enable swiping...
            $_slider.swipe({
                //Generic swipe handler for all directions
                swipeLeft: function (event, direction, distance, duration, fingerCount) {
                    if (duration < 350) {
                        gotoPage({ target: $_slider[0], direction: 'left' });
                    }
                },
                swipeRight: function (event, direction, distance, duration, fingerCount) {
                    if (duration < 350) {
                        gotoPage({ target: $_slider[0], direction: 'right' });
                    }
                },
                allowPageScroll: 'auto'
            });
            /*
			$_slider.swipeleft( function(e) {
				gotoPage( { target:$_slider[0], direction:'left' } );
			} );
			
			$_slider.swiperight( function(e) {
				gotoPage( { target:$_slider[0], direction:'right' } );
			} );
			*/
            $_showArticleListBtn.click(function () { $_contentViewer.hide(); $_articleList.show(); });

            if ($(document.body).hasClass('desktop_chrome')) {
                $('.stupid_android_lt3_button_up, .stupid_android_lt3_button_down').mousedown(scrollContent);
            }

            function gotoPage(e) {
                var sliderLimit = ($_slider.find('.page').size() - 1);
                console.log(sliderLimit);
                if (typeof e === 'object') { //slide if object, set to page w no animation if number

                    var
						sliderPos = currentPage,//Math.round( $_slider[0] !== 0 ? $_slider[0].scrollLeft / $(window).width() : 0 );
						isLeft = true;

                    if ($(this).is('button')) {
                        if ($(e.target).hasClass('forward')) {
                            isLeft = false;
                        }
                    }
                    else {
                        if (e.direction === 'left') {
                            isLeft = false;
                        }
                    }

                    if (isLeft) {
                        sliderPos -= 1;
                        if (sliderPos >= 0) {
                            $_slider.animate({ scrollLeft: sliderPos * $_window.width() }, 250, function () { FIFOLoad('left', sliderPos); });
                            currentPage = sliderPos;
                        }
                    }
                    else {
                        sliderPos += 1;
                        if (sliderPos <= sliderLimit) {
                            $_slider.animate({ scrollLeft: sliderPos * $_window.width() }, 250, function () { FIFOLoad('right', sliderPos); });
                            currentPage = sliderPos;
                        }
                    }

                }//end typeof e === 'object'
                else if (typeof e === 'number') {
                    var currentPos = e - 1;
                    injectFromListLoad(currentPos);
                    $_slider[0].scrollLeft = currentPos * $_window.width();
                    currentPage = currentPos;
                }

                //show/hide buttons
                if (currentPage === sliderLimit) {
                    $_forwardBtn.hide();
                }
                else {
                    $_forwardBtn.show();
                }

                if (currentPage === 0) {
                    $_backBtn.hide();
                }
                else {
                    $_backBtn.show();
                }

                $_contentNavigation.find('.article_count').text((currentPage + 1) + '/' + (sliderLimit + 1));

                function injectFromListLoad(targetPos) {
                    var
						data = dataStorage.data(),
						dataArr = data.data,
						count = dataArr.length,
						i = count,
						pageArr = []
                    ;


                    while (i--) {
                        pageArr.push('<div class="page"></div>');
                    }

                    console.log(targetPos);
                    if (targetPos - 1 >= 0) {
                        pageArr[targetPos - 1] = '<div class="page">' + dataArr[targetPos - 1].Content + '</div>';
                    }

                    pageArr[targetPos] = '<div class="page">' + dataArr[targetPos].Content + '</div>';


                    if (targetPos + 1 < dataArr.length) {
                        pageArr[targetPos + 1] = '<div class="page">' + dataArr[targetPos + 1].Content + '</div>';
                    }

                    $_slider.html(pageArr.join(''));
                }

                function FIFOLoad(direction, targetPos) {
                    var
						$_pages = $('#slider > .page'),
						data = dataStorage.data(),
						count = data.Count,
						dataArr = data.data
                    ;

                    if (direction === 'left') {
                        if (targetPos - 1 >= 0) {
                            $_pages.eq(targetPos - 1).html(dataArr[targetPos - 1].Content);
                        }
                        if (targetPos + 2 < count) {
                            $_pages.eq(targetPos + 2).html('');
                        }
                    }
                    else {
                        if (targetPos + 1 < count) {
                            $_pages.eq(targetPos + 1).html(dataArr[targetPos + 1].Content);
                        }
                        if (targetPos - 2 >= 0) {
                            $_pages.eq(targetPos - 2).html('');
                        }

                    }
                }
            }

            function scrollContent() {

                function scrollAdjustUp(increment) {
                    pagePos = pagePos - increment;
                    return pagePos;
                }

                function scrollAdjustDown(increment) {
                    pagePos = pagePos + increment;
                    return pagePos;
                }

                var
					$_this = $(this),
					$_page = $('.page').eq(currentPage),
					pagePos = $_page[0].scrollTop,
					pageHeight = $_page.innerHeight(),
					holdScroll = false,
					pageScroller,
					scrollAdjust
                ;

                if ($_this.hasClass('stupid_android_lt3_button_up')) {
                    scrollAdjust = scrollAdjustUp;
                }
                else {
                    scrollAdjust = scrollAdjustDown;
                }

                var scrollTimer = setTimeout(function () {
                    holdScroll = true;
                    pageScroller = setInterval(function () {
                        $_page.scrollTop(scrollAdjust(pageHeight / 8));
                    }, 30);
                }, 350);

                $(this).off('mouseup').mouseup(function () {

                    clearTimeout(scrollTimer);

                    clearInterval(pageScroller);

                    if (!holdScroll) {

                        $_page.animate({ scrollTop: scrollAdjust(pageHeight) + 'px' });

                    }

                });

            }

            
            $("#logMeOutBtn").click(function () {                                    
                dataStorage.deleteFiles("creds.txt", "data.txt", function () {            
                    $('#login').show();
                    $('#article_list').hide();
                })
            });
           

        } //end behaviorInit

        function supports_html5_storage() {
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        }

        function buildModuleStyleDecs(map) {
            var
				stylesArr = [],
				buildStyle = function (moduleName, imgSrc) {
				    return ('\t#article_list .' + moduleName.replace(/ /g, '_').toLowerCase() + ' { background-image:url(\'img/' + imgSrc + '\'); }\n');
				}
            ;
            for (var x in map) {
                stylesArr.push(buildStyle(x, map[x]));
            }
            return '<style>\n' + stylesArr.join('') + '</style>';
        }

        //});
        
    };

    function DesktopData() {

        this.creds = function (arg) {
            if (arg !== undefined) {
                localStorage.creds = JSON.stringify(arg);
            }
            else if (localStorage.creds !== undefined) {
                return JSON.parse(localStorage.creds);
            }
            else {
                return null;
            }
        };

        this.data = function (arg) {
            if (arg !== undefined) {
                localStorage.data = JSON.stringify(arg);
            }
            else {
                if (localStorage.data !== undefined) {
                    return JSON.parse(localStorage.data);
                }
                else {
                    return null;
                }
            }
        };

        this.lastClipDate = function (arg) {
            if (arg !== undefined) {
                localStorage.clipDate = arg;
            }
            else {
                return localStorage.clipDate;
            }
        };

        this.deleteFiles = function () { // file1, file2, file..., [callBackFunction]
            var i = arguments.length,
            callBack = function () { };

            while (i--) {
                var thisArg = arguments[i];
                if (typeof thisArg === 'string') {
                    localStorage[thisArg.split('.')[0]];
                }
                else if (typeof thisArg === 'function') {
                    callBack = thisArg;
                }
            }

            callBack();
        };

        this.download = function (url, target) {
            $.getJSON(url, function (data) {
                localStorage[target] = data;
            });
        };

    }

})();//end 'use strict'; wrapper func