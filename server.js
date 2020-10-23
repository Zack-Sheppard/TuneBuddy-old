// TuneBuddy
// Author: Zack Sheppard

//      --- Node modules ---

// Vroom
const express = require('express');
const app = express();

// Networking
const qs = require('qs');
const axios = require('axios');

// for app, for express
const cors = require('cors');
const cookieParser = require('cookie-parser');

//      --- seludom edoN ---


// Environment variables
const hostname = '127.0.0.1';
const port = 3000;

// Spotify secrets
const secrets = require('./config/shhhh');
const client_id = secrets.client_id;
const client_secret = secrets.client_secret;

// Spotify will redirect to this URI after authentication
const redirect_uri = 'http://localhost:3000/callback';
const stateKey = 'spotify_auth_state';

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
const generateRandomString = function(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

app.get('/login', function(req, res) {

    const state = generateRandomString(16);
    res.cookie(stateKey, state);

    // permissions granted to TuneBuddy
    const scope = 'user-read-private user-read-email streaming user-read-playback-state';
    res.redirect('https://accounts.spotify.com/authorize?' +
        qs.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
    }));
});

app.get('/callback', function(req, res) {

    // request refresh and access tokens after checking state
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            qs.stringify({
                error: 'state_mismatch'
        }));
    }
    else {
        res.clearCookie();

        // Without headers
        const authOptions = {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code',
            client_id: client_id,
            client_secret: client_secret
        };

        console.log("POSTing to Spotify  ... ");
        axios.post('https://accounts.spotify.com/api/token', qs.stringify(authOptions))
        .then(resp => {
            console.log("Spotify replied with tokens:");
            const access_token = resp.data.access_token,
                  refresh_token = resp.data.refresh_token;

            console.log(`access token: ${access_token}`);
            console.log(`refresh token: ${refresh_token}`);
            // we can pass the tokens to the browser to make requests from there
            res.redirect('/#' +
                qs.stringify({
                access_token: access_token,
                refresh_token: refresh_token
            }));
        })
        .catch(error => {
            console.error(error);
        });
    }
});

app.listen(port);
console.log(`Listening on ${port}`);
