function codeshop_init() {
	codeshop_responsive();
}
function codeshop_responsive() {
	jQuery(".codeshop-mainbox").each(function() {
		var viewport_width = Math.max(420, jQuery(this).parent().innerWidth());
		if (viewport_width < 440) {
			jQuery(this).addClass("codeshop-narrow");
		} else {
			jQuery(this).removeClass("codeshop-narrow");
		}
	});
}
function codeshop_set_provider(object, provider) {
	var selected = jQuery(object).parent().parent().find(".codeshop-payment-selected");
	jQuery(selected).css({"background-image": "url("+jQuery(object).attr("data-logo")+")"});
	jQuery(object).parentsUntil(".codeshop-payment-form").parent().find('[name="codeshop-gateway"]').val(provider);
	jQuery(object).parent().slideToggle(200);
	return false;

}
function codeshop_continue(object) {
	jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-payment-providers").slideUp(200);
	jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideUp(200);
	jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-overlay").fadeIn(300);
	jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-spinner").fadeIn(300);
	var email = codeshop_encode64(jQuery(object).parentsUntil(".codeshop-payment-form").parent().find('[name="codeshop-email"]').val());
	var amount = codeshop_encode64(jQuery(object).parentsUntil(".codeshop-payment-form").parent().find('[name="codeshop-amount"]').val());
	var gateway = codeshop_encode64(jQuery(object).parentsUntil(".codeshop-payment-form").parent().find('[name="codeshop-gateway"]').val());
	var campaign_id = codeshop_encode64(jQuery(object).parentsUntil(".codeshop-payment-form").parent().find('[name="codeshop-campaign"]').val());
	var success_url = codeshop_encode64(jQuery(object).parentsUntil(".codeshop-payment-form").parent().find('[name="codeshop-success-url"]').val());
	var failed_url = codeshop_encode64(jQuery(object).parentsUntil(".codeshop-payment-form").parent().find('[name="codeshop-failed-url"]').val());
	var gdpr_element = jQuery(object).parentsUntil(".codeshop-payment-form").parent().find('[name="codeshop-gdpr"]');
	var gdpr = 'off';
	if (jQuery(gdpr_element).is(":checked")) gdpr = 'on';
	gdpr = codeshop_encode64(gdpr);
	jQuery.ajax({
		url: codeshop_action, 
		data: {
			"email": 		email,
			"amount": 		amount,
			"gateway": 		gateway,
			"campaign": 	campaign_id,
			"success_url": 	success_url,
			"failed_url": 	failed_url,
			"gdpr":			gdpr,
			"action": 		"codeshop_continue"
		},
		dataType: "jsonp",
		success: function(data) {
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-overlay").fadeOut(300);
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-spinner").fadeOut(300);
			try {
				var status = data.status;
				if (status == "OK") {
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-payment-form").fadeOut(300, function() {
						jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-confirmation").html(data.html);
						jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-confirmation").fadeIn(300);
					});
				} else if (status == "ERROR") {
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html(data.html);
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
				} else {
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html("Server reply is incorrect! Please contact administrator!");
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
				}
			} catch(error) {
				jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html("Server reply is incorrect! Please contact administrator!");
				jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
			}
		},
		error: function() {
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-overlay").fadeOut(300);
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-spinner").fadeOut(300);
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html("Server reply is incorrect! Please contact administrator!");
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
		}
	});
	return false;
}
function codeshop_edit(object) {
	jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideUp(200);
	jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-confirmation").fadeOut(300, function() {
		jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-payment-form").fadeIn(300, function() {});
	});
	return false;
}
function codeshop_pay(object) {
	jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-pay").click();
	return false;
}
function codeshop_getcode(object) {
	jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideUp(200);
	jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-overlay").fadeIn(300);
	jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-spinner").fadeIn(300);
	var email = codeshop_encode64(jQuery(object).parentsUntil(".codeshop-mainbox").parent().find('[name="codeshop-email"]').val());
	var campaign_id = codeshop_encode64(jQuery(object).parentsUntil(".codeshop-mainbox").parent().find('[name="codeshop-campaign"]').val());
	jQuery.ajax({
		url: codeshop_action, 
		data: {
			"email": 	email,
			"campaign":	campaign_id,
			"action": 	"codeshop_sendcode"
		},
		dataType: "jsonp",
		success: function(data) {
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-overlay").fadeOut(300);
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-spinner").fadeOut(300);
			try {
				var status = data.status;
				if (status == "OK") {
					var confirmation = jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-confirmation");
					jQuery(confirmation).fadeOut(300, function() {
						jQuery(confirmation).html(data.html);
						jQuery(confirmation).fadeIn(300);
					});
				} else if (status == "ERROR") {
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html(data.html);
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
				} else {
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html("Server reply is incorrect! Please contact administrator!");
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
				}
			} catch(error) {
				jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html("Server reply is incorrect! Please contact administrator!");
				jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
			}
		},
		error: function() {
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-overlay").fadeOut(300);
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-spinner").fadeOut(300);
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html("Server reply is incorrect! Please contact administrator!");
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
		}
	});
	return false;
}
function codeshop_bitpay(object) {
	jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideUp(200);
	jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-overlay").fadeIn(300);
	jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-spinner").fadeIn(300);
	var email = codeshop_encode64(jQuery(object).parentsUntil(".codeshop-mainbox").parent().find('[name="codeshop-email"]').val());
	var amount = codeshop_encode64(jQuery(object).parentsUntil(".codeshop-mainbox").parent().find('[name="codeshop-amount"]').val());
	var campaign_id = codeshop_encode64(jQuery(object).parentsUntil(".codeshop-mainbox").parent().find('[name="codeshop-campaign"]').val());
	var success_url = codeshop_encode64(jQuery(object).parentsUntil(".codeshop-mainbox").parent().find('[name="codeshop-success-url"]').val());
	jQuery.ajax({
		url: codeshop_action, 
		data: {
			"email": 		email,
			"campaign":		campaign_id,
			"amount": 		amount,
			"success_url": 	success_url,
			"action": 	"codeshop_getbitpayurl"
		},
		dataType: "jsonp",
		success: function(data) {
			try {
				var status = data.status;
				if (status == "OK") {
					location.href = data.url;
				} else if (status == "ERROR") {
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-overlay").fadeOut(300);
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-spinner").fadeOut(300);
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html(data.html);
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
				} else {
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-overlay").fadeOut(300);
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-spinner").fadeOut(300);
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html("Server reply is incorrect! Please contact administrator!");
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
				}
			} catch(error) {
				jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-overlay").fadeOut(300);
				jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-spinner").fadeOut(300);
				jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html("Server reply is incorrect! Please contact administrator!");
				jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
			}
		},
		error: function() {
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-overlay").fadeOut(300);
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-spinner").fadeOut(300);
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html("Server reply is incorrect! Please contact administrator!");
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
		}
	});
	return false;
}
function codeshop_blockchain(object) {
	jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideUp(200);
	jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-overlay").fadeIn(300);
	jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-spinner").fadeIn(300);
	var email = codeshop_encode64(jQuery(object).parentsUntil(".codeshop-mainbox").parent().find('[name="codeshop-email"]').val());
	var amount = codeshop_encode64(jQuery(object).parentsUntil(".codeshop-mainbox").parent().find('[name="codeshop-amount"]').val());
	var campaign_id = codeshop_encode64(jQuery(object).parentsUntil(".codeshop-mainbox").parent().find('[name="codeshop-campaign"]').val());
	jQuery.ajax({
		url: codeshop_action, 
		data: {
			"email": 	email,
			"campaign":	campaign_id,
			"amount": 	amount,
			"action": 	"codeshop_getblockchainaddress"
		},
		dataType: "jsonp",
		success: function(data) {
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-overlay").fadeOut(300);
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-spinner").fadeOut(300);
			try {
				var status = data.status;
				if (status == "OK") {
					var confirmation = jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-confirmation");
					jQuery(confirmation).fadeOut(300, function() {
						jQuery(confirmation).html(data.html);
						jQuery(confirmation).fadeIn(300);
					});
				} else if (status == "ERROR") {
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html(data.html);
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
				} else {
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html("Server reply is incorrect! Please contact administrator!");
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
				}
			} catch(error) {
				jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html("Server reply is incorrect! Please contact administrator!");
				jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
			}
		},
		error: function() {
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-overlay").fadeOut(300);
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-spinner").fadeOut(300);
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html("Server reply is incorrect! Please contact administrator!");
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
		}
	});
	return false;
}
function codeshop_stripe(object, currency, label) {
	var email = codeshop_encode64(jQuery(object).parentsUntil(".codeshop-mainbox").parent().find('[name="codeshop-email"]').val());
	var amount = jQuery(object).parentsUntil(".codeshop-mainbox").parent().find('[name="codeshop-amount"]').val();
	var campaign_id = codeshop_encode64(jQuery(object).parentsUntil(".codeshop-mainbox").parent().find('[name="codeshop-campaign"]').val());
	var token = function(res) {
		if (res && res.id) {
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideUp(200);
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-overlay").fadeIn(300);
			jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-spinner").fadeIn(300);
			jQuery.ajax({
				url: codeshop_action, 
				data: {
					"email": 	email,
					"campaign":	campaign_id,
					"amount": 	codeshop_encode64(amount),
					"token":	codeshop_encode64(res.id),
					"action": 	"codeshop_charge"
				},
				dataType: "jsonp",
				success: function(data) {
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-overlay").fadeOut(300);
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-spinner").fadeOut(300);
					try {
						var status = data.status;
						if (status == "OK") {
							var confirmation = jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-confirmation");
							jQuery(confirmation).fadeOut(300, function() {
								jQuery(confirmation).html(data.html);
								jQuery(confirmation).fadeIn(300);
							});
						} else if (status == "ERROR") {
							jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html(data.html);
							jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
						} else {
							jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html("Server reply is incorrect! Please contact administrator!");
							jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
						}
					} catch(error) {
						jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html("Server reply is incorrect! Please contact administrator!");
						jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
					}
				},
				error: function() {
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-overlay").fadeOut(300);
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-loading-spinner").fadeOut(300);
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").html("Server reply is incorrect! Please contact administrator!");
					jQuery(object).parentsUntil(".codeshop-mainbox").parent().find(".codeshop-error").slideDown(200);
				}
			});
		}
	};
	StripeCheckout.open({
		key:         codeshop_stripe_publishable,
		address:     false,
		amount:      parseInt(parseFloat(amount)*100),
		currency:    currency,
		name:        label,
		description: label,
		panelLabel:  'Checkout',
		token:       token
	});
	return false;
}
function codeshop_utf8encode(string) {
	string = string.replace(/\x0d\x0a/g, "\x0a");
	var output = "";
	for (var n = 0; n < string.length; n++) {
		var c = string.charCodeAt(n);
		if (c < 128) {
			output += String.fromCharCode(c);
		} else if ((c > 127) && (c < 2048)) {
			output += String.fromCharCode((c >> 6) | 192);
			output += String.fromCharCode((c & 63) | 128);
		} else {
			output += String.fromCharCode((c >> 12) | 224);
			output += String.fromCharCode(((c >> 6) & 63) | 128);
			output += String.fromCharCode((c & 63) | 128);
		}
	}
	return output;
}
function codeshop_encode64(input) {
	var keyString = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var output = "";
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var i = 0;
	input = codeshop_utf8encode(input);
	while (i < input.length) {
		chr1 = input.charCodeAt(i++);
		chr2 = input.charCodeAt(i++);
		chr3 = input.charCodeAt(i++);
		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;
		if (isNaN(chr2)) {
			enc3 = enc4 = 64;
		} else if (isNaN(chr3)) {
			enc4 = 64;
		}
		output = output + keyString.charAt(enc1) + keyString.charAt(enc2) + keyString.charAt(enc3) + keyString.charAt(enc4);
	}
	return output;
}
function codeshop_utf8decode(input) {
	var string = "";
	var i = 0;
	var c = c1 = c2 = 0;
	while ( i < input.length ) {
		c = input.charCodeAt(i);
		if (c < 128) {
			string += String.fromCharCode(c);
			i++;
		} else if ((c > 191) && (c < 224)) {
			c2 = input.charCodeAt(i+1);
			string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
			i += 2;
		} else {
			c2 = input.charCodeAt(i+1);
			c3 = input.charCodeAt(i+2);
			string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
			i += 3;
		}
	}
	return string;
}
function codeshop_decode64(input) {
	var keyString = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var output = "";
	var chr1, chr2, chr3;
	var enc1, enc2, enc3, enc4;
	var i = 0;
	input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
	while (i < input.length) {
		enc1 = keyString.indexOf(input.charAt(i++));
		enc2 = keyString.indexOf(input.charAt(i++));
		enc3 = keyString.indexOf(input.charAt(i++));
		enc4 = keyString.indexOf(input.charAt(i++));
		chr1 = (enc1 << 2) | (enc2 >> 4);
		chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		chr3 = ((enc3 & 3) << 6) | enc4;
		output = output + String.fromCharCode(chr1);
		if (enc3 != 64) {
			output = output + String.fromCharCode(chr2);
		}
		if (enc4 != 64) {
			output = output + String.fromCharCode(chr3);
		}
	}
	output = codeshop_utf8decode(output);
	return output;
}
jQuery(window).resize(function() {
	codeshop_responsive();
});
