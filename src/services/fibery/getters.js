import { FILES_PREFIX } from 'services/fibery/constants';

export const getState = o => o['workflow/state']['enum/name'];

export const getImageUrl = secret => secret && `${FILES_PREFIX}${secret}`;
