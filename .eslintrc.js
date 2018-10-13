module.exports = {
  parser: 'babel-eslint',
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier', 'mocha'],
  env: {
    node: true,
    mocha: true,
  },
  rules: {
    // plugins rules
    'prettier/prettier': 'error',
    'mocha/handle-done-callback': 'error',
    'mocha/no-exclusive-tests': 'error',
    'mocha/no-global-tests': 'error',
    'mocha/no-identical-title': 'error',
    'mocha/no-nested-tests': 'error',
    'mocha/no-pending-tests': 'error',
    'mocha/no-return-and-callback': 'error',
    'mocha/no-setup-in-describe': 'error',
    'mocha/no-sibling-hooks': 'error',
    'mocha/no-skipped-tests': 'error',
    'mocha/no-synchronous-tests': 'error',
    'mocha/no-top-level-hooks': 'error',
    'mocha/valid-suite-description': ['warn', '^[A-Z#]'],
    'mocha/valid-test-description': 'warn',

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
