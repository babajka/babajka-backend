export const cutUrlParams = url => url && url.split('?', 1)[0];

export const joinNames = (firstName, lastName) => {
  const postfix = lastName ? ` ${lastName}` : '';
  return `${firstName}${postfix}`;
};

export const lowerFirst = key => `${key[0].toLowerCase()}${key.slice(1)}`;
