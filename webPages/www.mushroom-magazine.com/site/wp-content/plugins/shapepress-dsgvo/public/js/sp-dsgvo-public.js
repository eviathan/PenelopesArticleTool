function getCookieValue(a) {
    var b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
}

( function ( $ ) {

	$( document ).ready( function () {
		
		// find checkbox
	    // on document change dissable submit button when checkbox is not
		// checked
		if ( cnArgs.commentsCb === '1' ) {
		    var gdpr_checkbox = $('input#gdpr-cb');
		    var errorText = $('.gdpr-cb-info-text');
		    var comments_submit_button = $('#commentform').find(':submit');
		    
	
		    $('#commentform').submit(function(e){
		    	
		    	if (gdpr_checkbox != null && gdpr_checkbox.prop('checked') === false)
	    		{
		    		 errorText.css('display', 'inline-block');
		    		e.preventDefault();
	    		} else
    			{
	    			errorText.css('display', 'none');
    			}
		    });
		    
		    //var comments_submit_button = $('#send_comment');
		    // on document load disable button to add comments
		    /*
		    comments_submit_button.prop('disabled', true);
		    comments_submit_button.addClass('gdpr-disabled');

		    $(document).on('change', function (e) {
		        if (gdpr_checkbox.prop('checked') === true) {
		            comments_submit_button.prop('disabled', false);
		            comments_submit_button.removeClass('gdpr-disabled');
		            errorText.css('display', 'none');

		        }else{
		            comments_submit_button.prop('disabled', true);
		            comments_submit_button.addClass('gdpr-disabled');
		            errorText.css('display', 'inline-block');
		        }
		        // TODO add event listenter for disabled button
		        // when is clicked and has class disabled
		        // show info that user has to check checkbox to submit comment
		    });
		    */
		}

		if ( cnArgs.cf7AccReplace === '1' ) {
			 var acceptanceLabel = $('.wpcf7-acceptance .wpcf7-list-item-label');
			 if (acceptanceLabel != null) {
				 acceptanceLabel.html(cnArgs.cf7AccText);
			 }
		}
	});
	
	// set Cookie Notice
	$.fn.setCookieNotice = function ( cookie_value ) {
		if ( cnArgs.onScroll === 'yes' ) {
			$( window ).off( 'scroll', cnHandleScroll );
		}

		var cnTime = new Date(),
			cnLater = new Date(),
			cnDomNode = $( '#cookie-notice' ),
			cnSelf = this;

		// set expiry time in seconds
		cnLater.setTime( parseInt( cnTime.getTime() ) + parseInt( cnArgs.cookieTime ) * 1000 );

		// set cookie
		cookie_value = cookie_value === 'accept' ? true : false;

		if (cookie_value == false && cnArgs.declineNoCookie === '1') {
			// nothing to do here, user should see notice again
		}
		else {
			document.cookie = cnArgs.cookieName + '=' + cookie_value + ';expires=' + cnLater.toGMTString() + ';' + ( cnArgs.cookieDomain !== undefined && cnArgs.cookieDomain !== '' ? 'domain=' + cnArgs.cookieDomain + ';' : '' ) + ( cnArgs.cookiePath !== undefined && cnArgs.cookiePath !== '' ? 'path=' + cnArgs.cookiePath + ';' : '' );
		}


		// trigger custom event
		$.event.trigger( {
			type: 'setCookieNotice',
			value: cookie_value,
			time: cnTime,
			expires: cnLater
		} );

		// hide message container
		if ( cnArgs.hideEffect === 'fade' ) {
			cnDomNode.fadeOut( 300, function () {
				cnSelf.removeCookieNotice();
			} );
		} else if ( cnArgs.hideEffect === 'slide' ) {
			cnDomNode.slideUp( 300, function () {
				cnSelf.removeCookieNotice();
			} );
		} else {
			cnSelf.removeCookieNotice();
		}

		if (cookie_value)
		{
			window['ga-disable-'+cnArgs.gaTagNumber] = false;
		} else
		{
			window['ga-disable-'+cnArgs.gaTagNumber] = true;
		}

		if ( cookie_value && cnArgs.redirection === '1' ) {
			var url = window.location.protocol + '//',
				hostname = window.location.host + '/' + window.location.pathname;

			if ( cnArgs.cache === '1' ) {
				url = url + hostname.replace( '//', '/' ) + ( window.location.search === '' ? '?' : window.location.search + '&' ) + 'cn-reloaded=1' + window.location.hash;

				window.location.href = url;
			} else {
				url = url + hostname.replace( '//', '/' ) + window.location.search + window.location.hash;

				window.location.reload( true );
			}

			return;
		} else if(cookie_value == false && cnArgs.declineTargetUrl !== '') {
			window.location = cnArgs.declineTargetUrl;
		}
	};

	// remove Cookie Notice
	$.fn.removeCookieNotice = function ( cookie_value ) {
		$( '#cookie-notice' ).remove();
		$( '#cookie-notice-blocker' ).remove();
		$( 'body' ).removeClass( 'cookies-not-accepted' );
	};

	$( document ).ready( function () {
		var cnDomNode = $( '#cookie-notice' );

		// handle on scroll
		if ( cnArgs.onScroll === 'yes' ) {
			cnHandleScroll = function () {
				var win = $( this );

				if ( win.scrollTop() > parseInt( cnArgs.onScrollOffset ) ) {
					// accept cookie
					win.setCookieNotice( 'accept' );

					// remove itself after cookie accept
					win.off( 'scroll', cnHandleScroll );
				}
			};
		}

		// handle set-cookie button click
		$( document ).on( 'click', '.cn-set-cookie', function ( e ) {
			e.preventDefault();

			$( this ).setCookieNotice( $( this ).data( 'cookie-set' ) );
		} );

		// display cookie notice
		if ( document.cookie.indexOf( cnArgs.cookieName ) === -1 ) {
			// handle on scroll
			if ( cnArgs.onScroll === 'yes' ) {
				$( window ).on( 'scroll', cnHandleScroll );
			}

			if ( cnArgs.hideEffect === 'fade' ) {
				cnDomNode.fadeIn( 300 );
			} else if ( cnArgs.hideEffect === 'slide' ) {
				cnDomNode.slideDown( 300 );
			} else {
				cnDomNode.show();
			}

			$( 'body' ).addClass( 'cookies-not-accepted' );
		} else {
			cnDomNode.removeCookieNotice();
		}

		// set the correct state of the ga opt-out tracker
		if (cnArgs.trackerInitMoment == 'on_load') {
			// it tracks until user denies cn
			window['ga-disable-'+cnArgs.gaTagNumber] =  getCookieValue(cnArgs.cookieName) == 'false';
		} else if (cnArgs.trackerInitMoment == 'after_confirm') {
			// it only tracks if user confirms
			window['ga-disable-'+cnArgs.gaTagNumber] =  getCookieValue(cnArgs.cookieName) != 'true';
		}


		
	} );





} )( jQuery );

