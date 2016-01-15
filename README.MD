#PubNub Demo

A demo on how to use PubNub for real time data feeds.

The graphics on the page show the sentiment analysis over time of various twitter feeds.  The data is fetched by using
Nodejs and Twitter's stream API.  The data is then analyzed and the sentiment scores are sent to the connected clients.

#Live Demo

http://radiant-ravine-7631.herokuapp.com

#Run Locally

To run locally, you should start by cloning this repo

```javascript
git clone http://github.com/joellord/PubNubDemo
```

Then run the NPM install

```javascript
cd PubNubDemo
npm install
```

Edit the data.js file to add your keys for Twitter and PubNub.

And finally, start the server

```javascript
node .
```

You can now point your browser to http://localhost:3000 to view the application.