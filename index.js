var express = require("express");
var http = require("http");
var Stream = require("./streams");

var app = express();
var port = process.env.PORT || 3000;

var streams = [];
var trendKeywords = [];

var MAX_TRENDS = 3;
var TRENDS_URL = "http://api.whatthetrend.com/api/v2/trends.json";

var streamer = new Stream();

function checkTrends() {
    http.get(TRENDS_URL, function (res) {
        var body = "";
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            body = JSON.parse(body);
            trendKeywords = [];
            addRegularKeywords();

            body.trends.map(function(e) {trendKeywords.push(e.name);});
            for (var i = 0; i < Math.min(MAX_TRENDS, trendKeywords.length); i++) {
                streamer.addListener(trendKeywords[i], "trend");
            }
            streamer.init();
        });
    });

    //Refresh trends every 12 hours
    setTimeout(checkTrends, 12*60*60*1000);
}

checkTrends();

function addRegularKeywords() {
    streamer.addListener("javascript", "javascript");
    streamer.addListener("@pubnub", "pubnub");
}

app.get("/stats", function(req, res) {
    res.json(getStats());
});

app.use(express.static(__dirname + "/public_html"));

app.listen(port);
console.log("Server listening on port " + port);