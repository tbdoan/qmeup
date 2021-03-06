"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express"); // Express web server framework
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const spotifyRoutes_1 = require("./routes/spotifyRoutes");
const twilioRoutes_1 = require("./routes/twilioRoutes");
app
    .use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser())
    .use('/', spotifyRoutes_1.router)
    .use('/', twilioRoutes_1.router);
app.get('/', (req, res) => {
    res.send('Success! You can close this now.');
});
const server = app.listen(8080, () => {
    const serverAddress = server.address();
    let host = '';
    let port = 0;
    if (typeof serverAddress == 'object') {
        host = serverAddress.address;
        port = serverAddress.port;
    }
    console.log(`Example app listening at http://${host}:${port}`);
});
