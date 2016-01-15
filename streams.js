/**
 * This module takes keywords and then listens for them on the Twitter Streaming API
 * Once a keyword is detected, it gets analyzed for a sentiment score.  This score
 * is then sent to subscribers for visualization.
 * @type {exports}
 */
var keys = require("./data");
var sentiment = require('sentiment');
var pubnub = require("pubnub")(keys.PubNub);
var twit = require("twit");

//Initialize Twitter
var t = new twit(keys.Twitter);

//Constructor
var Streamer = function() {
    this.connected = false;
    this.keywords = [];
    this.listeners = [];
};

/**
 * Add a new keyword.  When a matching tweet is found,  it will
 * broadcast the sentiment to the indicated channel
 * @param keyword
 * @param channel
 */
Streamer.prototype.addListener = function(keyword, channel) {
    //We need both a keyword and a channel to broadcast to
    if (!keyword || !channel) {
        this.log("Missing arguments, you need a keyword and a channel");
        return;
    }

    //Ignore duplicates
    if (this.listeners.filter(function(e) {return e.keyword === keyword}).length > 0) {
        this.log("Keyword is already in the list, skipping it.");
        return;
    }

    //Add to the lists
    this.keywords.push(keyword);
    this.listeners.push({keyword: keyword, channel: channel});

    //Restart the stream if needed
    if (this.stream) {
        this.init();
    }
};

/**
 * Initialize the object so it starts listening to tweets and broadcasting
 * to channels
 */
Streamer.prototype.init = function() {
    var self = this;

    self.log("Starting streamer");

    //If we already have a running instance, stop it.
    if (this.stream) this.stream.stop();

    //Listen for all the keywords
    var stream = t.stream("statuses/filter", {track: this.keywords});
    stream.on("tweet", function(t) {
        //Analyze the tweet
        var analysis = sentiment(t.text);
        //Match against the keyword list to find the channel to broadcast to
        var validListeners = [];
        validListeners = self.listeners.filter(function(e) {
            return t.text.match(new RegExp(e.keyword, "i"));
        });
        //On RT's there may be no match
        if (validListeners.length === 0) {
            return;
        }
        //For each match, broadcast to the appropriate channel
        for (var i = 0; i < validListeners.length; i++) {
            var message = {keyword: validListeners[i].keyword.toLowerCase(), score: analysis.score};
            pubnub.publish({
                channel: validListeners[i].channel,
                message: message
            });
        }

    });
    //Got disconnected for some reason, log it
    stream.on('disconnect', function (disconnectMessage) {
        self.connected = false;
        self.log(disconnectMessage);
    });
    //Connection established
    stream.on('connected', function (response) {
        self.connected = true;
        self.log("Connected to Twitter Stream API");
    });
    //Store the stream in the object
    this.stream = stream;
};

/**
 * Log something
 * @param message
 */
Streamer.prototype.log = function(message) {
    console.log("[Streamer]", message);
};


module.exports = Streamer;