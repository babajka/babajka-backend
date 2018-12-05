import { createServer } from 'http';
import path from 'path';

import config from 'config';
import app, { publicPath } from 'server';
import connectDb from 'db';

connectDb();

app.set('view engine', 'ejs');

app.get('*', (req, res) => {
  res.render(path.join(publicPath, 'index'));
});

createServer(app).listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`); // eslint-disable-line no-console
});
