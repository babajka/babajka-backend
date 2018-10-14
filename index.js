import { createServer } from 'http';
import path from 'path';

import config from 'config';
import app, { publicPath } from 'server';
import connectDb from 'db';

connectDb();

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

createServer(app).listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`); // eslint-disable-line no-console
});
