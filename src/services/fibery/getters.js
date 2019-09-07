import { FILES_PREFIX } from 'services/fibery/constants';

export const getState = o => o['workflow/state']['enum/name'];

// export const getArticleBaseUrl = publicId =>
//   `https://wir.fibery.io/Content~Marketing/Article/${publicId}`;

export const getImageUrl = secret => secret && `${FILES_PREFIX}${secret}`;
