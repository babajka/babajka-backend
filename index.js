import express from 'express';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';

import api from './src/api';
import config from './src/config';

const publicPath = path.join(__dirname, config.publicPath);
const app = express();

app.use(cors());
app.use(logger('dev')); // todo add switch to production mode
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
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
  console.log('Server running at http://localhost:3000'); // eslint-disable-line no-console
});
