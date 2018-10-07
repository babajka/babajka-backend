module.exports = {
  parser: 'babel-eslint',
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier'],
  env: {
    node: true,
    mocha: true,
  },
  rules: {
    'prettier/prettier': 'error',
    // we use named export in utils
    'import/prefer-default-export': 'off',
    // disable comma-dangle in functions
    'comma-dangle': [
      'error',
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        functions: 'never',
      },
    ],
    // allow `console.error` & `console.warning`
    'no-console': ['error', { allow: ['warn', 'error'] }],
    // `_id` comes from Mongo
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
  },
  settings: {
    'import/resolver': {
      'babel-module': {},
    },
  },
};
