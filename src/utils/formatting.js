export const cutUrlParams = url => url && url.split('?', 1)[0];

export const joinNames = (firstName, lastName) => {
  const postfix = lastName ? ` ${lastName}` : '';
  return `${firstName}${postfix}`;
};

export const lowerFirst = key => `${key[0].toLowerCase()}${key.slice(1)}`;

const MINSK_OFFSET = 180 * 60 * 1000;

export const getLocalTime = () => new Date(Date.now() + MINSK_OFFSET);

export const snakeToCamel = str =>
  str.replace(/([-_][a-z0-9])/g, group => group.toUpperCase().replace(/[-_]/, ''));
