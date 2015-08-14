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
var hc = require('hipchatter');
var hc = new hc(config.apikey, config.apiurl);
var httprequest = require('request');
var express = require('express');
var weblistener = express();
var webparser = require('body-parser');

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
	irc_to_hipchat(nick, message)
});


hc.delete_all_webhooks(config.hipchat_room, function(err) {
	if(err != null) {
		console.log("Webhook cleanup error: "+err+'\n');
	}
});

hc.create_webhook(config.hipchat_room, { 
	url: config.this_app_url+'/message',
	event: 'room_message' }, function(err, webhook) {
	if(err != null) {
		console.log("Webhook injection error: "+err+'\n');
	}
});


weblistener.use(webparser.json());

weblistener.post('/message', function(req, res) {
	var nick = req.body.item.message.from.mention_name;
	var message = req.body.item.message.message;
	hipchat_to_irc(nick, message);
});

function irc_to_hipchat(nick, message) {
	httprequest.post(
		config.int_url+"/notification?auth_token="+config.int_token,
		{ form : {"color" : config.hipchat_color, "message" : "<"+nick+">"+" "+message,
					"notify" : "false", "message_format" : "text" } },
		function(error, response, body) {
			if(!error && response.statusCode == 200) {
					console.log("irc_to_hipchat() error: "+err+'\n');
			}
		}
	);
}

function hipchat_to_irc(nick, message) {
	ircbot.say(config.irc_channel, "<"+nick+"> "+message);
}

var webserver = weblistener.listen(config.this_app_port, function() {
	var host = webserver.address().address;
	var port = webserver.address().port;
});
