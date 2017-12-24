import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import cors from 'cors';
import path from 'path';

import api from 'api';
import config from 'config';
import getLogger from 'config/logger';
import auth, { passport } from 'auth';
import { sendJson } from 'utils/api';

export const publicPath = path.resolve(`${__dirname}/../`, config.publicPath);
const app = express();

app.set('trust proxy', config.trustProxy);
app.use(cors());
app.use(getLogger());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session(config.session));
app.use(express.static(publicPath));
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', auth);
app.use('/api', api);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.message);
  sendJson(res, err.status || 500)({ error: err.message });
});

export default app;
