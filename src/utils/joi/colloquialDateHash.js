const isValid = v => {
  const month = Math.floor(v / 100);
  const day = Math.floor(v % 100);
  return month >= 0 && month <= 12 && day >= 0 && day <= 31;
};

export default joi => ({
  name: 'colloquialDateHash',
  base: joi.number().meta({ type: Number }),
  // eslint-disable-next-line no-unused-vars
  coerce: (v, state, options) => v && +v,
  pre(v, state, options) {
    if (!isValid(v)) {
      return this.createError('number.colloquialDateHash', { v }, state, options);
    }
    return v;
  },
});
