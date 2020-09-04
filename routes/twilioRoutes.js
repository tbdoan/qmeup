"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const querystring = require("querystring");
const axios_1 = require("axios");
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
    let sent = false;
    //TODO: use this later to create welcome message
    // const smsCount = req.session.counter || 0;
    const body = req.body.Body;
    //good indication that a person is sending in a track
    if (body.includes('spotify') && body.includes('track')) {
        let [roomCode, spotifyURI] = body.split(' ');
        roomCode = roomCode.toUpperCase();
        if (spotifyURI.includes('https:')) {
            // converts the spotify link to uri
            spotifyURI = spotifyURI.substring(spotifyURI.lastIndexOf('/') + 1, spotifyURI.lastIndexOf('?'));
            spotifyURI = 'spotify:track:' + spotifyURI;
        }
        const ref = firebaseConfig_1.db.ref(`rooms/${roomCode}`);
        ref.on('value', function (snapshot) {
            if (snapshot.val() === null) {
                twiml.message("Sorry, looks like that's an invalid room code");
                res.writeHead(200, { 'Content-Type': 'text/xml' });
                res.end(twiml.toString());
                sent = true;
            }
            else {
                const accessToken = snapshot.val().accessToken;
                const refreshToken = snapshot.val().refreshToken;
                const headersObject = {
                    headers: {
                        Authorization: 'Bearer ' + accessToken,
                        'Content-Length': 0,
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                };
                axios_1.default
                    .post(`https://api.spotify.com/v1/me/player/queue?uri=${spotifyURI}`, {}, headersObject)
                    .then((response) => {
                    if (response.status === 204) {
                        twiml.message('Added to queue!');
                        res.writeHead(200, { 'Content-Type': 'text/xml' });
                        res.end(twiml.toString());
                        sent = true;
                    }
                })
                    .catch((err) => {
                    if (err.response.statusText === 'Unauthorized') {
                        // requesting access token from refresh token
                        let refresh_token = refreshToken;
                        const authOptions = {
                            url: 'https://accounts.spotify.com/api/token',
                            headers: {
                                Authorization: 'Basic ' +
                                    Buffer.from(process.env.SPOTIFY_CLIENT_ID +
                                        ':' +
                                        process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),
                            },
                            form: {
                                grant_type: 'refresh_token',
                                refresh_token: refresh_token,
                            },
                            json: true,
                        };
                        request.post(authOptions, function (error, response, body) {
                            if (!error && response.statusCode === 200) {
                                firebaseConfig_1.db.ref(`rooms/${roomCode}/accessToken`)
                                    .set(body.access_token)
                                    .catch((err0r) => {
                                    console.log(err0r);
                                });
                            }
                        });
                    }
                });
            }
        }, function (errorObject) {
            // failed firebase read
            console.log('The read failed: ' + errorObject.toString());
        });
        setTimeout(() => {
            if (!sent) {
                twiml.message("Internal Error: Something's broken");
                res.writeHead(200, { 'Content-Type': 'text/xml' });
                res.end(twiml.toString());
            }
        }, 2000);
    }
    else {
        // prompt them to create a room
        // Access the message body and the number it was sent from.
        twiml.message('To create a room, sign in with Spotify here: http://localhost:8080/login/?' +
            querystring.stringify({ phoneNumber: req.body.From }));
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
    }
});
