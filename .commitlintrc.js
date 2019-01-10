module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        '*',
        'core',
        'tools',
        'utils',
        'tests',
        'auth',
        'user',
        'article',
        'collection',
        'brand',
        'specials',
        'config',
        'db',
        'storage',
      ],
    ],
    'scope-empty': [2, 'never'],
    'type-enum': [2, 'always', ['fix', 'style', 'feat', 'chore', 'task', 'major', 'merge']],
  },
};
