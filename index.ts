import express = require('express'); // Express web server framework
import cors = require('cors');
import cookieParser = require('cookie-parser');

const app = express();
import { router as spotifyRoutes } from './routes/spotifyRoutes';
import { router as twilioRoutes } from './routes/twilioRoutes';

app
  .use(express.static(__dirname + '/public'))
  .use(cors())
  .use(cookieParser())
  .use('/', spotifyRoutes)
  .use('/', twilioRoutes);

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
