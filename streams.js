var keys = require("./data");
var sentiment = require('sentiment');
var pubnub = require("pubnub")(keys.PubNub);
var twit = require("twit");

var t = new twit(keys.Twitter);

var Streamer = function() {
    this.connected = false;
    this.keywords = [];
    this.listeners = [];
};

Streamer.prototype.addListener = function(keyword, channel) {
    if (!keyword || !channel) {
        this.log("Missing arguments, you need a keyword and a channel");
        return;
    }

    if (this.listeners.filter(function(e) {return e.keyword === keyword}).length > 0) {
        this.log("Keyword is already in the list, skipping it.");
        return;
    }

    this.keywords.push(keyword);
    this.listeners.push({keyword: keyword, channel: channel});

    if (this.stream) {
        this.init();
    }
};

Streamer.prototype.init = function() {
    var self = this;

    self.log("Starting streamer");

    if (this.stream) {
        this.stream = null;
    }

    var stream = t.stream("statuses/filter", {track: this.keywords});
    stream.on("tweet", function(t) {
        console.log(t.text);
        var analysis = sentiment(t.text);
        var validListeners = [];
        validListeners = self.listeners.filter(function(e) {
            return t.text.match(new RegExp(e.keyword, "i"));
        });
        if (validListeners.length === 0) {
            return;
        }
        for (var i = 0; i < validListeners.length; i++) {
            var message = {keyword: validListeners[i].keyword.toLowerCase(), score: analysis.score};
            pubnub.publish({
                channel: validListeners[i].channel,
                message: message
            });
        }

    });
    stream.on('disconnect', function (disconnectMessage) {
        self.connected = false;
    });
    stream.on('connected', function (response) {
        self.connected = true;
        self.log("Connected to Twitter Stream API");
    });
    this.stream = stream;
};

Streamer.prototype.log = function(message) {
    console.log("[Streamer]", message);
};


module.exports = Streamer;