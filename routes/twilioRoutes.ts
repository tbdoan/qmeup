import express = require('express');
import bodyParser = require('body-parser');
import session = require('express-session');
import querystring = require('querystring');
import axios from 'axios';
import request = require('request');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
import { db } from '../functions/firebaseConfig';
import { processSpotifyLink } from '../functions/functions';
require('dotenv/config');

const welcomeMessage =
  'If you are a host, text "room" to find your current room code, or "new" to create a new room (warning: this will delete your old room). \n If you are a guest, text a room code followed by a Spotify link to queue up a song.';

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false })).use(
  session({
    secret: 'anything-you-want-but-keep-secret',
    resave: true,
    saveUninitialized: false,
  })
);

router.post('/sms', (req, res) => {
  const twiml = new MessagingResponse();
  let sent = false;
  //will send a timeout if five seconds passes before a response
  setTimeout(() => {
    if (!sent) {
      twiml.message("Internal Error: Something's broken");
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(twiml.toString());
    }
  }, 5000);
  //TODO: use this later to create welcome message
  // const smsCount = req.session.counter || 0;
  const body: string = req.body.Body;
  let [roomCode, spotifyURI] = processSpotifyLink(body);
  if (roomCode !== null && spotifyURI !== null) {
    db.ref(`rooms/${roomCode}`).on(
      'value',
      function (snapshot) {
        if (snapshot.val() === null) {
          twiml.message("Sorry, looks like that's an invalid room code.");
          res.writeHead(200, { 'Content-Type': 'text/xml' });
          res.end(twiml.toString());
          sent = true;
        } else {
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
          axios
            .post(
              `https://api.spotify.com/v1/me/player/queue?uri=${spotifyURI}`,
              {},
              headersObject
            )
            .then((response) => {
              if (response.status === 204) {
                twiml.message('Added to queue!');
                res.writeHead(200, { 'Content-Type': 'text/xml' });
                res.end(twiml.toString());
                sent = true;
              }
            })
            .catch((err) => {
              console.table([err.response.status, err.response.statusText]);
              if (err.response.status === 404) {
                twiml.message('Host is not playing music now');
                res.writeHead(200, { 'Content-Type': 'text/xml' });
                res.end(twiml.toString());
                sent = true;
              } else if (err.response.statusText === 'Unauthorized') {
                //timed out
                // requesting access token from refresh token
                const authOptions = {
                  url: 'https://accounts.spotify.com/api/token',
                  headers: {
                    Authorization:
                      'Basic ' +
                      Buffer.from(
                        process.env.SPOTIFY_CLIENT_ID +
                          ':' +
                          process.env.SPOTIFY_CLIENT_SECRET
                      ).toString('base64'),
                  },
                  form: {
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                  },
                  json: true,
                };
                request.post(authOptions, function (error, response, body) {
                  if (!error && response.statusCode === 200) {
                    db.ref(`rooms/${roomCode}/accessToken`)
                      .set(body.access_token)
                      .catch((err0r) => {
                        console.log(err0r);
                      });
                  }
                });
              }
            });
        }
      },
      function (errorObject) {
        // failed firebase read
        console.log('The read failed: ' + errorObject.toString());
      }
    );
  } else if (body.toLowerCase() === 'new') {
    db.ref(`/phoneNumbers/${req.body.From}`).once('value', function (snapshot) {
      if (snapshot.val() !== null) {
        const roomToDelete = snapshot.val().roomCode;
        db.ref(`/rooms/${roomToDelete}`).set(null);
        db.ref(`/phoneNumbers/${req.body.From}`).set(null);
      }
      twiml.message(
        'To create a room, sign in with Spotify here: https://spotify-express-login.wl.r.appspot.com/login/?' +
          querystring.stringify({ phoneNumber: req.body.From })
      );
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(twiml.toString());
      sent = true;
    });
  } else if (body.toLowerCase() === 'room') {
    db.ref(`/phoneNumbers/${req.body.From}`).once('value', function (snapshot) {
      if (snapshot.val() === null) {
        twiml.message(
          'To create a room, sign in with Spotify here: https://spotify-express-login.wl.r.appspot.com/login/?' +
            querystring.stringify({ phoneNumber: req.body.From })
        );
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
        sent = true;
      } else {
        twiml.message(`Your active room code is ${snapshot.val().roomCode}`);
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
        sent = true;
      }
    });
  } else {
    // prompt them to create a room
    // Access the message body and the number it was sent from.
    twiml.message(welcomeMessage);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
    sent = true;
  }
});

export { router };
