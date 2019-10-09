const DEFAULT_THEME = 'light';

export default joi => ({
  name: 'theme',
  base: joi
    .string()
    .valid(['light', 'dark'])
    .default(DEFAULT_THEME)
    .meta({ type: String }),
});
