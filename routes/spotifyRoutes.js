"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express = require("express");
const request = require("request"); // "Request" library
const querystring = require("querystring");
const functions_js_1 = require("../functions/functions.js");
const firebaseConfig_1 = require("../functions/firebaseConfig");
const twilioFunctions_1 = require("../functions/twilioFunctions");
require('dotenv/config');
const stateKey = 'spotify_auth_state';
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
let redirect_uri = 'https://spotify-express-login.wl.r.appspot.com/callback';
let access_token;
let refresh_token;
const router = express.Router();
exports.router = router;
router.get('/login', function (req, res) {
    const state = functions_js_1.generateRandomString(16); //for keeping track of state
    res.cookie(stateKey, state);
    res.cookie('phoneNumber', req.query.phoneNumber.toString());
    const scope = 'user-modify-playback-state';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state,
        }));
});
router.get('/callback', function (req, res) {
    // your application requests refresh and access tokens
    // after checking the state parameter
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;
    const phoneNumber = req.cookies ? req.cookies['phoneNumber'] : null;
    if (phoneNumber === null || state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch',
            }));
    }
    else {
        res.clearCookie(stateKey);
        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code',
            },
            headers: {
                Authorization: 'Basic ' +
                    Buffer.from(client_id + ':' + client_secret).toString('base64'),
            },
            json: true,
        };
        // gets the tokens at 'https://accounts.spotify.com/api/token'
        request.post(authOptions, function (error, response, body) {
            let roomCode;
            if (!error && response.statusCode === 200) {
                while (true) {
                    try {
                        roomCode = functions_js_1.generateRandomString(4).toUpperCase();
                        firebaseConfig_1.db.ref(`/rooms/${roomCode}`).set({
                            accessToken: body.access_token,
                            refreshToken: body.refresh_token,
                        });
                        firebaseConfig_1.db.ref(`/phoneNumbers/${phoneNumber}`).set({
                            roomCode: roomCode,
                        });
                        break;
                    }
                    catch (err) {
                        continue;
                    }
                }
                twilioFunctions_1.sendMessage(`Your room code is ${roomCode}`, phoneNumber);
                // we can also pass the token to the browser to make requests from there
                res.redirect('/#' +
                    querystring.stringify({
                        access_token: access_token,
                        refresh_token: refresh_token,
                    }));
            }
            else {
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token',
                    }));
            }
        });
    }
});
router.get('/refresh_token', function (req, res) {
    // requesting access token from refresh token
    if (typeof req.query.refresh_token === 'string') {
        refresh_token = req.query.refresh_token;
    }
    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            Authorization: 'Basic ' +
                Buffer.from(client_id + ':' + client_secret).toString('base64'),
        },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token,
        },
        json: true,
    };
    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            access_token = body.access_token;
            res.send({
                access_token: access_token,
            });
        }
    });
});
