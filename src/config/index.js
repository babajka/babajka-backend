import config from 'config/config.json';

config.port = process.env.PORT || config.port;

export default config;
