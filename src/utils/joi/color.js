export const DEFAULT_COLOR = '#ffffff';

export default joi => ({
  name: 'color',
  base: joi
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default(DEFAULT_COLOR)
    .meta({ type: String }),
});
