// Download the helper library from https://www.twilio.com/docs/node/install
// Your Account Sid and Auth Token from twilio.com/console
// DANGER! This is insecure. See http://twil.io/secure
const accountSid = 'ACd45d662702b6b78b44834a2a28ab3ace';
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
require('dotenv/config');

export function sendMessage(message: string, phoneNumber: string): void {
  client.messages
    .create({
      body: message,
      from: '+12058982844',
      to: phoneNumber,
    })
    .then((msg) => console.log(msg.sid));
}
