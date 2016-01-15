var express = require("express");
var http = require("http");
var Stream = require("./streams");

var app = express();
var port = process.env.PORT || 3000;

var streams = [];
var trendKeyword = [];
var MAX_TRENDS = 3;
var TRENDS_URL = "http://api.whatthetrend.com/api/v2/trends.json";
var DEBUG = true;

http.get(TRENDS_URL, (res) => {
    var body = "";
    res.on('data', (chunk) => {
        body += chunk;
    });
    res.on('end', () => {
        body = JSON.parse(body);
        body.trends.map((e) => { trendKeyword.push(e.name); });
        for (var i = 0; i < Math.min(MAX_TRENDS, trendKeyword.length); i++) {
            streams.push(new Stream(trendKeyword[i]).init());
        }
    });
});

streams.push(new Stream("javascript", "javascript").init());
streams.push(new Stream("pubnub", "pubnub").init());

function getStats() {
    var stats = {};
    for (var i = 0; i < streams.length; i++) {
        var stream = streams[i];
        stats[stream.keyword] = stream.count;
    }
    if (DEBUG) console.log(stats);
    return stats;
}

//setInterval(getStats, 1000);

app.get("/stats", function(req, res) {
    res.json(getStats());
});

app.use(express.static(__dirname + "/public_html"));

app.listen(port);
console.log("Server listening on port " + port);