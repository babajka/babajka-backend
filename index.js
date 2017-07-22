import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';

import api from 'api';
import config from 'config';
import getLogger from 'config/logger';
import connectDb from 'db';

const publicPath = path.join(__dirname, config.publicPath);
const app = express();
connectDb();

app.set('trust proxy', config.trustProxy);
app.use(cors());
app.use(getLogger());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session(config.session));
app.use(express.static(publicPath));

app.use('/api', api);
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err.message); // eslint-disable-line no-console
  res.status(err.status || 500);
  res.send(err.message);
});

createServer(app).listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`); // eslint-disable-line no-console
});
