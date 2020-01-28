const loader = require('esm')(module, { cjs: true });

loader('module-alias/register');

module.exports = loader('./index.js');
