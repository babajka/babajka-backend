import config from './config.json';

config.port = process.env.PORT || config.port;

export default config;
