import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import HttpStatus from 'http-status-codes';

import api from 'api';
import config from 'config';
import getLogger from 'config/logger';
import auth, { passport } from 'auth';
import { sendJson } from 'utils/api';
import { staticDir } from 'utils/args';

export const publicPath = path.resolve(`${__dirname}/../`, config.publicPath);
const app = express();

process.on('uncaughtException', err => {
  console.error('Uncaught Exception: ', err);
});

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection: Promise:', p, 'Reason:', reason);
});

app.set('trust proxy', config.trustProxy);
app.use(cors());
app.use(getLogger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session(config.session));
app.use(express.static(publicPath));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(staticDir));
app.use('/auth', auth);
app.use('/api', api);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (!err.status) {
    // log only 500 errors
    console.error(err.message);
    if (process.env.NODE_ENV !== 'production') {
      console.error(err.stack);
    }
  }
  sendJson(res, err.status || HttpStatus.INTERNAL_SERVER_ERROR)({ error: err.message });
});

export default app;
