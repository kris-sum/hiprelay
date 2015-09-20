# hiprelay

Let's say we want to let HipChat and IRC users communicate together.

Let's say we have an HipChat room named "IRC" and a "#hipchat-irc" channel on Freenode. This application creates a bidirectional pipe between the two, so that what users write in HipChat shows up in IRC and vice versa, of course.

The logic is quite simple. Or better, it's not *that* hard. We have two async modules running: ircbot and weblistener. ircbot is connected to IRC and listens for people writing in channel, and on a message event it performs a relay to HipChat by making a POST request against an integration, plus token.

In the meanwhile, the weblistener module listens to a webhook generated query coming from the HipChat room and triggered whenever a HipChat user writes a message. The weblistener module decodes the JSON message and relays it into IRC.

Now let this all sink in for a moment. Beautiful, isn't it?

### Setup
1. Have an HipChat API key ready for creating webhooks
2. Configure an integraion on the HipChat room which will host the service
3. Fill in ```config.example.js``` with the required information and save to ```config.js```
4. Enjoy!

### Notes
At the moment, the application clears previous webhooks before inserting the one it needs. This has to be done since up to now HipChat has no way to detect if the webhook we're adding is identical to an already existing one.

Also, to keep things tidy, we're only listening to IRC message events, thus skipping joins/parts/quits.

Check out [hiprelay-stealth](https://github.com/Wide-Net/hiprelay-stealth/) if you want to add more IRC event handlers or if you're looking for a unidirectional version of this project (IRC to HipChat only).

### Screenshots
![irc-hipchat-mirror](https://i.imgur.com/TbxVmT8.png)
