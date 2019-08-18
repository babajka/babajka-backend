const isValid = v => {
  const month = Math.floor(v / 100);
  const day = Math.floor(v % 100);
  return month >= 0 && month <= 12 && day >= 0 && day <= 31;
};

export default joi => ({
  name: 'colloquialDateHash',
  base: joi.number().meta({ type: Number }),
  // v16
  // coerce: {
  //   from: 'string',
  //   method: (_, v) => parseInt(v, 10),
  // },
  // eslint-disable-next-line no-unused-vars
  coerce: (v, state, options) => parseInt(v, 10),
  pre(v, state, options) {
    if (!isValid(v)) {
      return this.createError('number.colloquialDateHash', { v }, state, options);
    }
    return v;
  },
});
