var keys = require("./data");
var sentiment = require('sentiment');
var pubnub = require("pubnub")(keys.PubNub);
var twit = require("twit");

var t = new twit(keys.Twitter);

var Stream = function(keyword, channel) {
    this.keyword = keyword;
    this.channel = channel || "trend";
    this.stream = {};
    this.count = 0;
    return this;
};
Stream.prototype.init = function() {
    var self = this;
    console.log("Init stream " + this.keyword);
    var stream = t.stream("statuses/filter", {track: this.keyword});
    stream.on("tweet", function(t) {
        self.count++;
        var analysis = sentiment(t.text);
        var message = self.channel === "trend" ? {keyword: self.keyword.toLowerCase(), score: analysis.score} : analysis.score;
        pubnub.publish({
            channel: self.channel,
            message: message
        });
    });

    stream.on('limit', function (limitMessage) {
        self.log(limitMessage);
    });
    stream.on('scrub_geo', function (scrubGeoMessage) {
        self.log(scrubGeoMessage);
    });
    stream.on('disconnect', function (disconnectMessage) {
        self.log(disconnectMessage);
    });
    stream.on('connect', function (request) {
        //self.log(request);
    });
    stream.on('connected', function (response) {
        self.log("connected");
    });
    stream.on('reconnect', function (request, response, connectInterval) {
        self.log("reconnect", connectInterval);
    });
    stream.on('warning', function (warning) {
        self.log(warning);
    });

    return this;
};
Stream.prototype.log = function(message) {
    console.log("[" + this.keyword + "]", message);
};


module.exports = Stream;