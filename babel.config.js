module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '10.0.0',
        },
      },
    ],
  ],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
      },
    ],
  ],
};