/* i592995 */

(function( $ ) {
    'use strict';

    var scrollBar = null;

    /**
    * Popup close button (if no url provided)
    */
    function preparePopupClose() {
        var $popupClose = $('#dsgvo_popup_close'),
            $overlay = $('.dsgvo-popup-overlay');

        if($popupClose.hasClass('close')) {
            $popupClose.on('click tap', function(event) {
                event.preventDefault();
                event.stopPropagation();

                $overlay.remove();
            });
        }
    }

    /**
    * Language switcher click (expand/collapse)
    */
    function preparePopupLangSwitcher() {
        var $active = $('.dsgvo-lang-active'),
            $dropdown = $('.dsgvo-lang-dropdown'),
            $switcher = $('.dsgvo-popup-language-switcher');

        $active.on('click tap', function() {
            $dropdown.toggleClass('active');
        });

        $(document).on('click tap', function(e) {
            if (!$switcher.is(e.target) && $switcher.has(e.target).length === 0) {
                $dropdown.removeClass('active');
            }
        });
    }

    /**
    * Popup accordion expand/collapse
    */
    function preparePopupAccordion() {
        var $accordion = $('.dsgvo-popup-accordion'),
            $top = $accordion.find('.dsgvo-accordion-top'),
            $wrapper = $accordion.find('.dsgvo-accordion-wrapper');

        $top.on('click tap', function() {
            var $inner = $wrapper.children('.dsgvo-accordion-inner');
            $accordion.toggleClass('open');
            if($accordion.hasClass('open')) {
                $wrapper.css('height', $inner.outerHeight() + 'px');
            } else {
                $wrapper.css('height', '0');
            }
        });

        $(window).resize(function() {
            if($accordion.hasClass('open')) {
                $wrapper.css('height', $wrapper.children('.dsgvo-accordion-inner').outerHeight() + 'px');
            }
        });
    }

    /**
    * Adds Simplebar js scrollbar
    */
    function prepareScrolling() {
        var $moreButton = $('#more_options_button'),
            $accordion = $('#dsgvo_popup_accordion'),
            $content = $('.dsgvo-privacy-content');

            if($content.length > 0) {
                scrollBar = new SimpleBar($('.dsgvo-privacy-content')[0], {
                    autoHide: false
                });
            }

        $moreButton.on('click tap', function(event) {
            event.preventDefault();
            event.stopPropagation();

            if(!$accordion.hasClass('open')) {
                $accordion.addClass('open');
                $accordion.find('.dsgvo-accordion-wrapper').css('height', $accordion.find('.dsgvo-accordion-inner').outerHeight() + 'px');
            }
            scrollBar.getScrollElement().scrollTop += $accordion.position().top;
        });
    }

    /**
    * Adds ajax action for popup Accept button
    */
    function prepareAcceptButton() {
        $('#popup_accept_button').on('click tap', function(event) {
            event.preventDefault();
            event.stopPropagation();

            var $this = $(this),
                $form = $('.privacy-settings-form'),
                $selects = $form.find('select'),
                values = new Array();

            $this.addClass('sent');

            $selects.each(function() {
                var $this = $(this);
                var service = new Object();
                service.name = $this.attr('name');
                service.value = $this.val();
                values.push(service);
            });

            $.post( cnArgs.ajaxurl, {
                action: 'user-permissions',
                version: 'alt',
                services: JSON.parse(JSON.stringify(values)),
            },
            function( data ) {
                $.post( cnArgs.ajaxurl, {
                    action: 'popup-accept',
                },
                function( data ) {
                } );
            } );
            var d = new Date();
            d.setTime(d.getTime() + parseInt( cnArgs.cookieTime ) * 1000);
            var expires = "expires="+ d.toUTCString();
            document.cookie = "sp_dsgvo_popup=1;" + expires + ";path=/";
            $('.dsgvo-popup-overlay').remove();
            
            // set the correct state of the ga opt-out tracker
            window['ga-disable-'+cnArgs.gaTagNumber] =  false;
            
            // reload after confirm to init tracker
            if (cnArgs.reloadOnConfirmPopup === '1' ) {
    			var url = window.location.protocol + '//',
    				hostname = window.location.host + '/' + window.location.pathname;

    			if ( cnArgs.cache === '1' ) {
    				url = url + hostname.replace( '//', '/' ) + ( window.location.search === '' ? '?' : window.location.search + '&' ) + 'cn-reloaded=1' + window.location.hash;

    				window.location.href = url;
    			} else {
    				url = url + hostname.replace( '//', '/' ) + window.location.search + window.location.hash;

    				window.location.reload( true );
    			}

    			return;
    		} 
            
        });

    }

    /**
    * Adds click event to terms links
    */
    function prepareTermsLinks() {
        var $links = $('.dsgvo-terms-toggle');

        $links.on('click tap', function(event) {
            event.preventDefault();
            event.stopPropagation();

            var $this = $(this),
                $content = $('#terms_content_' + $this.attr('data-id'));

            $content.addClass('active');
            scrollBar.recalculate();
            $(window).resize();
        });
    }

    function showPopup() {
        var $overlay = $('.dsgvo-popup-overlay');

        if($overlay.length > 0) {
            var cookies = document.cookie;
            //console.log(cookies);
            if($overlay.hasClass('not-accepted') && cookies.indexOf('sp_dsgvo_popup') === -1) {
                $overlay.removeClass('dsgvo-overlay-hidden');
            }
        }
    }

    $(document).ready(function() {
        showPopup();
        preparePopupClose();
        preparePopupLangSwitcher();
        preparePopupAccordion();
        prepareScrolling();
        prepareAcceptButton();
        prepareTermsLinks();
    });

})( jQuery );
