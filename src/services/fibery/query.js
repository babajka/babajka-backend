import { addAppName, mapAppNameLocales } from './utils';

export const FIBERY_DEFAULT = ['fibery/id', 'fibery/public-id'];

export const ARTICLE_FIELDS = ['Title', 'Subtitle', 'Slug'];

export const STATE = { 'workflow/state': ['enum/name'] };

const TAGS_LOCALIZED_FIELDS = {
  Authors: ['FirstName', 'LastName', 'Bio'],
  Brands: ['Title'],
  Times: ['Title'],
  Personalities: ['Name', 'Subtitle', 'Description'],
  Locations: ['Title'],
};

export const TAGS = Object.entries(TAGS_LOCALIZED_FIELDS).reduce((acc, [key, fields]) => {
  acc.push({
    [`user/${key}`]: {
      'q/select': FIBERY_DEFAULT.concat(addAppName('name'), mapAppNameLocales(fields)),
      'q/limit': 'q/no-limit',
    },
  });
  return acc;
}, []);

const RELATED_ENT_FIELDS = {
  Collection: mapAppNameLocales(['Name', 'Description']).concat(addAppName('Slug')),
  Video: addAppName('Youtube Link'),
  Podcast: addAppName('SoundCloud Link'),
};

export const RELATED_ENTITIES = Object.entries(RELATED_ENT_FIELDS).reduce((acc, [key, fields]) => {
  acc.push({
    [`user/${key}`]: FIBERY_DEFAULT.concat(fields),
  });
  return acc;
}, []);
