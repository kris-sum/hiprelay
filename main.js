/*
 * Let's say we want to let HipChat and IRC users communicate together.
 * Let's say we have an HipChat room named "IRC" and a "#hipchat-irc"
 * channel on Freenode. This application creates a bidirectional pipe
 * between the two, so that what users write in HipChat shows up
 * in IRC and vice versa, of course.
 *
 * The logic is quite simple. We have two async modules running: ircbot
 * and weblistener. ircbot is connected to IRC and listens for people
 * writing in channel, and on a message event it performs a relay to
 * HipChat by making a POST request against an integration, plus token.
 * The weblistener module, on the other hand, listens to a webhook
 * generated query coming from the HipChat room and triggered whenever
 * a HipChat user writes a message. The weblistener module decodes the
 * JSON message and relays it into IRC.
 * 
 * Now let this all sink in for a moment.
 * Beautiful, isn't it?
*/


var config = require('./config.js');
var irc = require('irc');
var httprequest = require('request');

var irc_config = {
	channels: [ config.irc_channel ],
	server: config.irc_server,
	ports: config.irc_port,
	nickname: config.irc_nickname,
	userName: config.irc_username,
	realName: config.irc_realname,
	selfSigned: true,
	certExpired: true,
	stripColors: true,
	autoConnect: true,
	autoRejoin: true,
	secure: false,
	floodProtection: true,
	floodProtectionDelay: 100
}

var ircbot = new irc.Client(irc_config.server, irc_config.nickname, irc_config, {
	channels: irc_config.channels
});

ircbot.addListener('message', function(nick, channel, message) {
	text = "<"+nick+"> "+message;
	irc_to_hipchat(text, 'gray')
});

ircbot.addListener('join', function(channel, who) {
	text = "User "+who+" joined the room.";
	irc_to_hipchat(text, "green");
});

ircbot.addListener('part', function(channel, who) {
	text = "User "+who+" left the room.";
	irc_to_hipchat(text, "yellow");
});

ircbot.addListener('part', function(channel, who) {
	    text = "User "+who+" has quit.";
		irc_to_hipchat(text, "red");
});


//bot.addListener('kick', function(channel, who, by, reason) {
//	    console.log('%s was kicked from %s by %s: %s', who, channel, by, reason);
//});


ircbot.addListener('error', function(message){
	console.log("ircbot error: "+ JSON.stringify(message));
});

if(config.irc_password) {
	// some networks don't allow us to join until we identified
	// e.g. AzzurraNet
	setTimeout(function() { ircbot.send('NickServ', "IDENTIFY "+config.irc_password);
		ircbot.join(config.irc_channel);
	}, 500);
}

function irc_to_hipchat(text, color) {
	httprequest.post(
		config.int_url+"/notification?auth_token="+config.int_token,
		{ form : {"color" : color, "message" : text,
					"notify" : "false", "message_format" : "text" } },
		function(error, response, body) {
			if(!error && response.statusCode == 200) {
					console.log("irc_to_hipchat() error: "+err+'\n');
			}
		}
	);
}

