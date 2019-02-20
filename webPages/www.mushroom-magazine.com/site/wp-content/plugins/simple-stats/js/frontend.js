/**
*	Simple Stats 
*	version 1.1
*	---
*	A simple stats collection module for MP3-jPlayer
*	http://mp3-jplayer.com/simple-stats
*/

MJPsimplestats = {

	init: function () {
	
		var callback = function ( track ) {
			MJPstats_request( track, 'change_post_MJPsimplestats');
		};
		MP3_JPLAYER.extCalls.change_post.push( callback );
		
		var callbackD = function ( track ) {
			MJPstats_request( track, 'download_MJPsimplestats');
		};
		MP3_JPLAYER.extCalls.download.push( callbackD );
		
	}

};


function MJPstats_request( info, action )	{

	var data = { 
		'action':	action, 
		'info':		info,
		'tID': 		MP3_JPLAYER.tID
	};
	
	jQuery.ajax({
		type: 		"POST",
		data: 		data,
		url: 		statsMJPajax.WPajaxurl,
		success: 	function( response ) {
			//console.log( response );
		}
	});
	
};


jQuery( document ).ready( function () {
	if ( typeof MP3_JPLAYER !== 'undefined' ) {
		MJPsimplestats.init();
	}
});
