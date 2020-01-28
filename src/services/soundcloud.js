import fetch from 'node-fetch';
import qs from 'qs';

import config from 'config';

const getResolveUrl = url =>
  `http://api.soundcloud.com/resolve.json?${qs.stringify({ url, ...config.services.soundcloud })}`;

export const parseSoundcloudUrl = async url => {
  const { id } = await fetch(getResolveUrl(url)).then(res => res.json());
  return id;
};
