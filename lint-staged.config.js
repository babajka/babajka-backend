module.exports = {
  '**/*.js': ['npm run prettier', 'eslint --fix', 'git add'],
  '**/*.md': ['npm run prettier', 'git add'],
};
