//Load the required libraries
var express = require("express");
var http = require("http");
var Stream = require("./streams");

//Define the express app and port
var app = express();
var port = process.env.PORT || 3000;

//Global vars and constants
var streams = [];
var trendKeywords = [];

var MAX_TRENDS = 3;
var TRENDS_URL = "http://api.whatthetrend.com/api/v2/trends.json";

//Create a new instance of the streamer (see streams.js)
var streamer = new Stream();

//This function will check for trends and recreate the keyword list.
function checkTrends() {
    http.get(TRENDS_URL, function (res) {
        var body = "";
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            body = JSON.parse(body);
            trendKeywords = [];

            //Add the defaults
            addRegularKeywords();

            //Add the trending keywords
            body.trends.map(function(e) {trendKeywords.push(e.name);});
            for (var i = 0; i < Math.min(MAX_TRENDS, trendKeywords.length); i++) {
                streamer.addListener(trendKeywords[i], "trend");
            }

            //Start the streamer
            streamer.init();
        });
    });

    //Refresh trends every 12 hours
    setTimeout(checkTrends, 12*60*60*1000);
}

//Add some default keywords to the list
function addRegularKeywords() {
    streamer.addListener("javascript", "javascript");
    streamer.addListener("@pubnub", "pubnub");
}

//Start checking for trends and listening to keywords
checkTrends();

//Serve static files from the public_html folder
app.use(express.static(__dirname + "/public_html"));

//Start me up !
app.listen(port);
console.log("Server listening on port " + port);