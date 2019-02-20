var cff_js_exists = (typeof cff_js_exists !== 'undefined') ? true : false;
if(!cff_js_exists){

function cff_init( $cff ){

	//Check whether it's a touch device
	var cffTouchDevice = false;
    if (cffIsTouchDevice() === true) cffTouchDevice = true;
    function cffIsTouchDevice() {
        return true == ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
    }

	//If a feed selector isn't passed in then default to using selector for all feeds
	var firsttime = false;
	if(typeof $cff === 'undefined'){
		$cff = jQuery('.cff');
		firsttime = true;
	}

	(function($){

		//Toggle comments
		jQuery(document).off('click', '#cff a.cff-view-comments').on('click', '#cff a.cff-view-comments', function(){
			var $commentsBox = jQuery(this).closest('.cff-item').find('.cff-comments-box');
			
			$commentsBox.slideToggle();

			//Add comment avatars
			$commentsBox.find('.cff-comment:visible').each(function(){
				var $thisComment = jQuery(this);
				$thisComment.find('.cff-comment-img:not(.cff-comment-reply-img) a').html( '<img src="https://graph.facebook.com/'+$thisComment.attr("data-id")+'/picture" alt="Avatar" onerror="this.style.display=\'none\'" />' );
			});

		});

		//Set paths for query.php
		if (typeof cffsiteurl === 'undefined' || cffsiteurl == '') cffsiteurl = window.location.host + '/wp-content/plugins';
		var locatefile = true;

		//Create meta data array for caching likes and comments
		var metaArr = {},
			newMetaArr = {}; //For caching only new posts that are loaded

		//Loop through the feeds on the page and add a unique attribute to each to use for lightbox groups
		var lb = 0;
		jQuery('#cff.cff-lb').each(function(){
			lb++;
			$(this).attr('data-cff-lb', lb);
		});

		
		//If it's the first load then loop through all .cff-items on the page, otherwise, only loop through the feed where the load more button is clicked
		var $cff_post_selector = $cff.find('.cff-item.cff-new, .cff-album-item.cff-new');
		if( firsttime ){
			$cff_post_selector = jQuery('#cff .cff-item.cff-new, #cff .cff-album-item.cff-new');
		}

		//Loop through each item
		$cff_post_selector.each(function(){

			var $self = jQuery(this);

			//Wpautop fix
			if( $self.find('.cff-viewpost-link, .cff-viewpost-facebook, .cff-viewpost').parent('p').length ){
				//Don't unwrap event only viewpost link
				if( !$self.hasClass('event') ) $self.find('.cff-viewpost-link, .cff-viewpost-facebook, .cff-viewpost').unwrap('p');
			}
			if( $self.find('.cff-photo').parent('p').length ){
				$self.find('p .cff-photo').unwrap('p');
				$self.find('.cff-album-icon').appendTo('.cff-photo:last');
			}
			if( $self.find('.cff-event-thumb').parent('p').length ){
				$self.find('.cff-event-thumb').unwrap('p');
			}
			if( $self.find('.cff-vidLink').parent('p').length ){
				$self.find('.cff-vidLink').unwrap('p');
			}
			if( $self.find('.cff-link').parent('p').length ){
				$self.find('.cff-link').unwrap('p');
			}
			if( $self.find('.cff-viewpost-link').parent('p').length ){
				$self.find('.cff-viewpost-link').unwrap('p');
			}
			if( $self.find('.cff-viewpost-facebook').parent('p').length ){
				$self.find('.cff-viewpost-facebook').unwrap('p');
			}

			if( $self.find('iframe').parent('p').length ){
				$self.find('iframe').unwrap('p');
			}
			if( $self.find('.cff-author').parent('p').length ){
				$self.find('.cff-author').eq(1).unwrap('p');
				$self.find('.cff-author').eq(1).remove();
			}
			if( $self.find('.cff-view-comments').parent('p').length ){
				$self.find('.cff-meta-wrap > p').remove();
				$self.find('.cff-view-comments').eq(1).remove();
				//Move meta ul inside the link element
				var $cffMeta = $self.find('.cff-meta'),
					cffMetaClasses = $cffMeta.attr('class');
				$cffMeta.find('.cff-view-comments').unwrap().wrapInner('<ul class="'+cffMetaClasses+'">');
			}
			if( $self.find('.cff-photo').siblings('.cff-photo').length ){
				$self.find('.cff-photo').slice(0,2).remove();
			}
			//Fix the formatting issue that pushes avatar to the left
			if( $('.cff-author-img').parent().is('p') ) $('.cff-author-img').unwrap('p');
			//Remove empty p tags
			$self.find('p:empty').not('.cff-comments-box p').remove();


			//Expand post
			var	expanded = false;
			if( $self.hasClass('cff-event') ){
				var $post_text = $self.find('.cff-desc .cff-desc-text'),
					text_limit = $post_text.parent().attr('data-char');
			} else {
				var $post_text = $self.find('.cff-post-text .cff-text'),
					text_limit = $self.closest('#cff').attr('data-char');
			}

			if (typeof text_limit === 'undefined' || text_limit == '') text_limit = 99999;
			
			//If the text is linked then use the text within the link
			if ( $post_text.find('a.cff-post-text-link').length ) $post_text = $self.find('.cff-post-text .cff-text a');
			var	full_text = $post_text.html();
			if(full_text == undefined) full_text = '';


			//Truncate text taking HTML tags into account
			var cff_trunc_regx = new RegExp(/(<[^>]*>)/g);
			var cff_trunc_counter = 0;

			//convert the string to array using the HTML tags as delimiter and keeping them as array elements
			full_text_arr = full_text.split(cff_trunc_regx);

			for (var i = 0, len = full_text_arr.length; i < len; i++) {
				//ignore the array elements that are HTML tags
				if ( !(cff_trunc_regx.test(full_text_arr[i])) ) {
				  	//if the counter is 100, remove this element with text
					if (cff_trunc_counter == text_limit) {
				    	full_text_arr.splice(i, 1);
				        continue; //ignore next commands and continue the for loop
				    }
				    //if the counter != 100, increase the counter with this element length
				    cff_trunc_counter = cff_trunc_counter + full_text_arr[i].length;
				    //if is over 100, slice the text of this element to match the total of 100 chars and set the counter to 100
				    if (cff_trunc_counter > text_limit) {
				      	var diff = cff_trunc_counter - text_limit;
				        full_text_arr[i] = full_text_arr[i].slice(0, -diff);
				        cff_trunc_counter = text_limit;

				        //Show the 'See More' link if needed
						if (full_text.length > text_limit) $self.find('.cff-expand').show();
				    }
				}
			}

			//new string from the array
			var short_text = full_text_arr.join('');

			//remove empty html tags from the array
			short_text = short_text.replace(/(<(?!\/)[^>]+>)+(<\/[^>]+>)/g, "");

			//If the short text cuts off in the middle of a <br> tag then remove the stray '<' which is displayed
			var lastChar = short_text.substr(short_text.length - 1);
			if(lastChar == '<') short_text = short_text.substring(0, short_text.length - 1);

			//Remove any <br> tags from the end of the short_text
			short_text = short_text.replace(/(<br>\s*)+$/,''); 
			short_text = short_text.replace(/(<img class="cff-linebreak">\s*)+$/,''); 

			//Cut the text based on limits set
			$post_text.html( short_text );


			//Click function
			$self.find('.cff-expand a').unbind('click').bind('click', function(e){
				e.preventDefault();
				var $expand = jQuery(this),
					$more = $expand.find('.cff-more'),
					$less = $expand.find('.cff-less');
				if (expanded == false){
					$post_text.html( full_text );
					expanded = true;
					$more.hide();
					$less.show();
				} else {
					$post_text.html( short_text );
					expanded = false;
					$more.show();
					$less.hide();			
				}
				cffLinkHashtags();
				//Add target to links in text when expanded
				$post_text.find('a').attr('target', '_blank');

				//Re-init masonry for JS
				if( $self.closest('.cff').hasClass('cff-masonry') && !$self.closest('.cff').hasClass('cff-masonry-css') ){
					cffAddMasonry($cff);
				}

			});
			//Add target attr to post text links via JS so aren't included in char count
			$post_text.find('a').add( $self.find('.cff-post-desc a') ).attr({
				'target' : '_blank',
				'rel' : 'nofollow'
			});


			//This is the modified Post ID - so if the post is an album post then this could be the album ID which is used to get the lightbox thumbs
			var post_id = $self.attr('id').substring(4),
				//This is the original post ID which is used to get the number of likes and comments for the timeline post
				post_id_orig = $self.find('.cff-view-comments').attr('id');

			if( locatefile != true ) $self.find('.cff-lightbox-thumbs-holder').css('min-height', 0);
			

			//Show all comments on click
			jQuery(document).off('click', '#cff .cff-show-more-comments, .cff-lightbox-sidebar .cff-show-more-comments').on('click', '#cff .cff-show-more-comments, .cff-lightbox-sidebar .cff-show-more-comments', function(){

				var $cffMoreCommentsLink = jQuery(this),
					thisCommentsTotal = parseInt($cffMoreCommentsLink.attr('data-cff-comments-total'));

				//If there's more than 25 comments then link the "View more comments" link to post on Facebook
				if( $cffMoreCommentsLink.hasClass('cff-clicked') && thisCommentsTotal > 25 ){
					//Link to Facebook
					$cffMoreCommentsLink.find('a').attr({
						'href' : $cffMoreCommentsLink.closest('.cff-comments-box').find('.cff-comment-on-facebook a').attr('href'),
						'target' : '_blank'
					});
				}
				//Hide 'View more comments' link
				if( thisCommentsTotal <= 25 ) $cffMoreCommentsLink.hide();

				//Add class so we can only trigger the above on the second click
				$cffMoreCommentsLink.addClass('cff-clicked');

				//Show comments and add comment avatars
				$cffMoreCommentsLink.parent().find('.cff-comment').show().each(function(){
					var $thisComment = jQuery(this);
					$thisComment.find('.cff-comment-img:not(.cff-comment-reply-img) a').html( '<img src="https://graph.facebook.com/'+$thisComment.attr("data-id")+'/picture" alt="Avatar" />' );
				});
			});
			

			//Remove event end date day if the same as the start date
			if( $self.hasClass('cff-timeline-event') || $self.hasClass('cff-event') ){
				if( $(this).find('.cff-date .cff-start-date k').text() !== $(this).find('.cff-date .cff-end-date k').text() ) $(this).find('.cff-date .cff-end-date k').show();
			}


			//Replace Photon (Jetpack CDN) images with the originals again
			var $cffPhotoImg = $self.find('.cff-photo img, .cff-event-thumb img, .cff-poster, .cff-album-cover img'),
				cffPhotoImgSrc = $cffPhotoImg.attr('src'),
				cffImgStringAttr = $cffPhotoImg.attr('data-querystring');

			if( typeof cffPhotoImgSrc == 'undefined' ) cffPhotoImgSrc = '';

			if( cffPhotoImgSrc.indexOf('i0.wp.com') > -1 || cffPhotoImgSrc.indexOf('i1.wp.com') > -1 || cffPhotoImgSrc.indexOf('i2.wp.com') > -1 || cffPhotoImgSrc.indexOf('i3.wp.com') > -1 || cffPhotoImgSrc.indexOf('i4.wp.com') > -1 || cffPhotoImgSrc.indexOf('i5.wp.com') > -1 ){
				
				//Create new src. Single slash in https is intentional as one is left over from removing i_.wp.com
				var photonSrc = $cffPhotoImg.attr('src').substring(0, $cffPhotoImg.attr('src').indexOf('?')),
					newSrc = photonSrc.replace('http://', 'https:/').replace(/i0.wp.com|i1.wp.com|i2.wp.com|i3.wp.com|i4.wp.com|i5.wp.com/gi, '') + '?' + cffImgStringAttr;

				$cffPhotoImg.attr('src', newSrc);
			}

			function cffLinkHashtags(){
				//Link hashtags
				var cffTextStr = $self.find('.cff-text').html(),
					cffDescStr = $self.find('.cff-post-desc').html(),
					regex = /(^|\s)#(\w*[\u0041-\u005A\u0061-\u007A\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]+\w*)/gi,
					linkcolor = $self.find('.cff-text').attr('data-color');

				function replacer(hash){
					//Remove white space at beginning of hash
					var replacementString = jQuery.trim(hash);
					//If the hash is a hex code then don't replace it with a link as it's likely in the style attr, eg: "color: #ff0000"
					if ( /^#[0-9A-F]{6}$/i.test( replacementString ) ){
						return replacementString;
					} else {
						return ' <a href="https://www.facebook.com/hashtag/'+ replacementString.substring(1) +'" target="_blank" rel="nofollow" style="color:#' + linkcolor + '">' + replacementString + '</a>';
					}
				}

				//If it's not defined in the source code then set it to be true
				if (typeof cfflinkhashtags == 'undefined') cfflinkhashtags = 'true';

				if(cfflinkhashtags == 'true'){
					//Replace hashtags in text
					var $cffText = $self.find('.cff-text');
					
					if($cffText.length > 0){
						//Add a space after all <br> tags so that #hashtags immediately after them are also converted to hashtag links. Without the space they aren't captured by the regex.
						cffTextStr = cffTextStr.replace(/<br>/g, "<br> ");
						$cffText.html( cffTextStr.replace( regex , replacer ) );
					}
				}

				//Replace hashtags in desc
				if( $self.find('.cff-post-desc').length > 0 ) $self.find('.cff-post-desc').html( cffDescStr.replace( regex , replacer ) );
			}
			cffLinkHashtags();

			//Add target attr to post text links via JS so aren't included in char count
			$self.find('.cff-text a').attr('target', '_blank');


			//Add lightbox tile link to photos
			if( $self.closest('#cff').hasClass('cff-lb') ){
				$self.find('.cff-photo, .cff-album-cover, .cff-event-thumb, .cff-html5-video, .cff-iframe-wrap').each(function(){
					var $photo = $(this),
						postId = post_id,
						cffLightboxTitle = '',
						cffShowThumbs = false,
						postType = '',
						cffgroupalbums = '';


					// if( $self.hasClass('cff-album') || $self.hasClass('cff-albums-only') ) cffShowThumbs = true;
					cffShowThumbs = true;

					function cffFormatCaption(text){
						return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, "<br/>");
					}

					//Set the caption/title
					if( $self.hasClass('cff-albums-only') ){
						postType = 'albumsonly';
						cffLightboxTitle = cffFormatCaption( $self.find('img').attr('alt') );
						
						//Check whether there's an absolute path attr and if there is then add it to the query
		      			var dataGroup = $self.closest('#cff').attr('data-group');
						if( typeof dataGroup !== 'undefined' ) cffgroupalbums = 'data-cffgroupalbums="true"';

					} else if( $self.hasClass('cff-timeline-event') ) {
						var capText = '';
						if( $self.find('.cff-author-text .cff-page-name').length ) capText += $self.find('.cff-author-text .cff-page-name').text() + '<br /><br />';
						//Display the full event details but the info is hidden in CSS as it's too long in some cases
						if( full_text.length > 5 ) capText += full_text;
						cffLightboxTitle = cffFormatCaption( capText );
					} else if ( $self.hasClass('cff-event') ) {
						cffLightboxTitle = cffFormatCaption( $self.find('.cff-date > .cff-start-date').text() );
					} else if( $self.hasClass('cff-album-item') ) {
						cffLightboxTitle = cffFormatCaption( $self.find('img').attr('alt') );
					} else {
						var lb_title = full_text;
						//If there's no post text then use the description
						if( full_text.trim() == '' ) lb_title = $self.find('.cff-post-desc').text();

						//If there's no post text or desc then use the story
						if( lb_title == '' && $self.find('.cff-author .cff-story').length ) lb_title = $self.find('.cff-author .cff-page-name').text();

						//If there's no text at all then just set it to be a space so that it renders as blank, otherwise it will use the caption from the post before
						if( lb_title == '' ) lb_title = '&nbsp;';

						cffLightboxTitle = cffFormatCaption( lb_title );
					}

					if(cffLightboxTitle.length > 1) cffLightboxTitle = cffLightboxTitle.replace(/"/g, '&quot;');


					//Create the lightbox link
					//Add the hover tile
					var cffLightboxTile = '<a class="cff-lightbox-link" rel="nofollow" ';

					//If it's a YouTube or Vimeo then set the poster image to use in the lightbox
					if( $photo.hasClass('cff-iframe-wrap') ){
						//Add the image to the video lightbox placeholder as a query string so that the href value is unique and is added to the lightbox order. Otherwise, if it doesn't contain the query string then all videos that use the placeholder have the same URL and so they aren't added to the lightbox order. The actual video image is very small and so we need to use the placeholder to have the video display larger in the lightbox:
						cffLightboxTile += 'href="'+cffsiteurl+'/custom-facebook-feed-pro/img/video-lightbox.png?'+postId+'" data-iframe="'+$photo.find('iframe').attr('src')+'" ';
					//If it's a swf then display it in an iframe
					} else if( $photo.hasClass('cff-swf') ) {
						cffLightboxTile += 'href="'+cffsiteurl+'/custom-facebook-feed-pro/img/video-lightbox.png" data-iframe="'+$photo.find('video').attr('src')+'" ';
					} else {
						var lb_href = $photo.find('img').attr('src');
						if( $photo.find('img').attr('data-cff-full-img') ) lb_href = $photo.find('img').attr('data-cff-full-img');
						cffLightboxTile += 'href="'+lb_href+'" data-iframe="" ';
					}

					//No nav
					// cffLightboxTile += 'data-cff-lightbox="'+postId+'" data-title="'+cffLightboxTitle+'" data-id="'+postId+'" data-thumbs="'+cffShowThumbs+'" ';
					cffLightboxTile += 'data-cff-lightbox="cff-lightbox-'+$self.closest("#cff").attr("data-cff-lb")+'" data-title="'+cffLightboxTitle+'" data-id="'+postId+'" data-thumbs="'+cffShowThumbs+'" '+cffgroupalbums+' ';

					//If it's an HTML5 video then set the data-video attr
					if( $photo.hasClass('cff-html5-video') ){

						if($photo.hasClass('cff-swf')){
							cffLightboxTile += 'data-url="'+$photo.find('.cff-html5-play').attr('href')+'" data-video="';
						} else {
							cffLightboxTile += 'data-url="'+$photo.find('.cff-html5-play').attr('href')+'" data-video="'+$photo.find('img').attr('data-cff-video');
						}

					//Videos only:
					} else if( $photo.hasClass('cff-video') ) {
						cffLightboxTile += 'data-url="http://facebook.com/'+$photo.attr('id')+'" data-video="'+$photo.attr('data-source');
					} else if( $photo.hasClass('cff-iframe-wrap') ) {
						cffLightboxTile += 'data-url="http://facebook.com/'+post_id+'" data-video="';
					} else {
						cffLightboxTile += 'data-url="'+$photo.attr('href')+'" data-video="';
					}

					cffLightboxTile += '" data-type="'+postType+'" data-lb-comments="'+$photo.closest('.cff-lb').attr('data-lb-comments')+'"><div class="cff-photo-hover"><i class="fa fa-search-plus" aria-hidden="true"></i><span class="cff-screenreader">View</span></div></a>';

					//Add the link to the photos/videos in the feed
					$photo.prepend(cffLightboxTile);

					if( !cffTouchDevice ){ //Only apply hover effect if not touch screen device
						//Fade in links on hover
						$photo.hover(function(){
							$self.find('.cff-photo-hover').fadeIn(150);
						}, function(){
							$self.find('.cff-photo-hover').stop().fadeOut(500);
						});
					}

				});
			}

			//Share tooltip function
			// Alternative method if needed:
			// jQuery(document).on('click', '.cff-share-link', function(){
		  	//	 $(this).siblings('.cff-share-tooltip').toggle();
		  	// });
			$self.find('.cff-share-link').unbind().bind('click', function(){
	        	$self.find('.cff-share-tooltip').toggle();
	      	});


			
			//If it's a restricted page then use the lightbox src for the photo feed images
			if( typeof $cff.attr('data-restricted') !== 'undefined' ){
				var cff_restricted_page = true;
			} else {
				var cff_restricted_page = false;
			}

      		//Photos only
      		if( $self.hasClass('cff-album-item') ){
				var cff_data_full_size = $self.attr('data-cff-full-size');
				
				if( typeof cff_data_full_size !== 'undefined' && cff_data_full_size != '' ){

					if( cff_restricted_page ){
						$self.find('.cff-lightbox-link').attr('href', cff_data_full_size).closest('.cff-album-cover').css('background-image', 'url('+cff_data_full_size+')');
						$self.find('img').attr('src', cff_data_full_size);
					} else {
						$self.find('.cff-lightbox-link').attr('href', cff_data_full_size);
					}

				}
			}


			//Add the HD video player
			//If it's a video post then add the video link to the video element so it can be used in the lightbox
			if( ( $self.find('.cff-html5-video').length || $self.hasClass('cff-video') ) ){
				
				var cff_live_video = false;

				//Set the selector based on whether it's a timeline vid or videos only
				if( $self.find('.cff-html5-video').length ){
					var $vid_sel = $self.find('.cff-html5-video');
					if( $vid_sel.attr('data-cff-live') == 'true' ) cff_live_video = true;
				}
				if( $self.hasClass('cff-video') ) var $vid_sel = $self;

				if( cff_live_video && $(window).width() <= 640 ){
					//If it's live video and on mobile then use HTMl5 player as live video doesn't work on mobile using Facebook player
				} else {

					//If the Facebook Player is selected then pass the iframe URL into the lightbox.
					if( $vid_sel.attr('data-cff-video-player') != 'standard' ){
						$self.find('.cff-lightbox-link').attr({
							'data-iframe' : 'https://www.facebook.com/v2.3/plugins/video.php?href=' + $vid_sel.attr('data-cff-video-link'),
							'data-video' : ''
						});
					}

				}

			}

			//Try to fix any video wrapper formatting issues
   			setTimeout(function(){
			  $self.find('.cff-iframe-wrap .fluid-width-video-wrapper iframe').unwrap().wrap('<div style="float: left; width: 100%;"></div>');
			  $self.find('.cff-iframe-wrap .iframe-embed iframe').unwrap('iframe-embed');
			}, 500);


			//Open lightbox when clicking album or video title
			$self.find('.cff-album-info a').on('click', function(e){
				e.preventDefault();
				$self.find('.cff-lightbox-link').trigger('click');
			});


		}); //End $cff_post_selector.each loop


		//Load comment replies
		jQuery(document).off('click', '.cff-comment-replies a').on('click', '.cff-comment-replies a', function(){
			cffLoadCommentReplies( $(this) );
		});


		$('.cff-wrapper').each(function(){
			var $cff = $(this).find('#cff'),
				cff_grid_pag = $cff.attr('data-grid-pag');

			//Get the Access Token from the shortcode so it can be used in the connect file
			var shortcode_token_param = cffGetShortcodeToken($cff);

			//Allow us to make some tweaks when the feed is narrow
			function cffCheckWidth(){
				if( $cff.innerWidth() < 400 ){
					if( !$cff.hasClass('cff-disable-narrow') ){
						$cff.addClass('narrow');
						//Use full-size shared link images on narrow layout, unless setting is unchecked
						$('.cff-shared-link .cff-link').each(function(){
							//$(this).find('img').attr('src', $(this).attr('data-full') );
						});
					}
				} else {
					$cff.removeClass('narrow');
				}
			}
			cffCheckWidth();

			function cffActionLinksPos(){
				if( $cff.innerWidth() < (190 + $('.cff-post-links').innerWidth() ) ){
					$cff.find('.cff-post-links').addClass('cff-left')
				} else {
					$cff.find('.cff-post-links').removeClass('cff-left');
				}
			}
			cffActionLinksPos();

			//Only check the width once the resize event is over
			var cffdelay = (function(){
				var cfftimer = 0;
					return function(cffcallback, cffms){
					clearTimeout (cfftimer);
					cfftimer = setTimeout(cffcallback, cffms);
				};
			})();
			window.addEventListener('resize', function(event){
				cffdelay(function(){
			    	cffCheckWidth();
			    	cffActionLinksPos();
			    	cffResizeAlbum();
			    }, 500);
			});

			//Albums only
			//Resize image height
			function cffResizeAlbum(last){
				var cffAlbumWidth = $cff.find('.cff-album-item').eq(0).find('a').innerWidth();
				$cff.find('.cff-album-item a').css('height', cffAlbumWidth);
				//Crops event images when selected
				$cff.find('.cff-photo.cff-crop').css( 'height', $cff.find('.cff-photo.cff-crop').width() );

				//Sets crop height of main post image to be 60% (or the height of the thumbs - whichever is larger - so it's never shorter than the thumbs) to make room for the thumbs beneath
				$cff.find('.cff-item.cff-album .cff-photo.cff-multiple, .cff-video-post .cff-html5-video.cff-multiple').each(function(){
					var $cffPhotoEl = $(this);

					//Crop image attachments in posts
					var cffPhotoImgWidth = $cffPhotoEl.find('img').first().width();
					if( cffPhotoImgWidth < 10 ) cffPhotoImgWidth = 300;

					if($cffPhotoEl.hasClass('cff-img-layout-3')) $cffPhotoEl.find('.cff-img-attachments .cff-crop').css( 'height', cffPhotoImgWidth/2 );
					if($cffPhotoEl.hasClass('cff-img-layout-4')) $cffPhotoEl.find('.cff-img-attachments .cff-crop').css( 'height', cffPhotoImgWidth/3 );

					//Crop main image
					if( $cffPhotoEl.is('.cff-img-layout-3, .cff-img-layout-4') ){
						var $cffMainImage = $cffPhotoEl.find('.cff-main-image'),
							cropPercentage = 0.6;
						if( $cffPhotoEl.hasClass('cff-img-layout-4') ) cropPercentage = 0.8;

						//Set the height based on ratio
						var cffImageHeight = Math.round( cffPhotoImgWidth / $cffMainImage.find('img').attr('data-ratio') );
						$cffMainImage.css( 'height', Math.round( Math.max(cffImageHeight*cropPercentage, $cffPhotoEl.find('.cff-img-attachments').height() ) ) );
					} else if( $cffPhotoEl.is('.cff-img-layout-2') ) {
						var $cffCrop = $cffPhotoEl.find('.cff-img-wrap.cff-crop');
						if( $cffPhotoEl.hasClass('cff-portrait') ){
							$cffPhotoEl.find('.cff-img-wrap.cff-crop').css('height', $cffPhotoEl.width()*0.8 );
						} else {
							$cffPhotoEl.find('.cff-img-wrap.cff-crop').css('height', $cffPhotoEl.width()/2 );
						}
					}

					//If the main image is being cropped to zero then remove the crop so the full image is shown
					if( last == true && ( $cffPhotoEl.is('.cff-img-layout-3') || $cffPhotoEl.is('.cff-img-layout-4') ) && $cffPhotoEl.find('.cff-main-image').height() < 10 ) $cffPhotoEl.find('.cff-img-layout-3 .cff-main-image img, .cff-img-layout-4 .cff-main-image img').css({
						'display' : 'block',
						'visibility' : 'visible'
					})

					//Make "+6" text small if the images are small
					if( cffPhotoImgWidth < 200 ){
						$cffPhotoEl.addClass('cff-small-layout');
					} else {
						$cffPhotoEl.removeClass('cff-small-layout');
					}
				});
				
			}
			cffResizeAlbum(false);
			setTimeout(function(){ cffResizeAlbum(false); }, 50);
			setTimeout(function(){ cffResizeAlbum(true); }, 500);
			setTimeout(function(){ cffResizeAlbum(true); }, 1500);


			//PAGINATION
			//Events JS pagination
			var num_events = parseInt( $cff.attr('data-pag-num') ),
				show_events = num_events; //Iterated for each set
			//Show first set of events
			$cff.find('.cff-event').slice(0, num_events).css('display', 'inline-block');
			//cffResizeAlbum(); //Correctly recalcs height of event images when using eventimage=cropped

			//Review JS pagination
			if( $cff.hasClass('cff-all-reviews') ){
				var num_reviews = parseInt( $cff.attr('data-pag-num') ),
					show_reviews = num_reviews;

				//Offset
				var review_offset = parseInt($cff.attr('data-offset'));
				if( typeof review_offset == 'undefined' || isNaN(review_offset) ) review_offset = 0;

				$cff.find('.cff-review').slice(0, num_reviews + review_offset ).css('display', 'inline-block');

				//Hide some reviews if using offset setting
				if( review_offset > 0 ) $cff.find('.cff-review').slice(0, review_offset ).remove();
			}

			//Set a data attr that lets us know whether no posts were loaded into the feed so that we can change the "until" value in the next request
			var $cffLoadMore = $cff.find('#cff-load-more'),
				cff_no_posts_added = $cff.find('.cff-load-more').attr('data-cff-no-posts-added');
			if (typeof cff_no_posts_added == typeof undefined || cff_no_posts_added == false) {
				$cffLoadMore.attr('data-cff-no-posts-added', 'false');
			}

			//If there's no posts in the feed initially then set the data-attr to be true
			if( $cff.find('.cff-item, .cff-album-item').length < 1 ) $cffLoadMore.attr('data-cff-no-posts-added', 'true');

		    // add the load more button and input to simulate a dynamic json file call
		    $cffLoadMore.off().on('click', function() {

			    // read the json that is in the cff-data-shortcode that contains all of the shortcode arguments
		        var shortcodeData = $cff.attr('data-cff-shortcode'),
		            $paginationURL = $cff.find('.cff-pag-url'),
		            pag_url = $paginationURL.attr('data-cff-pag-url');

		    	//Events JS pagination
		    	var events_count = $cff.find('.cff-event').length;
		    	//If it's an event feed
		    	if( events_count > 0 ){
		    		show_events = show_events + num_events;
		    		//Show the next set of events
		    		$cff.find('.cff-event').slice(0, show_events).css('display', 'inline-block');
		    		if( show_events > events_count ){
		    			$cff.find('#cff-load-more').hide();
		    			cff_no_more_posts($cff, $cffLoadMore);
		    		}

		    		//Re-init masonry for JS
		            if( $cff.hasClass('cff-masonry') && !$cff.hasClass('cff-masonry-css') ){
				        cffAddMasonry($cff);
		            }
		    		return;
		    	}

		    	//Reviews JS pagination
		    	if( $cff.hasClass('cff-all-reviews') ){
			    	var reviews_count = $cff.find('.cff-review').length;
			    	//If it's an reviews feed
			    	if( reviews_count > 0 ){
			    		show_reviews = show_reviews + num_reviews;
			    		//Show the next set of reviews
			    		$cff.find('.cff-review').slice(0, show_reviews).css('display', 'inline-block');
			    		if( show_reviews > reviews_count ){
			    			$cff.find('#cff-load-more').hide();
			    			cff_no_more_posts($cff, $cffLoadMore);
			    		}

			    		//Re-init masonry for JS
			            if( $cff.hasClass('cff-masonry') && !$cff.hasClass('cff-masonry-css') ){
					        cffAddMasonry($cff);
			            }
			    		return;
			    	}
			    }


		        //Remove the ID so it can't be clicked twice before the posts are loaded
		        $cffLoadMore.off().removeAttr('id').addClass('cff-disabled');

		        // remove the hidden field since it will be replaced with new before token and after token next url data
		        $paginationURL.remove();

			    	
		        //If it's a photo/vid/album feed then change the selector
			  	if( $cff.hasClass('cff-album-items-feed') ){
			  		var item_sel = '.cff-album-item';
			  	} else {
			  		var item_sel = '.cff-item';
			  	}

			  	if( item_sel == '.cff-album-item' ){
			  		//If the next_url is empty then use the prev_url
			  		if( (pag_url == '' || pag_url == '{}') ) pag_url = $paginationURL.attr('data-cff-prev-url');

				  	//Loop through the previous URLs and if the next URL is empty for an ID then add it in
				  	var prev_urls = $paginationURL.attr('data-cff-prev-url');

				  	//Convert the JSON string into an object so we can loop through it
		        	var prev_urls_arr = ( typeof prev_urls == 'undefined' ) ? '' : JSON.parse( prev_urls );
		      	}

			    //Parse the urls string into an array so we can loop through it
			    var pag_url_arr = ( typeof pag_url == 'undefined' ) ? '' : JSON.parse( pag_url );

			    if( item_sel == '.cff-album-item' ){
			        //Add the URL to the next_urls if it doesn't exist in the array
				  	for (var key in prev_urls_arr) {
						if (prev_urls_arr.hasOwnProperty(key)) {
							if( typeof pag_url_arr[key] == 'undefined' ) pag_url_arr[key] = prev_urls_arr[key];
						}
					}
				}

		        if( (pag_url == '' || pag_url == '{}') && item_sel == '.cff-item' ){
		        	$cffLoadMore.hide();
		        	cff_no_more_posts($cff, $cffLoadMore);
		        } else {
		        	//Display loader
	          		$cffLoadMore.addClass('cff-loading').append('<div class="cff-loader"></div>');
	          		$cffLoadMore.find('.cff-loader').css('background-color', $cffLoadMore.css('color'));
		        }


		        //Check which pagination method to use
		        var cff_timeline_api_paging = false;
		        if( $cff.attr('data-timeline-pag') ) cff_timeline_api_paging = true;

		        if( cff_timeline_api_paging == true ){
		        	//Use the raw "next" URL with the "paging_token" in it, as using the "until" method can cause a problem with groups due to the fact that the recent activity ordering method of groups can cause the last post in a feed to have an older date than those in the next batch, and so some are missed when paginating using the date.
		        } else {
			        //Loop through the pag array. Replace the until params for each id. Stringify to send in the ajax request
					for (var key in pag_url_arr) {
					  	if (pag_url_arr.hasOwnProperty(key)) {

						  	var this_url = pag_url_arr[key],
						  		until_old = cffGetParameterByName('until', this_url),
						  		until_new = (parseInt( $cff.find(item_sel+'.cff-' + key).last().attr('data-cff-timestamp') ) - 1).toString();

						  	//If there's no posts in the feed for a specific author then use the timestamp from the last post in the feed from any author
						  	if( isNaN(parseFloat(until_new)) ){
						  		until_new = (parseInt( $cff.find(item_sel).last().attr('data-cff-timestamp') ) - 1).toString();
						  	}

						  	
						  	var new_url = this_url;

						  	if( $cffLoadMore.attr('data-cff-no-posts-added') == 'true' ){
						  		//If there were no posts added to the feed from the previous response then don't replace the until_old with the until_new in the next request
						  	} else {
						  		//If it's a regular timeline feed then add the "until" param
						  		if( item_sel !== '.cff-album-item' ){

							  		//V2.9+ of the API don't include "until" in the next url so only replace it if it exists
							  		if( this_url.indexOf("until=") !== -1 ){
							  			//Replace old until value with new one in the URL
							  			var new_url = this_url.replace("until="+until_old,"until="+until_new);
							  		} else {
							  			//If "until" doesn't exist then add it to the end of the URL
							  			var new_url = this_url + "&until="+until_new;
							  		}

							  		//Remove the "after" param as it overrides the "until" param
							  		if( new_url.indexOf('&after=') > -1 ) new_url = new_url.replace("&after="+cffGetParameterByName('after', new_url),"");

							  	}

						  	}

						  	//USE OFFSET PAGINATION METHOD
						  	if( cff_grid_pag == 'offset' ){
						  		if( item_sel == '.cff-album-item' ){
						  			//If it's an album item then remove the "after" param as it overrides the "until" param
						  			if( new_url.indexOf('&after=') > -1 ) new_url = new_url.replace("&after="+cffGetParameterByName('after', new_url),"");

						  			//Add the offset param for pagination as time based doesn't work with albums due to the albums not always being in date order, and the other type of paging doesn't work due to filtering/higher post limits
						  			key = key.replace( /(:|\.|\[|\]|,|=)/g, "\\$1" );
						  			var albumItemCount = $cff.find('.cff-album-item.cff-' + key).length + $cff.find('.cff-empty-album.cff-' + key).length;
						  			if( new_url.indexOf('&offset=') > -1 ){
						  				new_url = new_url.replace("&offset="+cffGetParameterByName('offset', new_url), "&offset="+albumItemCount);
						  			} else {
						  				new_url = new_url + "&offset=" + albumItemCount;
						  			}
						  			key = key.replace(/\\/g, '');
						  		}
						  	}
							//END USE OFFSET PAGINATION METHOD


						  	//If it's an events only URL then remove the "after" param as we're using the "until" value instead
						  	if( (this_url.indexOf('/events') > -1 && this_url.indexOf('&after=') > -1) || (this_url.indexOf('/ratings') > -1 && this_url.indexOf('&after=') > -1 && $cff.hasClass('cff-all-reviews') ) ){
						  		new_url = new_url.replace("&after="+cffGetParameterByName('after', new_url),"");
						  	}

						  	//Remove the "__paging_token" parameter from the URL as it causes some posts to be missing and it isn't needed as we're using "until"
						  	if( new_url.indexOf('&__paging_token') > -1 ){
						  		new_url = new_url.replace("&__paging_token="+cffGetParameterByName('__paging_token', new_url),"");
						  	}

						  	pag_url_arr[key] = new_url;
					  	}
					} // End pag_url_arr loop
				} // End cff_timeline_api_paging if/else

				//Convert the array back into a string
				pag_url = JSON.stringify( pag_url_arr );

		        jQuery.ajax({
		            url : cffajaxurl,
		            type : 'post',
		            data : {
		                action : 'cff_get_new_posts',
		                shortcode_data : shortcodeData,
		                pag_url : pag_url
		            },
		            success : function(data) {

	            		//If there's no posts added to the feed then set a data attr on the button so that we can change the "until" value to get a new batch next time
	            		//Check by seeing if the data contains a div (ie. post)
	            		if( data.indexOf('<div class=') == -1 && data.indexOf('<span class=') == -1 ){
	            			$cffLoadMore.attr('data-cff-no-posts-added', 'true');
	            		} else {
	            			$cffLoadMore.attr('data-cff-no-posts-added', 'false');
	            		}

		                //Appends the html echoed out in cff_get_new_posts() to the last existing post element
		                if( $cff.find('.cff-item, .cff-album-item').length ){
		                	$cff.find('.cff-item, .cff-album-item').removeClass('cff-new').last().after(data);
		                } else {
		                	//If there's no posts yet then just add it into the posts container
		                	$cff.find('.cff-posts-wrap').append(data);
		                }

		                //Replace any duplicate album items with empty items so doesn't affect offset pagination 
		                $cff.find('.cff-album-item').each(function (i) {
							var $el = $('[id="' + this.id + '"]').eq(1);
							if($el.length){
								this_classes = $el.attr('class');
								this_classes = this_classes.replace("cff-album-item","");
							}
						});

		                //Remove loader
	                  	$cffLoadMore.removeClass('cff-loading').find('.cff-loader').remove();
	                  	//Re-add the ID so it can be clicked again
	                  	$cffLoadMore.attr('id', 'cff-load-more').removeClass('cff-disabled');

		                //Rerun JS (only runs on new items - .cff-new)
		                cff_init( $cff );

		                //Re-init masonry
		                if( $cff.hasClass('cff-masonry') && !$cff.hasClass('cff-masonry-css') ){

				            $cff.masonry('appended', $cff.find('.cff-new'));

				            $cff.find('.cff-view-comments, .cff-comment-replies a, .cff-show-more-comments a').off().on('click', function() {
					            setTimeout(function(){
					            	cffAddMasonry($cff);
					            }, 500);
						    });
		                }

		                //If there's no more API URLs to hit then hide the load more button
		                var next_urls = $cff.find('.cff-pag-url').attr('data-cff-pag-url');
		                if( item_sel == '.cff-item' || cff_grid_pag == 'cursor' ){
		                	if( next_urls == '{}' ) cff_no_more_posts($cff, $cffLoadMore);
		                } else {
		                	if( data.indexOf('class="cff-album-item') < 0 && data.indexOf('class="cff-empty-album') < 0 ){
		                		cff_no_more_posts($cff, $cffLoadMore);
		                	}
		                }

		                // Call Custom JS if it exists
						// if (typeof cff_custom_js == 'function') setTimeout(function(){ cff_custom_js(jQuery); }, 100);
						if (typeof cff_custom_js == 'function') cff_custom_js(jQuery);

		            } // End success
		        }); // End Ajax call

		    }).hover( //Hover on Load More button
				function() {
			    	$(this).css('background', $(this).attr('data-cff-hover') );
			  	}, function() {
			    	$(this).css('background', $(this).attr('data-cff-bg') );
			  	}
			);

			function cff_no_more_posts($cff, $cffLoadMore){
				var no_more_posts_text = ( $cffLoadMore.attr('data-no-more') == '' ) ? 'No more posts' : $cffLoadMore.attr('data-no-more').replace(/\\'/g,"'");
        		if( $cff.find('.cff-no-more-posts').length < 1 ) $cffLoadMore.hide().after('<p class="cff-no-more-posts">'+no_more_posts_text+'</p>');
        		$cff.find('.cff-error-msg').remove();
			}

		    //Add container to the masonry posts so that the load more button can be displayed at the bottom outside of the CSS cols
		    if( $(this).find('.cff-masonry-posts').length < 1 ) $(this).find('#cff.cff-masonry .cff-item, #cff.cff-masonry .cff-likebox, #cff.cff-masonry .cff-event, #cff.cff-masonry .cff-album-item').wrapAll('<div class="cff-masonry-posts" />');

		    //Remove the masonry css class if it's a grid feed
		    if( $cff.find('.cff-album-item').length ){
            	$cff.removeClass('cff-masonry cff-masonry-css');
        	}


	        //Multiple event dates toggle
			$cff.find('.cff-more-dates').on('click', function(){
				$(this).siblings('.cff-multiple-dates').slideToggle(100);
			});


		}); // End .$('.cff-wrapper').each


		//GET/CACHE COMMENTS
		//Check if the meta transient exists (set in head JS vars) and that a timeline feed exists on the page
		if(cffmetatrans != 'false' && $('.cff-timeline-feed').length && (typeof cffdisablecommentcaching == 'undefined') ){

			//If the comments data is cached then get it from the transient in the DB
			$.ajax({
			    url: cffajaxurl,
			    type: 'POST',
		        async: true,
		        cache: false,
		        data:{
		            action: 'get_meta'
		        },
			    success: function(data) {

			      	//If there's no data then set the array to be empty so that it hits the API for the data
			      	if( data == '' || data.length < 1 ){
			      		metaArr = [];
			      	} else {
			      		//Decode the JSON to that it can be used again
			            data = decodeURI(data);

			            //Replace any escaped single quotes as it results in invalid JSON
			            data = data.replace(/\\'/g, "'");

			            //Convert the cached JSON string back to a JSON object
			            metaArr = JSON.parse( data );
			      	}

			      	// $cff.find('.cff-item.cff-new').each(function(){
			      	$cff.each(function(){
			      		$(this).find('.cff-item.cff-new:not(.cff-event)').each(function(){
				      		var $self = $(this),
				      			post_id_orig = $self.find('.cff-view-comments').attr('id'),
				      			object_id = $self.closest('.cff-item').attr('data-object-id');

				      		//If the post ID doesn't exist in the array then use the API to get the data
				      		if( metaArr.hasOwnProperty(post_id_orig) ){
				      			cffCreateComments($self, metaArr[post_id_orig]);
				      			cffAddFullsizeImageURLs($self, metaArr[post_id_orig]);
				      		} else {
				      			cffGetMetaAPI($self, post_id_orig, object_id);
				      		}		
						});
			      	});
							
				},
				error: function(xhr,textStatus,e) {
		            return; 
		        }

			}); //End ajax

		} else {

			$('#cff .cff-item.cff-new:not(.cff-event)').each(function(){
		  		var $self = $(this),
		  			post_id_orig = $self.find('.cff-view-comments').attr('id'),
		  			object_id = $self.closest('.cff-item').attr('data-object-id');

		  		cffGetMetaAPI($self, post_id_orig, object_id);
			});			

		} //END GET/CACHE COMMENTS


		function cffGetMetaAPI($self, post_id_orig, object_id){

			//If there's no comments box on the page then return so we don't hit the API to get the data
			if( $self.find('.cff-view-comments').length == 0 ) return;
			
			if( typeof object_id == 'undefined' || object_id.length < 2 ) object_id = '';

			var object_id_query = ''+object_id,
				post_id_query = '?post_id='+post_id_orig,
				use_id = 'object',
				post_comment_count = $self.find('.cff-comments .cff-count').text(),
				post_likes_count = $self.find('.cff-likes .cff-count').text(),
				cff_page_id = $self.attr('data-page-id');

			if( typeof post_comment_count == 'undefined' || post_comment_count == '' ) post_comment_count = 0;
			if( typeof post_likes_count == 'undefined' || post_likes_count == '' ) post_likes_count = 0;

			//If it's a video post or there's no object ID then use the post ID (video posts don't have "images" field)
			// if( typeof object_id == 'undefined' || object_id.length < 2 || $self.hasClass('cff-video-post') ) use_id = 'post';
			if( typeof object_id == 'undefined' || object_id.length < 2 || $self.find('.cff-comments-box').hasClass('cff-shared-story') || $self.hasClass('cff-timeline-event') ) use_id = 'post';

			var timeline_event = '';
			if( $self.hasClass('cff-timeline-event') ) timeline_event = '&timeline_event=true';

			var usegrouptoken = '',
				useowntoken = '';
			if( $self.closest('#cff').hasClass('cff-group') ) usegrouptoken = '&usegrouptoken=true';
			if( $self.closest('#cff').attr('data-own-token') == 'true' ) useowntoken = '&useowntoken=true';

			shortcode_token_param = cffGetShortcodeToken( $self.closest('#cff') );

			//Is it a video post? If so, then we may be able to use the object ID to get the embeddable video object
			var cff_is_video_post = $self.hasClass('cff-video-post') ? '&isvideo=true' : '';

			var url = cffsiteurl + "/custom-facebook-feed-pro/query.php?o_id=" + object_id + '&post_id='+post_id_orig + '&use_id=' + use_id + timeline_event + usegrouptoken + useowntoken + '&comments_num=' + post_comment_count + '&likes_num=' + post_likes_count + '&type=meta' + cff_is_video_post + '&pageid=' + cff_page_id + shortcode_token_param;

			if( $self.hasClass('cff-album') ) url += '&timelinealbum=true';

			//Get comments, reactions, and full size images data from the API
			if( locatefile == true ){
				$.ajax({
		      		method: "GET",
		     		url: url,
		      		success: function(data) {

		      			//Cache the comments by adding to the cache array
						metaArr[ post_id_orig ] = data;
						newMetaArr[ post_id_orig ] = data; //This is cached. Only the new comments.

						//Add the comments HTML
						cffCreateComments($self, data);

						//Replace images URLs with full size ones
						cffAddFullsizeImageURLs($self, data);

						//Set the cache
						cffSetMetaCache(newMetaArr);
		      	
					}//End ajax success

				});
			}

  		} //End cffGetMetaAPI()

  		//Only allow this function to run once every time new posts are loaded so that a load of ajax requests aren't all fired off at once. It's called once and then runs 3 times in total to cache all comments on the page into the cff_meta transient.
		var cffSetMetaCache_executed = false;
		function cffSetMetaCache(newMetaArr){

			if( typeof cffdisablecommentcaching != 'undefined' ) return;

			if( !cffSetMetaCache_executed ){

				//Cache the comments data
				var cffTimesCached = 0,
				cffCacheDelay = setTimeout(function() {
					//Try to cache it multiple times so that if the comments data isn't finished returning the first time then the subsequent attempts gets it
					var cffCacheInterval = setInterval(function(){
						
						cffCacheMeta(newMetaArr);

						cffTimesCached++;
						if(cffTimesCached == 2) clearInterval(cffCacheInterval);
					}, 3000);

					//Send the data to DB initially via ajax after a 0.5 second delay
					cffCacheMeta(newMetaArr);
				}, 500);

				cffSetMetaCache_executed = true;

			} // End cffRunFunction check


			//Cache the likes and comments counts by sending an array via ajax to the main plugin file which then stores it in a transient
			function cffCacheMeta(newMetaArr){

				//Convert the JSON object to a string
		        var jsonstring = JSON.stringify( newMetaArr );

		        //Encode the JSON string so that it can be stored in the database
		        jsonstring = encodeURI(jsonstring);

				//Cache the data
				var opts = {
			        url: cffajaxurl,
			        type: 'POST',
			        async: true,
			        cache: false,
			        data:{
			            action: 'cache_meta',
			            metadata: jsonstring // Passes array of meta data to WP to cache
			        },
			        success: function(response) {
			            return; 
			        },
			        error: function(xhr,textStatus,e) {
			            return; 
			        }
			    };
			    $.ajax(opts);
			    
			} // End cffCacheMeta()

		} // End cffSetMetaCache()


		function cffGetParameterByName(name, url) {
		    name = name.replace(/[\[\]]/g, "\\$&");
		    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		        results = regex.exec(url);
		    if (!results) return null;
		    if (!results[2]) return '';
		    return decodeURIComponent(results[2].replace(/\+/g, " "));
		}

		function cffLinkify(inputText) {
		    var replacedText, replacePattern1, replacePattern2, replacePattern3;

		    //URLs starting with http://, https://, or ftp://
		    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
		    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

		    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
		    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
		    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

		    //Change email addresses to mailto:: links.
		    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
		    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

		    return replacedText;
		}


		//HTML5 Video play button
		$(document).off('click', '#cff .cff-html5-video .cff-html5-play').on('click', '#cff .cff-html5-video .cff-html5-play', function(e){
			e.preventDefault();

			var $self = $(this),
				$videoWrapper = $self.closest('.cff-html5-video'),
				video = $self.siblings('video')[0];
			video.play();
			$self.hide();
			$self.siblings('.cff-poster').hide();

			//Show controls when the play button is clicked
			if (video.hasAttribute("controls")) {
			    video.removeAttribute("controls")   
			} else {
			    video.setAttribute("controls","controls")   
			}

			if($videoWrapper.innerWidth() < 150 && !$videoWrapper.hasClass('cff-no-video-expand')) {
				$videoWrapper.css('width','100%').closest('.cff-item').find('.cff-text-wrapper').css('width','100%');
			}
		});


		//Replace the lightbox image with the full size image which is retrieved in the meta API request
		function cffAddFullsizeImageURLs($self, data){
			var data = jQuery.parseJSON( data );

			if( typeof data.images !== 'undefined' && data.images !== null ) $self.find('.cff-lightbox-link').attr('href', data.images[0].source);
			
			//Add the full size video image which is retrieved from query.php to fix the Facebook video image size API bug
			if( $self.find('.cff-html5-video').length && typeof data.attachments !== 'undefined' && data.attachments !== null ){
				$self.find('.cff-poster').attr('src', data.attachments.data[0].media.image.src);
				$self.find('.cff-lightbox-link').attr('href', data.attachments.data[0].media.image.src);
			}
		}


		//Create comments
		function cffCreateComments($self, data){

			if (data.substring(0, 1) == "<") return false;

			//Convert string of data received from comments.php to a JSON object
      		var data = jQuery.parseJSON( data ),
      			cff_comments = '',
      			cff_likes_this = '',
      			commentShow = parseInt( $self.find('.cff-comments-box').attr('data-num') ),
      			like_count = ( typeof data.likes !== 'undefined' ) ? data.likes.summary.total_count : 0
      			$cffCommentsBox = $self.find('.cff-comments-box'),
      			$cffCommentLikes = $cffCommentsBox.find('.cff-comment-likes'),
      			cff_hide_comment_avatars = Boolean($self.find('.cff-comments-box').attr('data-cff-hide-avatars')),
      			cff_expand_comments = Boolean($self.find('.cff-comments-box').attr('data-cff-expand-comments')),
      			cff_translate_like_this_text = $cffCommentsBox.attr('data-cff-like-text'),
      			cff_translate_likes_this_text = $cffCommentsBox.attr('data-cff-likes-text'),
      			cff_translate_reacted_to_this_text = $cffCommentsBox.attr('data-cff-reacted-text'),
      			cff_translate_and_text = $cffCommentsBox.attr('data-cff-and-text'),
      			cff_translate_other_text = $cffCommentsBox.attr('data-cff-other-text'),
      			cff_translate_others_text = $cffCommentsBox.attr('data-cff-others-text'),
      			cff_translate_reply_text = $cffCommentsBox.attr('data-cff-reply-text'),
      			cff_translate_replies_text = $cffCommentsBox.attr('data-cff-replies-text'),
      			cff_total_comments_count = ( typeof data.comments !== 'undefined' ) ? data.comments.summary.total_count : 0,
	      		cff_meta_link_color = $self.find('.cff-comments-box').attr('data-cff-meta-link-color'),
				cff_post_tags = Boolean( $self.find('.cff-comments-box').attr('data-cff-post-tags') );

      		//ADD REACTIONS
			var cff_haha_count = ( typeof data.haha !== 'undefined' ) ? data.haha.summary.total_count : 0;
			var cff_love_count = ( typeof data.love !== 'undefined' ) ? data.love.summary.total_count : 0;
			var cff_wow_count = ( typeof data.wow !== 'undefined' ) ? data.wow.summary.total_count : 0;
			var cff_sad_count = ( typeof data.sad !== 'undefined' ) ? data.sad.summary.total_count : 0;
			var cff_angry_count = ( typeof data.angry !== 'undefined' ) ? data.angry.summary.total_count : 0;

			var reactions_arr = [cff_haha_count, cff_love_count, cff_wow_count, cff_sad_count, cff_angry_count];
			var reaction_first_num = reactions_arr.sort(sortNumber)[0];
			var reaction_second_num = reactions_arr.sort(sortNumber)[1];

			//Sort array highest to lowest
			function sortNumber(a,b) {
			    return b - a;
			}

			var reactions_html = '',
				love_added = false,
				haha_added = false,
				wow_added = false,
				sad_added = false,
				angry_added = false;

			//Add first reaction
			var reaction_one_html = '';
			if( reaction_first_num > 0 ){
				if(data.love.summary.total_count == reaction_first_num){
					reaction_one_html += '<span class="cff-love cff-reaction-one"></span>';
					love_added = true;
				}
				if(data.haha.summary.total_count == reaction_first_num){
					reaction_one_html += '<span class="cff-haha cff-reaction-one"></span>';
					haha_added = true;
				}
				if(data.wow.summary.total_count == reaction_first_num){
					reaction_one_html += '<span class="cff-wow cff-reaction-one"></span>';
					wow_added = true;
				}
				if(data.sad.summary.total_count == reaction_first_num){
					reaction_one_html += '<span class="cff-sad cff-reaction-one"></span>';
					sad_added = true;
				}
				if(data.angry.summary.total_count == reaction_first_num){
					reaction_one_html += '<span class="cff-angry cff-reaction-one"></span>';
					angry_added = true;
				}
				reactions_html += reaction_one_html;
			}

			//If reaction one doesn't already contain two reactions (eg: if the two reaction_ones are the same number) then don't include a reaction_two
			if( reaction_one_html.split('cff-reaction-one').length < 3 ){
				//Add second reaction
				if( reaction_second_num > 0 ){
					var reaction_two_html = '';

					if(data.love.summary.total_count == reaction_second_num && !love_added){
						reaction_two_html = '<span class="cff-love cff-reaction-two"></span>';
					}
					if(data.haha.summary.total_count == reaction_second_num && !haha_added){
						reaction_two_html = '<span class="cff-haha cff-reaction-two"></span>';
					}
					if(data.wow.summary.total_count == reaction_second_num && !wow_added){
						reaction_two_html = '<span class="cff-wow cff-reaction-two"></span>';
					}
					if(data.sad.summary.total_count == reaction_second_num && !sad_added){
						reaction_two_html = '<span class="cff-sad cff-reaction-two"></span>';
					}
					if(data.angry.summary.total_count == reaction_second_num && !angry_added){
						reaction_two_html = '<span class="cff-angry cff-reaction-two"></span>';
					}
					reactions_html += reaction_two_html;
				}
			}

			$self.find('.cff-meta .cff-likes .cff-icon').after( reactions_html );

			//If there's no likes but there's a reacton then don't show the like icon - show the reaction icon instead
			if( parseInt(like_count) == 0 && ( parseInt(cff_love_count) > 0 || parseInt(cff_haha_count) > 0 || parseInt(cff_wow_count) > 0 || parseInt(cff_sad_count) > 0 || parseInt(cff_angry_count) > 0 ) ){
				$self.find('.cff-meta .cff-likes .cff-icon').remove();
				$self.find('.cff-meta .cff-likes span').addClass('cff-no-animate');
			}

			//Add reactions to like count
			var cff_reactions_count = parseInt(like_count) + parseInt(cff_love_count) + parseInt(cff_haha_count) + parseInt(cff_wow_count) + parseInt(cff_sad_count) + parseInt(cff_angry_count);
			if( cff_reactions_count > 0 ) $self.find('.cff-meta .cff-likes .cff-count').text( cff_reactions_count );


			//ADDS REACTIONS TO COMMENTS BOX
			var cff_no_reactions = false;
			if( cff_love_count == 0 && cff_haha_count == 0 && cff_wow_count == 0 && cff_sad_count == 0 && cff_angry_count == 0 ) cff_no_reactions = true;

			var reactions_count_html = '<span class="cff-reactions-count">';

			if( parseInt(like_count) > 0){
				reactions_count_html += '<span class="cff-like"></span>';

				if( !cff_no_reactions ){
					if( parseInt(like_count) > 0 ) reactions_count_html += '<span class="cff-like-count">'+like_count+'</span>';
					if( cff_love_count > 0 ) reactions_count_html += '<span class="cff-love"></span><span class="cff-love-count">'+cff_love_count+'</span>';
					if( cff_haha_count > 0 ) reactions_count_html += '<span class="cff-haha"></span><span class="cff-haha-count">'+cff_haha_count+'</span>';
					if( cff_wow_count > 0 ) reactions_count_html += '<span class="cff-wow"></span><span class="cff-wow-count">'+cff_wow_count+'</span>';
					if( cff_sad_count > 0 ) reactions_count_html += '<span class="cff-sad"></span><span class="cff-sad-count">'+cff_sad_count+'</span>';
					if( cff_angry_count > 0 ) reactions_count_html += '<span class="cff-angry"></span><span class="cff-angry-count">'+cff_angry_count+'</span>';
				}
			}
			reactions_count_html += '</span>';

  			//CREATE LIKES PART AT TOP OF COMMENTS BOX
      		if( typeof data.likes !== 'undefined' ){
	      		if( data.likes.data.length ){

	      			cff_likes_this += '<span class="cff-likes-this-text">';

		      		var liker_one = '',
		      			liker_two = '';
			      	if ( like_count > 0 && typeof data.likes.data[0] !== 'undefined' ) liker_one = '<a href="https://facebook.com/'+data.likes.data[0].id+'" style="color:'+cff_meta_link_color+';';
			      	if (cff_no_reactions) liker_one += ' margin-left: 5px';
			      	liker_one += '" target="_blank">'+data.likes.data[0].name+'</a>';

		            if ( like_count > 1 && typeof data.likes.data[1] !== 'undefined' ) liker_two = '<a href="https://facebook.com/'+data.likes.data[1].id+'" style="color:'+cff_meta_link_color+'" target="_blank">'+data.likes.data[1].name+'</a>';

		            if (like_count == 1){
		                cff_likes_this += liker_one+' '+cff_translate_likes_this_text;
		            } else if (like_count == 2){
		                cff_likes_this += liker_one+' '+cff_translate_and_text+' '+liker_two+' '+cff_translate_like_this_text;
		            } else if (like_count == 3){
		                cff_likes_this += liker_one+', '+liker_two+' '+cff_translate_and_text+' 1 '+cff_translate_other_text+' '+cff_translate_like_this_text;
		            } else {
		                cff_likes_this += liker_one+', '+liker_two+' '+cff_translate_and_text+' ';
		                if (like_count == 25) cff_likes_this += '<span class="cff-comment-likes-count">';
		                cff_likes_this += parseInt(cff_reactions_count)-2;
		                if (like_count == 25) cff_likes_this += '</span>';
		                cff_likes_this += ' '+cff_translate_others_text;

		                if( parseInt(cff_reactions_count) == parseInt(like_count) ){
		                	cff_likes_this += ' '+cff_translate_like_this_text;
		                } else {
		                	cff_likes_this += ' '+cff_translate_reacted_to_this_text;
		                }

		            }

		            cff_likes_this += '</span>';

	            	$cffCommentLikes.append(reactions_count_html + cff_likes_this);

				} else {
					//If there's no likes data then hide the top of the comments box that shows the "likes this" section
					if( cff_no_reactions ){
						$cffCommentLikes.hide();
					} else {
						$cffCommentLikes.append(reactions_count_html);
					}
				}

			}
			

			if( typeof data.comments !== 'undefined' ){
	    		$.each(data.comments.data, function(i, commentItem) {

	    			//Do a final encode of the comment message
	    			var comment_message = cffEncodeHTML(commentItem.message),
	    				comment_message = cffLinkify(comment_message),
	    				cff_comment_author_info = true;

	    			//Check whether comment author info exists - only accessible with page access token from the page now
	    			if( typeof commentItem.from !== 'undefined' ){
	    				cff_comment_from_id = commentItem.from.id;
	    			} else {
	    				cff_hide_comment_avatars = true;
	    				cff_comment_author_info = false;
	    				cff_comment_from_id = '';
	    			}

	    			cff_comments += '<div class="cff-comment" id="cff_'+commentItem.id+'" data-id="'+cff_comment_from_id+'"';
	    			cff_comments += ' style="';
	    			( i >= commentShow ) ? cff_comments += 'display: none;' : cff_comments += 'display: block;';
	    			cff_comments += $self.find('#cff_'+commentItem.id).attr('style');
	    			cff_comments += '">';
		          	cff_comments += '<div class="cff-comment-text-wrapper">';
		          	cff_comments += '<div class="cff-comment-text';
		          	if( cff_hide_comment_avatars ) cff_comments += ' cff-no-image';
		          	cff_comments += '"><p>';
		          	if( cff_comment_author_info ) cff_comments += '<a href="https://facebook.com/'+commentItem.from.id+'" class="cff-name" target="_blank" style="color:' + cff_meta_link_color + '">'+commentItem.from.name+'</a>';

					//MESSAGE TAGS
					if( cff_post_tags && commentItem.hasOwnProperty('message_tags') ){

						//Loop through the tags and use the name to replace them
						$.each(commentItem.message_tags, function(i, message_tag) {
						   tag_name = message_tag.name;
						   tag_link = '<a href="http://facebook.com/'+message_tag.id+'" target="_blank" style="color:'+cff_meta_link_color+'">'+message_tag.name+'</a>';

						   comment_message = comment_message.replace(tag_name, tag_link);
						});

					} //END MESSAGE TAGS

	          		cff_comments += comment_message+'</p>';


					//Add image attachment if exists
					if( commentItem.hasOwnProperty('attachment') ){
					  if( commentItem.attachment.hasOwnProperty('media') ){
					    	cff_comments += '<a class="cff-comment-attachment" href="https://facebook.com/'+commentItem.id+'" target="_blank"><img src="'+commentItem.attachment.media.image.src+'" alt="';
					    	if( commentItem.attachment.hasOwnProperty('title') ){
					        	cff_comments += commentItem.attachment.title;
					    	} else {
					    		cff_comments += 'Attachment';
					      	}
					      	cff_comments += '" /></a>';
					  	}
					}

					cff_comments += '<span class="cff-time">';
					var cff_middot = '',
						cff_comment_time = $self.find('#cff_'+commentItem.id).attr('data-cff-comment-date');
					//If the time is undefined then don't show it
					if( typeof cff_comment_time !== 'undefined' ){
						cff_comments += cff_comment_time;
						cff_middot = '&nbsp; &middot; &nbsp;';
					}
					if ( commentItem.like_count > 0 ) cff_comments += '<span class="cff-comment-likes">'+cff_middot+'<b></b>'+commentItem.like_count+'</span>';
					cff_comments += '</span>';

					//Comment replies
					var cff_comment_count = parseInt(commentItem.comment_count);
					if( cff_comment_count > 0 ){
						//Get this from a data attr on the comments box container
						var cff_replies_text_string = '';
						(cff_comment_count == 1) ? cff_replies_text_string = cff_translate_reply_text : cff_replies_text_string = cff_translate_replies_text;
						cff_comments += '<p class="cff-comment-replies" data-id="'+commentItem.id+'"><a class="cff-comment-replies-a" href="javascript:void(0);" style="color:' + cff_meta_link_color + '"><span class="cff-replies-icon"></span>'+cff_comment_count+' '+cff_replies_text_string+'</a></p><div class="cff-comment-replies-box cff-empty"></div>';
					}

					cff_comments += '</div>'; //End .cff-comment-text
					cff_comments += '</div>'; //End .cff-comment-text-wrapper

					//Only load the comment avatars if they're being displayed initially, otherwise load via JS on click to save all the HTTP requests on page load
					if( !cff_hide_comment_avatars && cff_comment_author_info ){
							cff_comments += '<div class="cff-comment-img cff-avatar-fallback"><a href="https://facebook.com/'+commentItem.from.id+'" target="_blank">';
					  	if( cff_expand_comments && (i < commentShow) ) {
					    	cff_comments += '<img src="https://graph.facebook.com/'+commentItem.from.id+'/picture" width=32 height=32 alt="'+commentItem.from.name+'">';
					  	} else {
					    	cff_comments += '<span class="cff-comment-avatar"></span>';
					  	}
					  	cff_comments += '</a></div>';
					}

					cff_comments += '</div>'; //End .cff-comment

				}); //End data.comments.data loop

			} //End if

			//Add the comments to the page
			$self.find('.cff-comments-wrap').html( cff_comments );
			$self.find('.cff-show-more-comments').attr('data-cff-comments-total', cff_total_comments_count);

			setTimeout(function(){
        		if( $self.closest('.cff').hasClass('cff-masonry') && !$self.closest('.cff').hasClass('cff-masonry-css') ) cffAddMasonry( $self.closest('.cff') );
      		}, 200);

		} //End cffCreateComments()

	})(jQuery); //End (function($){ 




	/*!
	imgLiquid v0.9.944 / 03-05-2013
	https://github.com/karacas/imgLiquid
	*/

	var imgLiquid = imgLiquid || {VER: '0.9.944'};
	imgLiquid.bgs_Available = false;
	imgLiquid.bgs_CheckRunned = false;
	//Add the CSS using CSS as then it's only used when the JS file runs, otherwise with Ajax themes it's hiding the images but then the JS isn't running. This way still allows the images to display even if the JS doesn't run.
	jQuery('.cff-new .cff-album-cover img, .cff-new .cff-crop img').css('visibility', 'hidden');
	jQuery('#cff .cff-img-attachments .cff-crop img').css('opacity', 0);


	(function ($) {

		// ___________________________________________________________________

		function checkBgsIsavailable() {
			if (imgLiquid.bgs_CheckRunned) return;
			else imgLiquid.bgs_CheckRunned = true;

			var spanBgs = $('<span style="background-size:cover" />');
			$('body').append(spanBgs);

			!function () {
				var bgs_Check = spanBgs[0];
				if (!bgs_Check || !window.getComputedStyle) return;
				var compStyle = window.getComputedStyle(bgs_Check, null);
				if (!compStyle || !compStyle.backgroundSize) return;
				imgLiquid.bgs_Available = (compStyle.backgroundSize === 'cover');
			}();

			spanBgs.remove();
		}


		// ___________________________________________________________________

		$.fn.extend({
			imgLiquid: function (options) {

				this.defaults = {
					fill: true,
					verticalAlign: 'center',			//	'top'	//	'bottom' // '50%'  // '10%'
					horizontalAlign: 'center',			//	'left'	//	'right'  // '50%'  // '10%'
					useBackgroundSize: true,
					useDataHtmlAttr: true,

					responsive: true,					/* Only for use with BackgroundSize false (or old browsers) */
					delay: 0,							/* Only for use with BackgroundSize false (or old browsers) */
					fadeInTime: 0,						/* Only for use with BackgroundSize false (or old browsers) */
					removeBoxBackground: true,			/* Only for use with BackgroundSize false (or old browsers) */
					hardPixels: true,					/* Only for use with BackgroundSize false (or old browsers) */
					responsiveCheckTime: 500,			/* Only for use with BackgroundSize false (or old browsers) */ /* time to check div resize */
					timecheckvisibility: 500,			/* Only for use with BackgroundSize false (or old browsers) */ /* time to recheck if visible/loaded */

					// CALLBACKS
					onStart: null,						// no-params
					onFinish: null,						// no-params
					onItemStart: null,					// params: (index, container, img )
					onItemFinish: null,					// params: (index, container, img )
					onItemError: null					// params: (index, container, img )
				};


				checkBgsIsavailable();
				var imgLiquidRoot = this;

				// Extend global settings
				this.options = options;
				this.settings = $.extend({}, this.defaults, this.options);

				// CallBack
				if (this.settings.onStart) this.settings.onStart();


				// ___________________________________________________________________

				return this.each(function ($i) {

					// MAIN >> each for image

					var settings = imgLiquidRoot.settings,
					$imgBoxCont = $(this),
					$img = $('img:first',$imgBoxCont);
					if (!$img.length) {onError(); return;}


					// Extend settings
					if (!$img.data('imgLiquid_settings')) {
						// First time
						settings = $.extend({}, imgLiquidRoot.settings, getSettingsOverwrite());
					} else {
						// Recall
						// Remove Classes
						$imgBoxCont.removeClass('imgLiquid_error').removeClass('imgLiquid_ready');
						settings = $.extend({}, $img.data('imgLiquid_settings'), imgLiquidRoot.options);
					}
					$img.data('imgLiquid_settings', settings);


					// Start CallBack
					if (settings.onItemStart) settings.onItemStart($i, $imgBoxCont, $img); /* << CallBack */


					// Process
					if (imgLiquid.bgs_Available && settings.useBackgroundSize)
						processBgSize();
					else
						processOldMethod();


					// END MAIN <<

					// ___________________________________________________________________

					function processBgSize() {

						// Check change img src
						if ($imgBoxCont.css('background-image').indexOf(encodeURI($img.attr('src'))) === -1) {
							// Change
							$imgBoxCont.css({'background-image': 'url("' + encodeURI($img.attr('src')) + '")'});
						}

						$imgBoxCont.css({
							'background-size':		(settings.fill) ? 'cover' : 'contain',
							'background-position':	(settings.horizontalAlign + ' ' + settings.verticalAlign).toLowerCase(),
							'background-repeat':	'no-repeat'
						});

						$('a:first', $imgBoxCont).css({
							'display':	'block',
							'width':	'100%',
							'height':	'100%'
						});

						$('img', $imgBoxCont).css({'display': 'none'});

						if (settings.onItemFinish) settings.onItemFinish($i, $imgBoxCont, $img); /* << CallBack */

						$imgBoxCont.addClass('imgLiquid_bgSize');
						$imgBoxCont.addClass('imgLiquid_ready');
						checkFinish();
					}

					// ___________________________________________________________________

					function processOldMethod() {

						// Check change img src
						if ($img.data('oldSrc') && $img.data('oldSrc') !== $img.attr('src')) {

							/* Clone & Reset img */
							var $imgCopy = $img.clone().removeAttr('style');
							$imgCopy.data('imgLiquid_settings', $img.data('imgLiquid_settings'));
							$img.parent().prepend($imgCopy);
							$img.remove();
							$img = $imgCopy;
							$img[0].width = 0;

							// Bug ie with > if (!$img[0].complete && $img[0].width) onError();
							setTimeout(processOldMethod, 10);
							return;
						}


						// Reproceess?
						if ($img.data('imgLiquid_oldProcessed')) {
							makeOldProcess(); return;
						}


						// Set data
						$img.data('imgLiquid_oldProcessed', false);
						$img.data('oldSrc', $img.attr('src'));


						// Hide others images
						$('img:not(:first)', $imgBoxCont).css('display', 'none');


						// CSSs
						$imgBoxCont.css({'overflow': 'hidden'});
						$img.fadeTo(0, 0).removeAttr('width').removeAttr('height').css({
							'visibility': 'visible',
							'max-width': 'none',
							'max-height': 'none',
							'width': 'auto',
							'height': 'auto',
							'display': 'block'
						});


						// CheckErrors
						$img.on('error', onError);
						$img[0].onerror = onError;


						// loop until load
						function onLoad() {
							if ($img.data('imgLiquid_error') || $img.data('imgLiquid_loaded') || $img.data('imgLiquid_oldProcessed')) return;
							if ($imgBoxCont.is(':visible') && $img[0].complete && $img[0].width > 0 && $img[0].height > 0) {
								$img.data('imgLiquid_loaded', true);
								setTimeout(makeOldProcess, $i * settings.delay);
							} else {
								setTimeout(onLoad, settings.timecheckvisibility);
							}
						}


						onLoad();
						checkResponsive();
					}

					// ___________________________________________________________________

					function checkResponsive() {

						/* Only for oldProcessed method (background-size dont need) */

						if (!settings.responsive && !$img.data('imgLiquid_oldProcessed')) return;
						if (!$img.data('imgLiquid_settings')) return;

						settings = $img.data('imgLiquid_settings');

						$imgBoxCont.actualSize = $imgBoxCont.get(0).offsetWidth + ($imgBoxCont.get(0).offsetHeight / 10000);
						if ($imgBoxCont.sizeOld && $imgBoxCont.actualSize !== $imgBoxCont.sizeOld) makeOldProcess();

						$imgBoxCont.sizeOld = $imgBoxCont.actualSize;
						setTimeout(checkResponsive, settings.responsiveCheckTime);
					}

					// ___________________________________________________________________

					function onError() {
						$img.data('imgLiquid_error', true);
						$imgBoxCont.addClass('imgLiquid_error');
						if (settings.onItemError) settings.onItemError($i, $imgBoxCont, $img); /* << CallBack */
						checkFinish();
					}

					// ___________________________________________________________________

					function getSettingsOverwrite() {
						var SettingsOverwrite = {};

						if (imgLiquidRoot.settings.useDataHtmlAttr) {
							var dif = $imgBoxCont.attr('data-imgLiquid-fill'),
							ha =  $imgBoxCont.attr('data-imgLiquid-horizontalAlign'),
							va =  $imgBoxCont.attr('data-imgLiquid-verticalAlign');

							if (dif === 'true' || dif === 'false') SettingsOverwrite.fill = Boolean (dif === 'true');
							if (ha !== undefined && (ha === 'left' || ha === 'center' || ha === 'right' || ha.indexOf('%') !== -1)) SettingsOverwrite.horizontalAlign = ha;
							if (va !== undefined && (va === 'top' ||  va === 'bottom' || va === 'center' || va.indexOf('%') !== -1)) SettingsOverwrite.verticalAlign = va;
						}

						if (imgLiquid.isIE && imgLiquidRoot.settings.ieFadeInDisabled) SettingsOverwrite.fadeInTime = 0; //ie no anims
						return SettingsOverwrite;
					}

					// ___________________________________________________________________

					function makeOldProcess() { /* Only for old browsers, or useBackgroundSize seted false */

						// Calculate size
						var w, h, wn, hn, ha, va, hdif, vdif,
						margT = 0,
						margL = 0,
						$imgCW = $imgBoxCont.width(),
						$imgCH = $imgBoxCont.height();


						// Save original sizes
						if ($img.data('owidth')	=== undefined) $img.data('owidth',	$img[0].width);
						if ($img.data('oheight') === undefined) $img.data('oheight', $img[0].height);


						// Compare ratio
						if (settings.fill === ($imgCW / $imgCH) >= ($img.data('owidth') / $img.data('oheight'))) {
							w = '100%';
							h = 'auto';
							wn = Math.floor($imgCW);
							hn = Math.floor($imgCW * ($img.data('oheight') / $img.data('owidth')));
						} else {
							w = 'auto';
							h = '100%';
							wn = Math.floor($imgCH * ($img.data('owidth') / $img.data('oheight')));
							hn = Math.floor($imgCH);
						}

						// Align X
						ha = settings.horizontalAlign.toLowerCase();
						hdif = $imgCW - wn;
						if (ha === 'left') margL = 0;
						if (ha === 'center') margL = hdif * 0.5;
						if (ha === 'right') margL = hdif;
						if (ha.indexOf('%') !== -1){
							ha = parseInt (ha.replace('%',''), 10);
							if (ha > 0) margL = hdif * ha * 0.01;
						}


						// Align Y
						va = settings.verticalAlign.toLowerCase();
						vdif = $imgCH - hn;
						if (va === 'left') margT = 0;
						if (va === 'center') margT = vdif * 0.5;
						if (va === 'bottom') margT = vdif;
						if (va.indexOf('%') !== -1){
							va = parseInt (va.replace('%',''), 10);
							if (va > 0) margT = vdif * va * 0.01;
						}


						// Add Css
						if (settings.hardPixels) {w = wn; h = hn;}
						$img.css({
							'width': w,
							'height': h,
							'margin-left': Math.floor(margL),
							'margin-top': Math.floor(margT)
						});


						// FadeIn > Only first time
						if (!$img.data('imgLiquid_oldProcessed')) {
							$img.fadeTo(settings.fadeInTime, 1);
							$img.data('imgLiquid_oldProcessed', true);
							if (settings.removeBoxBackground) $imgBoxCont.css('background-image', 'none');
							$imgBoxCont.addClass('imgLiquid_nobgSize');
							$imgBoxCont.addClass('imgLiquid_ready');
						}


						if (settings.onItemFinish) settings.onItemFinish($i, $imgBoxCont, $img); /* << CallBack */
						checkFinish();
					}

					// ___________________________________________________________________

					function checkFinish() { /* Check callBack */
						if ($i === imgLiquidRoot.length - 1) if (imgLiquidRoot.settings.onFinish) imgLiquidRoot.settings.onFinish();
					}


				});
			} //End imgLiquid: function
		}); //End $.fn.extend

	})(jQuery);


	//If a video is wrapped in this element then remove it as it causes an issue with some themes
	setTimeout(function(){
		jQuery('#cff .embed-responsive video, #cff .embed-responsive iframe').unwrap();
	}, 500);


	// Inject css styles ______________________________________________________
	!function () {
		var css = imgLiquid.injectCss,
		head = document.getElementsByTagName('head')[0],
		style = document.createElement('style');
		style.type = 'text/css';
		if (style.styleSheet) {
			style.styleSheet.cssText = css;
		} else {
			style.appendChild(document.createTextNode(css));
		}
		head.appendChild(style);
	}();
	jQuery(".cff-new .cff-album-cover, .cff-new .cff-crop").imgLiquid({fill:true});


} //********* END cff_init() FUNCTION ************//

cff_init();


//Get the Access Token from the shortcode so it can be used in the connect file
function cffGetShortcodeToken($cff){
	var shortcode_token_param = '';
	if ( $cff.attr('data-cff-shortcode') ){
		if( $cff.attr('data-cff-shortcode').indexOf('accesstoken') !== -1 ){
			var shortcode_att = $cff.attr('data-cff-shortcode'),
				shortcode_att_arr = JSON.parse( shortcode_att );
			shortcode_token_param = encodeURI('&at=' + shortcode_att_arr['accesstoken']);
		}
	}
	return shortcode_token_param;
}

// Used for linking text in captions
/* JavaScript Linkify - v0.3 - 6/27/2009 - http://benalman.com/projects/javascript-linkify/ */
window.cffLinkify=(function(){var k="[a-z\\d.-]+://",h="(?:(?:[0-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])\\.){3}(?:[0-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])",c="(?:(?:[^\\s!@#$%^&*()_=+[\\]{}\\\\|;:'\",.<>/?]+)\\.)+",n="(?:ac|ad|aero|ae|af|ag|ai|al|am|an|ao|aq|arpa|ar|asia|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|biz|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|cat|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|coop|com|co|cr|cu|cv|cx|cy|cz|de|dj|dk|dm|do|dz|ec|edu|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gov|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|info|int|in|io|iq|ir|is|it|je|jm|jobs|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mil|mk|ml|mm|mn|mobi|mo|mp|mq|mr|ms|mt|museum|mu|mv|mw|mx|my|mz|name|na|nc|net|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|org|pa|pe|pf|pg|ph|pk|pl|pm|pn|pro|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sy|sz|tc|td|tel|tf|tg|th|tj|tk|tl|tm|tn|to|tp|travel|tr|tt|tv|tw|tz|ua|ug|uk|um|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|xn--0zwm56d|xn--11b5bs3a9aj6g|xn--80akhbyknj4f|xn--9t4b11yi5a|xn--deba0ad|xn--g6w251d|xn--hgbk6aj7f53bba|xn--hlcj6aya9esc7a|xn--jxalpdlp|xn--kgbechtv|xn--zckzah|ye|yt|yu|za|zm|zw)",f="(?:"+c+n+"|"+h+")",o="(?:[;/][^#?<>\\s]*)?",e="(?:\\?[^#<>\\s]*)?(?:#[^<>\\s]*)?",d="\\b"+k+"[^<>\\s]+",a="\\b"+f+o+e+"(?!\\w)",m="mailto:",j="(?:"+m+")?[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@"+f+e+"(?!\\w)",l=new RegExp("(?:"+d+"|"+a+"|"+j+")","ig"),g=new RegExp("^"+k,"i"),b={"'":"`",">":"<",")":"(","]":"[","}":"{","B;":"B+","b:":"b9"},i={callback:function(q,p){return p?'<a href="'+p+'" title="'+p+'" target="_blank">'+q+"</a>":q},punct_regexp:/(?:[!?.,:;'"]|(?:&|&amp;)(?:lt|gt|quot|apos|raquo|laquo|rsaquo|lsaquo);)$/};return function(u,z){z=z||{};var w,v,A,p,x="",t=[],s,E,C,y,q,D,B,r;for(v in i){if(z[v]===undefined){z[v]=i[v]}}while(w=l.exec(u)){A=w[0];E=l.lastIndex;C=E-A.length;if(/[\/:]/.test(u.charAt(C-1))){continue}do{y=A;r=A.substr(-1);B=b[r];if(B){q=A.match(new RegExp("\\"+B+"(?!$)","g"));D=A.match(new RegExp("\\"+r,"g"));if((q?q.length:0)<(D?D.length:0)){A=A.substr(0,A.length-1);E--}}if(z.punct_regexp){A=A.replace(z.punct_regexp,function(F){E-=F.length;return""})}}while(A.length&&A!==y);p=A;if(!g.test(p)){p=(p.indexOf("@")!==-1?(!p.indexOf(m)?"":m):!p.indexOf("irc.")?"irc://":!p.indexOf("ftp.")?"ftp://":"http://")+p}if(s!=C){t.push([u.slice(s,C)]);s=E}t.push([A,p])}t.push([u.substr(s)]);for(v=0;v<t.length;v++){x+=z.callback.apply(window,t[v])}return x||u}})();

//Link #hashtags
function cffReplaceHashtags(hash){
    //Remove white space at beginning of hash
    var replacementString = jQuery.trim(hash);
    //If the hash is a hex code then don't replace it with a link as it's likely in the style attr, eg: "color: #ff0000"
    if ( /^#[0-9A-F]{6}$/i.test( replacementString ) ){
        return replacementString;
    } else {
        return '<a href="https://www.facebook.com/hashtag/'+ replacementString.substring(1) +'" target="_blank" rel="nofollow">' + replacementString + '</a>';
    }
}
//Link @tags
function cffReplaceTags(tag){
    var replacementString = jQuery.trim(tag);
    return '<a href="https://www.facebook.com/'+ replacementString.substring(1) +'" target="_blank" rel="nofollow">' + replacementString + '</a>';
}
var hashRegex = /[#]+[A-Za-z0-9-_]+/g,
	tagRegex = /[@]+[A-Za-z0-9-_]+/g;
// End caption linking functions

//Encoding comments
function cffEncodeHTML(raw) {
	// make sure passed variable is defined
	if (typeof raw === 'undefined') {
		return '';
	}
   // replace greater than and less than symbols with html entity to disallow html in comments
   	var encoded = raw.replace(/(>)/g,'&gt;'),
    	encoded = encoded.replace(/(<)/g,'&lt;');
    	encoded = encoded.replace(/(&lt;br\/&gt;)/g,'<br>');
    	encoded = encoded.replace(/(&lt;br&gt;)/g,'<br>');

	return encoded;
}


//Load comment replies using Ajax
function cffLoadCommentReplies( $this ){

	var usegrouptoken = '',
		useowntoken = '',
		$cffClosestContainer = jQuery('#cff_'+$this.parent().attr('data-id')).closest('#cff');
	if( $cffClosestContainer.hasClass('cff-group') ) usegrouptoken = '&usegrouptoken=true';
	if( $cffClosestContainer.attr('data-own-token') == 'true' ) useowntoken = '&useowntoken=true';

	//Get the token from the shortcode
	var cff_page_id = $this.closest('.cff-item').attr('data-page-id'),
		shortcode_token_param = cffGetShortcodeToken( $cffClosestContainer ),
		$commentReplies = $this.parent(),
		$commentRepliesBox = $commentReplies.siblings('.cff-comment-replies-box'),
		comments_url = cffsiteurl + "/custom-facebook-feed-pro/comments.php?id=" + $commentReplies.attr('data-id') + usegrouptoken + useowntoken + '&pageid=' + cff_page_id + shortcode_token_param;

	if( $commentReplies.hasClass('cff-hide') ){

		$commentRepliesBox.hide();
		$commentReplies.removeClass('cff-hide');

	} else {

		$commentRepliesBox.show();
		$commentReplies.addClass('cff-hide');

		//If the replies haven't been retrieved yet then get them, otherwise just show the existing ones again
		if( $commentRepliesBox.hasClass('cff-empty') ){

			//Display loader
			var $commentRepliesA = $commentReplies.find('a');
			$commentRepliesA.append('<div class="cff-loader"></div>');
			$commentReplies.find('.cff-loader').css('background-color', $commentRepliesA.css('color'));

			jQuery.ajax({
		      	method: "GET",
		      	url: comments_url,
		      	success: function(data) {

			      	//Remove loader
			      	$commentReplies.find('.cff-loader').remove();

			      	//Convert string of data received from comments.php to a JSON object
			      	var data = jQuery.parseJSON( data ),
			      		allComments = '';

			      	if( typeof data.comments !== 'undefined' ){
			    		jQuery.each(data.comments.data, function(i, commentItem) {

			    			//Check whether comment author info exists - only accessible with page access token from the page now
			    			var cff_comment_author_info = true;
			    			if( typeof commentItem.from !== 'undefined' ){
			    				cff_comment_from_id = commentItem.from.id;
			    			} else {
			    				cff_comment_author_info = false;
			    				cff_comment_from_id = '';
			    			}


							allComments += '<div class="cff-comment-reply" id="cff_'+commentItem.id+'"><div class="cff-comment-text-wrapper"><div class="cff-comment-text';
							if(!cff_comment_author_info) allComments += ' cff-no-name';
							allComments += '"><p>';
							if(cff_comment_author_info) allComments += '<a href="http://facebook.com/'+commentItem.from.id+'" class="cff-name" target="_blank" rel="nofollow" style="color:#;">'+commentItem.from.name+'</a>';
							var cffCommentMessage = cffEncodeHTML(commentItem.message);
							allComments += cffCommentMessage+'</p>';

						  	//Add image attachment if exists
							if( typeof commentItem.attachment !== 'undefined' ) allComments += '<a class="cff-comment-attachment" href="'+commentItem.attachment.url+'" target="_blank"><img src="'+commentItem.attachment.media.image.src+'" alt="'+commentItem.attachment.title+'" /></a>';

		       				//Show like count if exists
						  	if(parseInt(commentItem.like_count) > 0) allComments += '<span class="cff-time"><span class="cff-comment-likes"><b></b>'+commentItem.like_count+'</span></span>';

						  	allComments += '</div></div>';
						  	if(cff_comment_author_info) allComments += '<div class="cff-comment-img cff-comment-reply-img"><a href="http://facebook.com/'+commentItem.from.id+'" target="_blank" rel="nofollow"><img src="https://graph.facebook.com/'+commentItem.from.id+'/picture" width="20" height="20" alt="Avatar" onerror="this.style.display=\'none\'"></a></div>';
						  	allComments += '</div>';
						});
					}

		    		$commentRepliesBox.html(allComments).removeClass('cff-empty');

		    		if( $this.closest('#cff').hasClass('cff-masonry') && !$this.closest('#cff').hasClass('cff-masonry-css') ) cffAddMasonry( $this.closest('#cff') );

		    	} //End success

			}); //End ajax

		} //End if

	} //End if/else

} // End cffLoadCommentReplies()




function cffLightbox(){
	/**
	 * Lightbox v2.7.1
	 * by Lokesh Dhakar - http://lokeshdhakar.com/projects/lightbox2/
	 *
	 * @license http://creativecommons.org/licenses/by/2.5/
	 * - Free for use in both personal and commercial projects
	 * - Attribution requires leaving author name, author link, and the license info intact
	 */

	(function() {
		// Use local alias
		var $ = jQuery;

		var LightboxOptions = (function() {
			function LightboxOptions() {
				this.fadeDuration                = 300;
				this.fitImagesInViewport         = true;
				this.resizeDuration              = 400;
				this.positionFromTop             = 50;
				this.showImageNumberLabel        = true;
				this.alwaysShowNavOnTouchDevices = false;
				this.wrapAround                  = false;
			}

			// Change to localize to non-english language
			LightboxOptions.prototype.albumLabel = function(curImageNum, albumSize) {
			  	return curImageNum + " / " + albumSize;
			};

			return LightboxOptions;
		})();


		var Lightbox = (function() {
			function Lightbox(options) {
				this.options           = options;
				this.album             = [];
				this.currentImageIndex = void 0;
				this.init();
			}

			Lightbox.prototype.init = function() {
			  	this.enable();
			  	this.build();
			};

			// Loop through anchors and areamaps looking for either data-lightbox attributes or rel attributes
			// that contain 'cff-lightbox'. When these are clicked, start lightbox.
			Lightbox.prototype.enable = function() {
			  	var self = this;
			  	$('body').on('click', 'a[data-cff-lightbox], area[data-cff-lightbox]', function(event) {
			    	self.start($(event.currentTarget));
			    	return false;
			  	});
			};

			// Build html for the lightbox and the overlay.
			// Attach event handlers to the new DOM elements. click click click
			Lightbox.prototype.build = function() {

			  	var self = this;
			  	$("<div id='cff-lightbox-overlay' class='cff-lightbox-overlay'></div><div id='cff-lightbox-wrapper' class='cff-lightbox-wrapper'><div class='cff-lightbox-outerContainer'><div class='cff-lightbox-container'><iframe type='text/html' src='' allowfullscreen frameborder='0' webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe><img class='cff-lightbox-image' src='' alt='"+$('#cff').attr('data-fb-text')+"' /><div class='cff-lightbox-nav'><a class='cff-lightbox-prev' href=''><span>Previous</span></a><a class='cff-lightbox-next' href=''><span>Next</span></a></div><div class='cff-lightbox-loader'><a class='cff-lightbox-cancel'></a></div><div class='cff-lightbox-sidebar'></div></div></div><div class='cff-lightbox-dataContainer'><div class='cff-lightbox-data'><div class='cff-lightbox-details'><p class='cff-lightbox-caption'><span class='cff-lightbox-caption-text'></span><a class='cff-lightbox-facebook' href=''>"+$('#cff').attr('data-fb-text')+"</a></p><div class='cff-lightbox-thumbs'><div class='cff-lightbox-thumbs-holder'></div></div></div><div class='cff-lightbox-closeContainer'><a class='cff-lightbox-close'><i class='fa fa-times' aria-hidden='true'></i></a></div></div></div></div>").appendTo($('body'));
			  
				// Cache jQuery objects
				this.$lightbox       = $('#cff-lightbox-wrapper');
				this.$overlay        = $('#cff-lightbox-overlay');
				this.$outerContainer = this.$lightbox.find('.cff-lightbox-outerContainer');
				this.$container      = this.$lightbox.find('.cff-lightbox-container');

				// Store css values for future lookup
				this.containerTopPadding = parseInt(this.$container.css('padding-top'), 10);
				this.containerRightPadding = parseInt(this.$container.css('padding-right'), 10);
				this.containerBottomPadding = parseInt(this.$container.css('padding-bottom'), 10);
				this.containerLeftPadding = parseInt(this.$container.css('padding-left'), 10);

				// Attach event handlers to the newly minted DOM elements
				this.$overlay.hide().on('click', function() {
					self.end();
					if( cff_supports_video() ) $('#cff-lightbox-wrapper video.cff-lightbox-video')[0].pause();
					$('#cff-lightbox-wrapper iframe').attr('src', '');
					return false;
				});


				this.$lightbox.hide().on('click', function(event) {
					if ($(event.target).attr('id') === 'cff-lightbox-wrapper') {
					  	self.end();
					    if( cff_supports_video() ) $('#cff-lightbox-wrapper video.cff-lightbox-video')[0].pause();
					    $('#cff-lightbox-wrapper iframe').attr('src', '');
					}
					return false;
				});
				this.$outerContainer.on('click', function(event) {
					if ($(event.target).attr('id') === 'cff-lightbox-wrapper') {
					  	self.end();
					  	if( cff_supports_video() ) $('#cff-lightbox-wrapper video.cff-lightbox-video')[0].pause();
						$('#cff-lightbox-wrapper iframe').attr('src', '');
					}
					return false;
				});


				this.$lightbox.find('.cff-lightbox-prev').on('click', function() {
					if (self.currentImageIndex === 0) {
					  	self.changeImage(self.album.length - 1);
					} else {
					  	self.changeImage(self.currentImageIndex - 1);
					}
					if( cff_supports_video() ) $('#cff-lightbox-wrapper video.cff-lightbox-video')[0].pause();
					$('#cff-lightbox-wrapper iframe').attr('src', '');
					return false;
				});

				this.$lightbox.find('.cff-lightbox-next').on('click', function() {
					if (self.currentImageIndex === self.album.length - 1) {
					  	self.changeImage(0);
					} else {
					  	self.changeImage(self.currentImageIndex + 1);
					}
					if( cff_supports_video() ) $('#cff-lightbox-wrapper video.cff-lightbox-video')[0].pause();
					$('#cff-lightbox-wrapper iframe').attr('src', '');
					return false;
				});


				//CHANGE IMAGE ON THUMB CLICK
				$('.cff-lightbox-thumbs').on('click', '.cff-lightbox-attachment', function (){
					var $thumb = $(this),
						$thumbImg = $thumb.find('img'),
						captionText = $thumb.attr('data-caption');

					if(captionText == '' || captionText == 'undefined') captionText = $thumb.attr('orig-caption');

					//Pass image URL, width and height to the change image function
					self.changeImage(parseInt( $thumb.attr('data-cff-lightbox-order') ), $thumb.attr('href'), $thumbImg.attr('width'), $thumbImg.attr('height'), $thumb.attr('data-facebook'), captionText);
					return false;
				});


				this.$lightbox.find('.cff-lightbox-loader, .cff-lightbox-close').on('click', function() {
					self.end();
					if( cff_supports_video() ) $('#cff-lightbox-wrapper video.cff-lightbox-video')[0].pause();
					$('#cff-lightbox-wrapper iframe').attr('src', '');
					return false;
				});

	    	}; //End build()

		    // Show overlay and lightbox. If the image is part of a set, add siblings to album array.
		    Lightbox.prototype.start = function($link) {
				var self    = this;
				var $window = $(window);

				$window.on('resize', $.proxy(this.sizeOverlay, this));

				$('select, object, embed').css({
					visibility: "hidden"
				});

				this.sizeOverlay();

				//Only set the album to be empty when the page first loads, otherwise don't empty it otherwise it's rebuilt using the "push" method below and it pushes the lightbox thumbnails onto the end of the array instead of them being spliced in at their correct location
				if(this.album.length == 0) this.album = [];
				var imageNumber = 0;

				function addToAlbum($link) {
					//If an image with the same href has already been added then don't add it to the lightbox order again
					var found = false;
					$.each(self.album, function(i, imageitem) {
						if( imageitem.link == $link.attr('href') ){
							found = true;
							return;
						}
					});
					if(found == true) return;	  

					self.album.push({
						link: $link.attr('href'),
						title: $link.attr('data-title') || $link.attr('title'),
						postid: $link.attr('data-id'),
						showthumbs: $link.attr('data-thumbs'),
						facebookurl: $link.attr('data-url'),
						video: $link.attr('data-video'),
						iframe: $link.attr('data-iframe'),
						type: $link.attr('data-type'),
						cffgroupalbums: $link.attr('data-cffgroupalbums'),
						isthumbnail: $link.attr('data-cff-isthumbnail'),
						pagename: $link.parent().attr('data-cff-page-name'),
						posttime: $link.parent().attr('data-cff-post-time'),
						lbcomments: $link.attr('data-lb-comments')
					});
				}

				// Support both data-lightbox attribute and rel attribute implementations
				var dataLightboxValue = $link.attr('data-cff-lightbox');
				var $links;

				if (dataLightboxValue) {
					$links = $($link.prop("tagName") + '[data-cff-lightbox="' + dataLightboxValue + '"]');
					for (var i = 0; i < $links.length; i = ++i) {
						addToAlbum($($links[i]));
						if ($links[i] === $link[0]) {
							imageNumber = i;

							//Loop through the album array and try to match the ID of the image that was clicked on with an image within the album array. We can then use that to set the lightbox order for that image, as otherwise it's incorrect if there have been thumbs added into the album array which aren't physically present on the page as they're loaded dynamically from the thumbs array within the lightbox. Only do this for post images and not thumbnails.
							$.each(self.album, function(i, image) {
								if( (image.postid == $link.attr('data-id')) && image.isthumbnail != true ) imageNumber = i;
							});
						}
					}
				} else {
					if ($link.attr('rel') === 'lightbox') {
					  	// If image is not part of a set
					  	addToAlbum($link);
					} else {
					  	// If image is part of a set
					  	$links = $($link.prop("tagName") + '[rel="' + $link.attr('rel') + '"]');
					  	for (var j = 0; j < $links.length; j = ++j) {
					    addToAlbum($($links[j]));
						    if ($links[j] === $link[0]) {
						     	imageNumber = j;
						    }
						}
					}
				}

				// Position Lightbox
				var top  = $window.scrollTop() + this.options.positionFromTop;
				var left = $window.scrollLeft();
				this.$lightbox.css({
					top: top + 'px',
					left: left + 'px'
				}).fadeIn(this.options.fadeDuration);

				this.changeImage(imageNumber);
		    };

		    // Hide most UI elements in preparation for the animated resizing of the lightbox.
		    Lightbox.prototype.changeImage = function(imageNumberVal, imageUrl, imgWidth, imgHeight, facebookLink, captionText) {
				var self = this,
					isThumb = false,
					bottomPadding = 120;

					imageNumber = imageNumberVal;

				//Is this a thumb being clicked?
				if(typeof imageUrl !== 'undefined') isThumb = true;

				this.disableKeyboardNav();
				var $image = this.$lightbox.find('.cff-lightbox-image');

				this.$overlay.fadeIn(this.options.fadeDuration);

				$('.cff-lightbox-loader').fadeIn('slow');
				this.$lightbox.find('.cff-lightbox-image, .cff-lightbox-nav, .cff-lightbox-prev, .cff-lightbox-next, .cff-lightbox-dataContainer, .cff-lightbox-numbers, .cff-lightbox-caption').hide();

				this.$outerContainer.addClass('animating');


				// When image to show is preloaded, we send the width and height to sizeContainer()
				var preloader = new Image();
				preloader.onload = function() {
					var $preloader, imageHeight, imageWidth, maxImageHeight, maxImageWidth, windowHeight, windowWidth;

					$image.attr('src', self.album[imageNumber].link);

					/*** THUMBS ***/
					//Change the main image when it's a thumb that's being clicked
					if(isThumb){
						$image.attr('src', imageUrl);
						$('.cff-lightbox-facebook').attr('href', facebookLink);
						$('.cff-lightbox-caption .cff-lightbox-caption-text').html(captionText);

						//Set width and height of image when thumb is clicked
						preloader.width = imgWidth;
						preloader.height = imgHeight;

						//Increase bottom padding to make room for at least one row of thumbs
						bottomPadding = 180;
					}
					/*** THUMBS ***/

					$preloader = $(preloader);

					$image.width(preloader.width);
					$image.height(preloader.height);

					if (self.options.fitImagesInViewport) {
						// Fit image inside the viewport.
						// Take into account the border around the image and an additional 10px gutter on each side.
						windowWidth    = $(window).width();
						windowHeight   = $(window).height();

						//If this feed has lightbox comments enabled then add room for the sidebar
						var cff_lb_comments_width = 0;

						if( $('#cff_' + self.album[0].postid).closest('#cff').attr('data-lb-comments') == 'true' && windowWidth > 640 ) cff_lb_comments_width = 300;

						maxImageWidth  = windowWidth - self.containerLeftPadding - self.containerRightPadding - 20 - cff_lb_comments_width;
						maxImageHeight = windowHeight - self.containerTopPadding - self.containerBottomPadding - bottomPadding;

						// Is there a fitting issue?
						if ((preloader.width > maxImageWidth) || (preloader.height > maxImageHeight)) {
							if ((preloader.width / maxImageWidth) > (preloader.height / maxImageHeight)) {
							  	imageWidth  = maxImageWidth;
							  	imageHeight = parseInt(preloader.height / (preloader.width / imageWidth), 10);
							  	$image.width(imageWidth);
							  	$image.height(imageHeight);
							} else {
							  	imageHeight = maxImageHeight;
							  	imageWidth = parseInt(preloader.width / (preloader.height / imageHeight), 10);
							  	$image.width(imageWidth);
							  	$image.height(imageHeight);
							}
						}
					}

					//Pass the width and height of the main image
					self.sizeContainer($image.width(), $image.height());

				};

				preloader.src          = this.album[imageNumber].link;
				this.currentImageIndex = imageNumber;
		    };

		    // Stretch overlay to fit the viewport
		    Lightbox.prototype.sizeOverlay = function() {
		      	this.$overlay
		        	.width($(window).width())
		        	.height($(document).height());
		    };

		    // Animate the size of the lightbox to fit the image we are showing
		    Lightbox.prototype.sizeContainer = function(imageWidth, imageHeight) {
				var self = this;

				var oldWidth  = this.$outerContainer.outerWidth();
				var oldHeight = this.$outerContainer.outerHeight();
				var newWidth  = imageWidth + this.containerLeftPadding + this.containerRightPadding;
				var newHeight = imageHeight + this.containerTopPadding + this.containerBottomPadding;

				function postResize() {
					self.$lightbox.find('.cff-lightbox-dataContainer').width(newWidth);
					self.$lightbox.find('.cff-lightbox-prevLink').height(newHeight);
					self.$lightbox.find('.cff-lightbox-nextLink').height(newHeight);
					self.showImage();
				}

				if (oldWidth !== newWidth || oldHeight !== newHeight) {
					this.$outerContainer.animate({
					 	width: newWidth,
					 	height: newHeight
					}, this.options.resizeDuration, 'swing', function() {
					  	postResize();
					});
				} else {
					postResize();
				}
		    };

		    // Display the image and it's details and begin preload neighboring images.
		    Lightbox.prototype.showImage = function() {
				this.$lightbox.find('.cff-lightbox-loader').hide();
				this.$lightbox.find('.cff-lightbox-image').fadeIn('slow');

				this.updateNav();
				this.updateDetails();
				this.preloadNeighboringImages();
				this.enableKeyboardNav();
		    };

		    // Display previous and next navigation if appropriate.
		    Lightbox.prototype.updateNav = function() {
				// Check to see if the browser supports touch events. If so, we take the conservative approach
				// and assume that mouse hover events are not supported and always show prev/next navigation
				// arrows in image sets.
				var alwaysShowNav = false;
				try {
					document.createEvent("TouchEvent");
					alwaysShowNav = (this.options.alwaysShowNavOnTouchDevices)? true: false;
				} catch (e) {}

				this.$lightbox.find('.cff-lightbox-nav').show();

				if (this.album.length > 1) {
					if (this.options.wrapAround) {
					  	if (alwaysShowNav) {
					    	this.$lightbox.find('.cff-lightbox-prev, .cff-lightbox-next').css('opacity', '1');
					  	}
					  	this.$lightbox.find('.cff-lightbox-prev, .cff-lightbox-next').show();
					} else {
					  	if (this.currentImageIndex > 0) {
						    this.$lightbox.find('.cff-lightbox-prev').show();
						    if (alwaysShowNav) {
						      	this.$lightbox.find('.cff-lightbox-prev').css('opacity', '1');
						    }
					  	}
						if (this.currentImageIndex < this.album.length - 1) {
							this.$lightbox.find('.cff-lightbox-next').show();
							if (alwaysShowNav) {
							  	this.$lightbox.find('.cff-lightbox-next').css('opacity', '1');
							}
						}
					}
				}
		    };

		    var thumbsArr = {};

		    // Display caption, image number, and closing button.
		    Lightbox.prototype.updateDetails = function() {
		    	var self = this;
		    	var origCaption = '';

		    	this.$lightbox.find('.cff-lightbox-nav, .cff-lightbox-nav a').show();

		      	/** NEW PHOTO ACTION **/

		      	//Add the video element to the lightbox dynamically (as it causes issues with some themes if an empty tag is in there on page load)
		      	if( $('.cff-lightbox-video').length == 0 ) $('.cff-lightbox-container').prepend("<video class='cff-lightbox-video' src='' poster='' controls></video>");

		      	//Switch video when either a new popup or navigating to new one
	            if( cff_supports_video() ){
	              	$('#cff-lightbox-wrapper').removeClass('cff-has-video');

	              	if (typeof this.album[this.currentImageIndex].video !== 'undefined'){
		              	if( this.album[this.currentImageIndex].video.length ){

		                	$('#cff-lightbox-wrapper').addClass('cff-has-video');
			                $('.cff-lightbox-video').attr({
			                	'src' : this.album[this.currentImageIndex].video,
			                	'poster' : this.album[this.currentImageIndex].link,
			                	'autoplay' : 'true'
			                });
			            }
			        }

		        }

		        //***LIGHTBOX COMMENTS***
		        //Enable/disable lightbox comments. If it's a lightbox thumbnail then check whether the parent post has lb_comments enabled/disabled.
				var cff_lb_comments = (this.album[this.currentImageIndex].lbcomments == 'true' && $('#cff_'+this.album[this.currentImageIndex].postid+' .cff-lightbox-link').attr('data-lb-comments') != 'false') ? true : false;

				if( $(window).width() <= 640 ) cff_lb_comments = false;

		        //Add lightbox sidebar
		        if( cff_lb_comments ){
		        	var lb_post_id = this.album[this.currentImageIndex].postid,
	        			page_id = lb_post_id.split('_')[0],
	        			author_name = this.album[this.currentImageIndex].pagename,
	        			date_in_correct_format = this.album[this.currentImageIndex].posttime,
	        			$lightbox_sidebar = $('.cff-lightbox-container .cff-lightbox-sidebar'),
	        			$lightbox_thumbs_holder = $('.cff-lightbox-thumbs-holder'),
	        			from_id = $( '#cff_'+this.album[this.currentImageIndex].postid ).attr('data-cff-from');

		        	//Add class to the lightbox container
					$('.cff-lightbox-wrapper').addClass('cff-enable-lb-comments');

					//Adjust width to make room for the sidebar
					$('.cff-lightbox-dataContainer').css( 'width', $('.cff-lightbox-dataContainer').innerWidth() + 300 );
					$lightbox_sidebar.css('display', 'block');

					//If the from info isn't available then display a placeholder avatar and the date
					var cff_post_author = "";
					if( typeof from_id !== 'undefined' ){
						cff_post_author =  "<div class='cff-author'><div class='cff-author-text'><p class='cff-page-name cff-author-date'><a href='https://facebook.com/"+from_id+"' target='_blank' rel='nofollow'>"+author_name+"</a><span class='cff-story'> </span></p><p class='cff-date'>"+date_in_correct_format+"</p></div><a href='https://facebook.com/"+from_id+"' target='_blank' rel='nofollow' class='cff-author-img'><img src='https://graph.facebook.com/"+from_id+"/picture?type=square' title='"+author_name+"' alt='"+author_name+"' width='40' height='40'></a></div>";
					} else {
						cff_post_author =  "<div class='cff-author cff-no-author-info'><div class='cff-author-text'><p class='cff-date'>"+date_in_correct_format+"</p></div><div class='cff-author-img'></div></div>";
					}

					//Remove the close button from the bottom of lightbox as it's added to the top of the sidebar
					$('.cff-lightbox-dataContainer .cff-lightbox-close').remove();

		        	$lightbox_sidebar.html("<div class='cff-lightbox-closeContainer'><div class='cff-lightbox-close'><i class='fa fa-times' aria-hidden='true'></i></div></div><div class='cff-lightbox-sidebar-content'>" + cff_post_author + "<p class='cff-lightbox-caption'><span class='cff-lightbox-caption-text'>" + $('.cff-lightbox-caption-text').html() + '</span></p></div>' + $('#cff_'+this.album[this.currentImageIndex].postid+' .cff-comments-box')[0].outerHTML );

		        	this.$lightbox.find('.cff-lightbox-close').on('click', function() {
						self.end();
						if( cff_supports_video() ) $('#cff-lightbox-wrapper video.cff-lightbox-video')[0].pause();
						$('#cff-lightbox-wrapper iframe').attr('src', '');
						return false;
					});

		        	//Use a timeout to delay this as the thumbs aren't added till further down
		        	setTimeout(function(){
			        	if( $lightbox_thumbs_holder.find('a').length > 1 ){
			        		$lightbox_sidebar.find('.cff-page-name a').text( $lightbox_thumbs_holder.find('a.cff-selected').attr('data-page-name') );
			        		$lightbox_sidebar.find('.cff-date').text( $lightbox_thumbs_holder.find('a.cff-selected').attr('data-post-date') );
			        	}
		        	}, 0);

		        	//Delete the caption from under the photo if the sidebar section is enabled
		        	$('.cff-lightbox-dataContainer .cff-lightbox-caption').remove();
		        	$lightbox_thumbs_holder.css('margin-top', -10);

		        	//If the "__ likes this" text is too long then bump it onto the next line
		        	if( $lightbox_sidebar.find('.cff-reactions-count').innerWidth() > 150 ){
		        		$lightbox_sidebar.find('.cff-likes-this-text').addClass('cff-long');
		        	}

		        	//Add comment avatars
					$lightbox_sidebar.find('.cff-comment:visible').each(function(){
						var $thisComment = jQuery(this);
						$thisComment.find('.cff-comment-img:not(.cff-comment-reply-img) a').html( '<img src="https://graph.facebook.com/'+$thisComment.attr("data-id")+'/picture" alt="Avatar" />' );
					});

					//Load comment replies
					$lightbox_sidebar.find('.cff-comment-replies a').on('click', function(){
						cffLoadCommentReplies( $(this) );
					});

					$lightbox_sidebar.find('.cff-show-more-comments a').attr('href', $lightbox_sidebar.find('.cff-comment-on-facebook a').attr('href') );

		        } else { //End add lightbox sidebar

		        	//Disable lightbox
		        	$('.cff-lightbox-wrapper .cff-lightbox-sidebar').html('');
					$('.cff-lightbox-wrapper').removeClass('cff-enable-lb-comments');

		        }
		        //***END LIGHTBOX COMMENTS***



		        $('#cff-lightbox-wrapper').removeClass('cff-has-iframe cff-fb-player');

		        //If it's an iframe video (embed or FB video player)
		        if( typeof this.album[this.currentImageIndex].iframe !== 'undefined' ){
				    if( this.album[this.currentImageIndex].iframe.length ){
				        var videoURL = this.album[this.currentImageIndex].iframe;
		            	$('#cff-lightbox-wrapper').addClass('cff-has-iframe');

		            	if( videoURL.indexOf("https://www.facebook.com/v2.3/plugins/video.php?") !=-1 ) $('#cff-lightbox-wrapper').addClass('cff-fb-player');

		            	//If it's a swf then don't add the autoplay parameter. This is only for embedded videos like YouTube or Vimeo.
		            	if( videoURL.indexOf(".swf") > -1 || videoURL.indexOf("&autoplay=1") !=-1 ){
		            		var autoplayParam = '';
		            	} else {
		            		var autoplayParam = '?autoplay=1';
		            	}

		            	//Add a slight delay before adding the URL else it doesn't autoplay on Firefox
			            var vInt = setTimeout(function() {
							$('#cff-lightbox-wrapper iframe').attr({
						    	'src' : videoURL + autoplayParam + "&mute=0"
						    });
						}, 500);
		            }
		        }

	            //Check whether it's a thumbnail image that's currently being shown in the lightbox
	            var isThumbnail = false;
	            if( this.album[this.currentImageIndex].isthumbnail ) isThumbnail = true;

		      	//Remove existing thumbs unless it's a thumbnail image which is being navigated through in which case keep the existing thumbnails
		      	if( !isThumbnail ) $('.cff-lightbox-thumbs-holder').empty();

		      	//Change the link on the Facebook icon to be the link to the Facebook post only if it's the first image in the lightbox and one of the thumbs hasn't been clicked
		      	if( this.album[this.currentImageIndex].link == $('.cff-lightbox-image').attr('src') ){
		      		$('.cff-lightbox-facebook').attr('href', this.album[this.currentImageIndex].facebookurl);
		      	}

		      	//Show thumbs area if there are thumbs
		     	if( this.album[this.currentImageIndex].showthumbs == 'true' ){
		      		$('.cff-lightbox-thumbs').show();
		      		// $('.cff-lightbox-thumbs .cff-loader').show();

		      		//Get the post ID
		      		var thisPostId = this.album[this.currentImageIndex].postid,
		      			albumInfo = '',
				      	albumThumbs = '',
				      	albumsonly = false;
				    if( this.album[this.currentImageIndex].type == 'albumsonly' ) albumsonly = true;


			      	if( typeof thumbsArr[thisPostId] !== 'undefined' ){

			      		//load them in from array in local var
			      		// console.log(thumbsArr[thisPostId]);
			      		$.each(thumbsArr[thisPostId], function(i, thumb) {
				      		var origCaption = thumb[5].replace(/"/g, '&quot;');

			      		  	//Loop through the album array and find the imageindex of the item with this post ID. Then set the current image index to be this. Otherwise when going backwards through the lightbox the imageindex is set to be the current thumb index and then once i is added the index is too high.
			      		  	var albumIndex = 0;
				      		$.each(self.album, function(i, albumItem) {
				      			if( albumItem.postid == thisPostId ){
				      				albumIndex = i;
				      				//Once found the first match exit the loop
				      				return false;
				      			}
				      		});

			      		  	var lightboxImageOrder = (parseInt(albumIndex)+parseInt(i));

		      		  		//If the small thumb isn't defined (like in regular posts) then use the full image instead
		      		  		if( typeof thumb[8] == 'undefined' ) thumb[8] = thumb[0];

							albumThumbs += '<a href="'+thumb[0]+'" class="cff-lightbox-attachment" data-cff-lightbox="cff-lightbox-1" data-facebook="'+thumb[3]+'" data-caption="'+thumb[4]+'" orig-caption="'+origCaption+'" data-page-name="'+thumb[6]+'" data-post-date="'+thumb[7]+'" data-cff-lightbox-order="'+lightboxImageOrder+'" lbcomments="true" data-thumbs="true" data-url="'+thumb[3]+'" data-iframe data-video ';

							(albumsonly) ? albumThumbs += 'data-type="albumsonly" ' : albumThumbs += 'data-type ';
							albumThumbs += 'data-cff-isthumbnail="true"><img src="'+thumb[8]+'" width="'+thumb[1]+'" height="'+thumb[2]+'" /></a>';

							//Add all of the thumbs (apart from the first thumb) to the lightbox order
							if( i > 0 ){
								cffInsertLightboxImage(lightboxImageOrder, thumb[0], thumb[4], thumb[3], thisPostId, albumsonly, true, thumb[6], thumb[7], thumb[8]);
							}
						});

			      		//Add thumbs to the page
		            	$('.cff-lightbox-thumbs-holder').html( '<div style="margin-top: 10px;">' + albumThumbs + '</div>' );

		            	//Liquidfill the thumbs
		            	jQuery(".cff-lightbox-thumbs-holder a").imgLiquid({fill:true});

		            	//Hide the loader
		            	$('.cff-loader').hide();
						$('.cff-lightbox-thumbs-holder').css('min-height', 0);

			      	} else {
			      		//Use ajax to get them from Facebook API

			      		//Set paths for thumbs.php
				  		if (typeof cffsiteurl === 'undefined' || cffsiteurl == '') cffsiteurl = window.location.host + '/wp-content/plugins';

				  		//Get the token from the shortcode
				  		var $cffClosest = $('#cff_'+thisPostId).closest('.cff'),
				  			cff_page_id = $('#cff_'+thisPostId).attr('data-page-id'),
				  			shortcode_token_param = cffGetShortcodeToken( $cffClosest ),
				  			useowntoken = '';
						if( $cffClosest.attr('data-own-token') == 'true' ) useowntoken = '&useowntoken=true';

					  	//AJAX
					  	var cffAttachmentsUrl = cffsiteurl + "/custom-facebook-feed-pro/thumbs.php?id=" + thisPostId + '&pageid=' + cff_page_id + useowntoken + shortcode_token_param,
				      		thumbsData = [];

				      	//If this is an albums only item and the thumbs will
				      	if( albumsonly ){
				      		cffAttachmentsUrl = cffAttachmentsUrl + '&albumsonly=true';
				      		$('.cff-lightbox-thumbs-holder').css('min-height', 45).after('<div class="cff-loader fa-spin"></div>');
				      	}

				      	//If it's a group album then add the absolute path so we can get the User Access Token from the DB
				      	var cffgroupalbums = this.album[this.currentImageIndex].cffgroupalbums;
				      	if( cffgroupalbums ) cffAttachmentsUrl = cffAttachmentsUrl + '&usegrouptoken=' + cffgroupalbums;

				      	$.ajax({
				            method: "GET",
				            url: cffAttachmentsUrl,
				            // dataType: "jsonp",
				            success: function(data) {

				            	//Convert string of data received from thumbs.php to a JSON object
				            	data = jQuery.parseJSON( data );

				            	if(albumsonly){
				            		//Compile the thumbs
						      		$.each(data.data, function(i, photoItem) {
						      		  	var dataCaption = '';
						      		  	if( photoItem.name ) dataCaption = photoItem.name;
						      		  	// origCaption = String(origCaption).replace(/"/g, '&quot;');

							      		//Format the caption and add links
							      		dataCaption = cffLinkify(dataCaption);
		                				dataCaption = dataCaption.replace( hashRegex , cffReplaceHashtags );
		                				// dataCaption = dataCaption.replace( tagRegex , cffReplaceTags ); - causes an issue with email address linking
										dataCaption = String(dataCaption).replace(/& /g, '&amp; ').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, "<br/>");

										origCaption = String(origCaption).replace(/& /g, '&amp; ').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, "<br/>");

										var lightboxImageOrder = (parseInt(self.currentImageIndex)+parseInt(i));

										//If it's a group then use the source otherwise it displays as question marks
										var cffThumbHref = photoItem.source,
											cffPhotoItemWidth = photoItem.width,
											cffPhotoItemHeight = photoItem.height;

										//Use the full size image if available
										if( typeof photoItem.images[0] !== 'undefined' ){
											cffThumbHref = photoItem.images[0].source;
											cffPhotoItemWidth = photoItem.images[0].width;
											cffPhotoItemHeight = photoItem.images[0].height;
										}

										//Set the thumbnail image to be the smallest size available, which is the second from last in images arr
										if( typeof photoItem.images[ photoItem.images.length-2 ] !== 'undefined' ){
											var cffThumbImg = photoItem.images[ photoItem.images.length-2 ].source;
										} else {
											var cffThumbImg = cffThumbHref;
										}

								  		albumThumbs += '<a href="'+cffThumbHref+'" class="cff-lightbox-attachment" data-facebook="http://facebook.com/'+photoItem.id+'" data-caption="'+dataCaption+'" orig-caption="'+origCaption+'" data-cff-lightbox-order="'+lightboxImageOrder+'" data-thumbs="true" data-url="http://facebook.com/'+photoItem.id+'" data-iframe data-video data-type="albumsonly" data-cff-isthumbnail="true"><img src="'+cffThumbImg+'" lbcomments="false" width="'+cffPhotoItemWidth+'" height="'+cffPhotoItemHeight+'" /></a>';

								  		thumbsData.push([cffThumbHref, cffPhotoItemWidth, cffPhotoItemHeight, 'http://facebook.com/'+photoItem.id, dataCaption, origCaption, undefined, undefined, cffThumbImg]);

								  		//Add all of the thumbs (apart from the first thumb) to the lightbox order
								  		if( i > 0 ){
										  	cffInsertLightboxImage(lightboxImageOrder, cffThumbHref, dataCaption, 'http://facebook.com/'+photoItem.id, thisPostId, albumsonly, true, cffThumbImg);
										}

									}); //End each

				            	} else {
				            		//Check whether there's data..
				            		if (typeof data.attachments !== 'undefined') {

				            			//..Then compile the thumbs
				            			$.each(data.attachments.data[0].subattachments.data, function(i, subattachment) {
				            			  	var dataCaption = '';
											if( subattachment.description ) dataCaption = subattachment.description;
											origCaption = String(origCaption).replace(/"/g, '&quot;');

											//Format the caption and add links
											dataCaption = cffLinkify(dataCaption);
											dataCaption = dataCaption.replace( hashRegex , cffReplaceHashtags );
											// dataCaption = dataCaption.replace( tagRegex , cffReplaceTags ); - causes an issue with email address linking
											dataCaption = String(dataCaption).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, "<br/>");

											var lightboxImageOrder = (parseInt(self.currentImageIndex)+parseInt(i));

											albumThumbs += '<a href="'+subattachment.media.image.src+'" class="cff-lightbox-attachment" data-facebook="'+subattachment.url+'" data-caption="'+dataCaption+'" orig-caption="'+origCaption+'" lbcomments="true" data-page-name="'+author_name+'" data-post-date="'+date_in_correct_format+'" data-cff-lightbox-order="'+lightboxImageOrder+'" data-thumbs="true" data-url="'+subattachment.url+'" data-iframe data-video data-type data-cff-isthumbnail="true"><img src="'+subattachment.media.image.src+'" width="'+subattachment.media.image.width+'" height="'+subattachment.media.image.height+'" /></a>';

											thumbsData.push([subattachment.media.image.src, subattachment.media.image.width, subattachment.media.image.height, subattachment.url, dataCaption, origCaption, author_name, date_in_correct_format]);

											//Add all of the thumbs (apart from the first thumb) to the lightbox order
											if( i > 0 ){
												cffInsertLightboxImage(lightboxImageOrder, subattachment.media.image.src, dataCaption, subattachment.url, thisPostId, albumsonly, true, author_name, date_in_correct_format, subattachment.media.image.src);
											}

										});

									} //End undefined check
						      		
				            	} //End if/else

								//Add thumbs to the page
				            	$('.cff-lightbox-thumbs-holder').append( '<div style="margin-top: 10px;">' + albumThumbs + '</div>' );

				            	//Liquidfill the thumbs
				            	jQuery(".cff-lightbox-thumbs-holder .cff-lightbox-attachment").imgLiquid({fill:true});

				            	//Hide the loader
				            	$('.cff-loader').hide();

								$('.cff-lightbox-thumbs-holder').css('min-height', 0);

				            	//Add the thumbs to the thumbs array to store them
				            	thumbsArr[ thisPostId ] = thumbsData;

					        } //End success

				        }); //End ajax

			      	} //End if/else

		      	} else {
		      		//If there are no thumbs then hide the thumbs area
		      		$('.cff-lightbox-thumbs').hide();
		      	}

		      	//Add a class to the selected thumb
		      	$(".cff-lightbox-attachment").removeClass('cff-selected');
		      	$(".cff-lightbox-attachment[href='"+$('.cff-lightbox-image').attr('src')+"']").addClass('cff-selected');


		      	function cffInsertLightboxImage(currentImageIndex, link, title, facebookurl, postid, albumsonly, isThumbnail, cffThumbImg){

		      		//Make sure the thumbs aren't added to the lightbox order more than once
		      		var found = false;
		      		$.each(self.album, function(i, thumbitem) {
		      			if( thumbitem.link == link ){
		      				found = true;
		      				return;
		      			}
		      		});
		      		if(found == true) return;

		      		( albumsonly ) ? postType = 'albumsonly' : postType = '';
		      		( albumsonly ) ? lbcomments = 'false' : lbcomments = 'true';

		      		//Push the image into the album array at the correct location so it's included in the lightbox order
		      		self.album.splice(currentImageIndex, 0, {
						link: link,
						title: title,
						postid: postid,
						showthumbs: 'true',
						facebookurl: facebookurl,
						video: '',
						iframe: '',
						type: postType,
						cffgroupalbums: undefined,
						isthumbnail: isThumbnail,
						lbcomments: lbcomments,
						thumbimg: cffThumbImg
			        });

		      	} //End cffInsertLightboxImage()

		      	/** END NEW PHOTO ACTION **/

		      
				//Still show the caption section even if there's not a caption as it contains the View on Facebook link
				this.$lightbox.find('.cff-lightbox-caption').fadeIn('fast');

				// Enable anchor clicks in the injected caption html.
				if (typeof this.album[this.currentImageIndex].title !== 'undefined' && this.album[this.currentImageIndex].title !== "") {

					//If it's the first image in the lightbox then set the caption to be the text from the post. For all subsequent images the caption is changed on the fly based elsehwere in the code based on an attr from the thumb that's clicked
					var origCaption = this.album[this.currentImageIndex].title;

					//Add hashtag and tag links
					// origCaption = cffLinkify(origCaption); - Caused issues with @tag links in regular lightbox popup
					origCaption = origCaption.replace( hashRegex , cffReplaceHashtags );
					// origCaption = origCaption.replace( tagRegex , cffReplaceTags ); - causes an issue with email address linking
					//Decode the caption back so that the tags are rendered as HTML:
					origCaption = String(origCaption).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');

					var $lightboxCaption = this.$lightbox.find('.cff-lightbox-caption'),
						$lightboxCaptionText = $lightboxCaption.find('.cff-lightbox-caption-text');
					if( this.album[this.currentImageIndex].link == $('.cff-lightbox-image').attr('src') ) $lightboxCaptionText.html( origCaption );

					//If there's no caption then remove the border and margin from the View on Facebook link
					if( $lightboxCaptionText.text() == ' ' || $lightboxCaptionText.text() == '' ){
						$lightboxCaption.addClass('cff-no-caption');
					} else {
						$lightboxCaption.removeClass('cff-no-caption');
					}

				} else {
					this.$lightbox.find('.cff-lightbox-caption').addClass('cff-no-caption').find('.cff-lightbox-caption-text').html('');
				}

				this.$lightbox.find('.cff-lightbox-facebook, .cff-lightbox-caption-text a, .cff-lightbox-sidebar a:not(.cff-comment-replies-a)').unbind().on('click', function(event){
						window.open(
						$(this).attr('href'),
						'_blank'
						)
		        	}
		        );
			    
				if (this.album.length > 1 && this.options.showImageNumberLabel) {
					this.$lightbox.find('.cff-lightbox-number').text(this.options.albumLabel(this.currentImageIndex + 1, this.album.length)).fadeIn('fast');
				} else {
					this.$lightbox.find('.cff-lightbox-number').hide();
				}

				this.$outerContainer.removeClass('animating');

				this.$lightbox.find('.cff-lightbox-dataContainer').fadeIn(this.options.resizeDuration, function() {
					return self.sizeOverlay();
				});

		    }; //End Lightbox.prototype.updateDetails

		    // Preload previous and next images in set.
		    Lightbox.prototype.preloadNeighboringImages = function() {
				if (this.album.length > this.currentImageIndex + 1) {
					var preloadNext = new Image();
					preloadNext.src = this.album[this.currentImageIndex + 1].link;
				}
				if (this.currentImageIndex > 0) {
					var preloadPrev = new Image();
					preloadPrev.src = this.album[this.currentImageIndex - 1].link;
				}
		    };

		    Lightbox.prototype.enableKeyboardNav = function() {
		      	$(document).on('keyup.keyboard', $.proxy(this.keyboardAction, this));
		    };

		    Lightbox.prototype.disableKeyboardNav = function() {
		      	$(document).off('.keyboard');
		    };

		    Lightbox.prototype.keyboardAction = function(event) {
				var KEYCODE_ESC        = 27;
				var KEYCODE_LEFTARROW  = 37;
				var KEYCODE_RIGHTARROW = 39;

				var keycode = event.keyCode;
				var key     = String.fromCharCode(keycode).toLowerCase();
				if (keycode === KEYCODE_ESC || key.match(/x|o|c/)) {
					if( cff_supports_video() ) $('#cff-lightbox-wrapper video.cff-lightbox-video')[0].pause();
					$('#cff-lightbox-wrapper iframe').attr('src', '');
						
					this.end();
				} else if (key === 'p' || keycode === KEYCODE_LEFTARROW) {
					if (this.currentImageIndex !== 0) {
					  	this.changeImage(this.currentImageIndex - 1);
					} else if (this.options.wrapAround && this.album.length > 1) {
					  	this.changeImage(this.album.length - 1);
					}

					if( cff_supports_video() ) $('#cff-lightbox-wrapper video.cff-lightbox-video')[0].pause();
					$('#cff-lightbox-wrapper iframe').attr('src', '');

				} else if (key === 'n' || keycode === KEYCODE_RIGHTARROW) {
					if (this.currentImageIndex !== this.album.length - 1) {
					 	this.changeImage(this.currentImageIndex + 1);
					} else if (this.options.wrapAround && this.album.length > 1) {
					  	this.changeImage(0);
					}

					if( cff_supports_video() ) $('#cff-lightbox-wrapper video.cff-lightbox-video')[0].pause();
					$('#cff-lightbox-wrapper iframe').attr('src', '');

				}
			};

		    // Closing time
		    Lightbox.prototype.end = function() {
				this.disableKeyboardNav();
				$(window).off("resize", this.sizeOverlay);
				this.$lightbox.fadeOut(this.options.fadeDuration);
				this.$overlay.fadeOut(this.options.fadeDuration);
				$('select, object, embed').css({
					visibility: "visible"
				});
		    };

		    return Lightbox;

	  	})(); //End Lightbox = (function()

		$(function() {
			var options  = new LightboxOptions();
			var lightbox = new Lightbox(options);
		});

	}).call(this); //End (function() {

	//Checks whether browser support HTML5 video element
	function cff_supports_video() {
	  return !!document.createElement('video').canPlayType;
	}


} //End cffLightbox function

//Only call the lightbox if the class is on at least one feed on the page
if( jQuery('#cff.cff-lb').length ) cffLightbox();



} //End cff_js_exists check