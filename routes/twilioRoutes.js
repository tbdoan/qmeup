"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const querystring = require("querystring");
const request = require("request");
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const firebaseConfig_1 = require("../functions/firebaseConfig");
require('dotenv/config');
//TODO: implement this later
// const welcomeMessage =
//   'Welcome! Text "room" to create a new room or text a roomcode followed by a Spotify URI to queue up a song.';
const router = express.Router();
exports.router = router;
router.use(bodyParser.urlencoded({ extended: false })).use(session({
    secret: 'anything-you-want-but-keep-secret',
    resave: true,
    saveUninitialized: false,
}));
router.post('/sms', (req, res) => {
    const twiml = new MessagingResponse();
    //TODO: use this later to create welcome message
    // const smsCount = req.session.counter || 0;
    const body = req.body.Body;
    //good indication that a person is sending in a track
    if (body.includes('spotify') && body.includes('track')) {
        console.log('if');
        let [roomCode, spotifyURI] = body.split(' ');
        roomCode = roomCode.toUpperCase();
        if (spotifyURI.includes('https:')) {
            // converts the spotify link to uri
            spotifyURI = spotifyURI.substring(spotifyURI.lastIndexOf('/') + 1, spotifyURI.lastIndexOf('?'));
            spotifyURI = 'spotify:track:' + spotifyURI;
        }
        const ref = firebaseConfig_1.db.ref(`rooms/${roomCode}`);
        ref.on('value', function (snapshot) {
            console.log(snapshot.val());
            if (snapshot.val() == null) {
                //TODO: send error message
            }
            else {
                const accessToken = snapshot.val().accessToken;
                const options = {
                    url: `https://api.spotify.com/v1/me/player/queue?uri=${spotifyURI}`,
                    headers: {
                        Authorization: 'Bearer ' + accessToken,
                        'Content-Length': 0,
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                };
                // use the access token to access the Spotify Web API
                request.post(options, function (error, response, body) {
                    console.log(options.url);
                    console.log(response.statusCode);
                });
            }
        }, function (errorObject) {
            console.log('The read failed: ' + errorObject.code);
        });
    }
    else {
        console.log('else');
        // prompt them to create a room
        // Access the message body and the number it was sent from.
        twiml.message('To create a room, sign in with Spotify here: http://localhost:8080/login/?' +
            querystring.stringify({ phoneNumber: req.body.From }));
    }
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
});
