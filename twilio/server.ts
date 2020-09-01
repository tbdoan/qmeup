import http = require('http');
import express = require('express');
import session = require('express-session');
import bodyParser = require('body-parser');
const MessagingResponse = require('twilio').twiml.MessagingResponse;

const app = express();

app.use(
  session({
    secret: 'anything-you-want-but-keep-secret',
    resave: false,
    saveUninitialized: false,
  }),
  bodyParser.urlencoded({ extended: false })
);

app.post('/sms', (req, res) => {
  const smsCount = req.session.counter || 0;
  console.log(req.body.Body);
  fetch('localhost:8888/login');
  let message = 'Hello, welcome this is your first message!';

  if (smsCount > 0) {
    message = 'Hello, thanks for message number ' + (smsCount + 1);
  }

  req.session.counter = smsCount + 1;

  const twiml = new MessagingResponse();
  twiml.message(message);
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

http.createServer(app).listen(1337, () => {
  console.log('Express server listening on port 1337');
});
