// import fetch from 'node-fetch';
// import qs from 'qs';
//
// import config from 'config';

// FIXME: broken
// const getResolveUrl = url =>
//   `http://api.soundcloud.com/resolve.json?${qs.stringify({ url, ...config.services.soundcloud })}`;
//
// export const parseSoundcloudUrl = async url => {
//   const { id } = await fetch(getResolveUrl(url)).then(res => res.json());
//   return id;
// };

const TRACKS_IDS = {
  'kashubskaya-mova-lyubo-padporynava': 592430019,
  'slezskaya-mova-lyubo-padporynava': 647181825,
  'lemkaskaya-mova-lyubo-padporynava': 612743817,
  'luzhytskya-movy-lyubo-padporynava': 670133363,
  'dzie-zyvuc-dusy-bielarusau': 973709941,
};

export const parseSoundcloudUrl = async url => {
  const key = url.split('/').pop();
  return `${TRACKS_IDS[key]}`;
};
