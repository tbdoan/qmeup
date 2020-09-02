"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express = require("express");
const request = require("request"); // "Request" library
const querystring = require("querystring");
const generateRandomString_js_1 = require("../functions/generateRandomString.js");
require('dotenv/config');
const stateKey = 'spotify_auth_state';
const client_id = process.env.SPOTIFY_CLIENT_ID; // Your client id
const client_secret = process.env.SPOTIFY_CLIENT_SECRET; // Your secret
const redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri
let access_token;
let refresh_token;
const router = express.Router();
exports.router = router;
router.get('/login', function (req, res) {
    const state = generateRandomString_js_1.generateRandomString(16); //for keeping track of state
    res.cookie(stateKey, state);
    // your application requests authorization
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
    if (state === null || state !== storedState) {
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
        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                access_token = body.access_token;
                refresh_token = body.refresh_token;
                console.table({
                    accessToken: access_token,
                    refreshToken: refresh_token,
                });
                const options = {
                    url: 'https://api.spotify.com/v1/me/player/queue?uri=spotify%3Atrack%3A3a1lNhkSLSkpJE4MSHpDu9',
                    headers: {
                        Authorization: 'Bearer ' + access_token,
                        'Content-Length': 0,
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                };
                // use the access token to access the Spotify Web API
                request.post(options, function (error, response, body) {
                    console.log(response);
                });
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
