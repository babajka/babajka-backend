import { createServer } from 'http';
import config from 'config';
import app from 'server';
import connectDb from 'db';

connectDb();
createServer(app).listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`); // eslint-disable-line no-console
});
