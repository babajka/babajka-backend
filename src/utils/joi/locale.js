import { LOCALES } from 'constants/misc';

export default joi => ({
  name: 'locale',
  base: joi
    .string()
    .valid(LOCALES)
    .meta({ type: String }),
});
