module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        '*',
        'article',
        'auth',
        'collection',
        'config',
        'core',
        'db',
        'fibery',
        'mail',
        'media',
        'postman',
        'specials',
        'storage',
        'tests',
        'tools',
        'topics-tags',
        'user',
        'utils',
        'files',
        'rss',
        'games',
      ],
    ],
    'scope-empty': [2, 'never'],
    'type-enum': [2, 'always', ['fix', 'style', 'feat', 'chore', 'task', 'major', 'merge', 'temp']],
  },
};
