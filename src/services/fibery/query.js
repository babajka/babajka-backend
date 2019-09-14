import { addAppName, mapAppNameLocales, mapAppName } from './utils';
import { DOC_SECRET_NAME } from './constants';

export const FIBERY_DEFAULT = ['fibery/id', 'fibery/public-id'];

export const ARTICLE_FIELDS = ['Keywords', 'publication-date'];

export const ARTICLE_LOC_FIELDS = ['Title', 'Subtitle', 'Slug'];

export const ENUM = ['enum/name'];

export const STATE = { 'workflow/state': ENUM };

export const FILES = {
  'fibery/files': {
    'q/select': ['id', 'name', 'secret', 'content-type'].map(key => `fibery/${key}`),
    'q/limit': 'q/no-limit',
  },
};

const TAGS_LOCALIZED_FIELDS = {
  Authors: ['FirstName', 'LastName', 'Bio'],
  Brands: ['Title'],
  Themes: ['Title'],
  Times: ['Title'],
  Personalities: ['Name', 'Subtitle', 'Description'],
  Locations: ['Title'],
};

const IMAGE = FIBERY_DEFAULT.concat(FILES);

const TAGS_IMAGES = {
  Authors: {
    'user/Avatar': IMAGE,
  },
  Brands: {
    'user/Logo': IMAGE,
  },
  Personalities: {
    'user/Avatar': IMAGE.concat(addAppName('Color')),
    'user/Diary Author Avatar': IMAGE,
  },
  Locations: {
    'user/Image': IMAGE,
  },
};

export const TAGS = Object.entries(TAGS_LOCALIZED_FIELDS).reduce((acc, [key, fields]) => {
  acc.push({
    [`user/${key}`]: {
      'q/select': FIBERY_DEFAULT.concat(
        addAppName('name'),
        mapAppNameLocales(fields),
        TAGS_IMAGES[key] || []
      ),
      'q/limit': 'q/no-limit',
    },
  });
  return acc;
}, []);

const RELATED_ENT_FIELDS = {
  Collection: mapAppNameLocales(['Name', 'Description'])
    .concat(addAppName('Slug'))
    .concat({
      'user/Cover': IMAGE,
    }),
  Video: addAppName('Youtube Link'),
  Podcast: addAppName('SoundCloud Link'),
  Cover: [
    addAppName('Color'),
    FILES,
    {
      [addAppName('Theme')]: ENUM,
    },
  ],
};

export const RELATED_ENTITIES = Object.entries(RELATED_ENT_FIELDS).reduce((acc, [key, fields]) => {
  acc.push({
    [`user/${key}`]: FIBERY_DEFAULT.concat(fields),
  });
  return acc;
}, []);

export const CONTENT = mapAppNameLocales(['Text']).reduce((acc, key) => {
  acc.push({
    [key]: [DOC_SECRET_NAME],
  });
  return acc;
}, []);

export const DIARY_FIELDS = mapAppName(['Day', 'Year'])
  .concat(
    [
      { Month: ENUM },
      { Locale: ENUM },
      {
        Text: [DOC_SECRET_NAME],
      },
    ].map(o => {
      const [[k, v]] = Object.entries(o);
      return { [addAppName(k)]: v };
    })
  )
  .concat({
    'user/Personality': FIBERY_DEFAULT.concat(
      addAppName('name'),
      mapAppNameLocales(TAGS_LOCALIZED_FIELDS.Personalities),
      TAGS_IMAGES.Personalities
    ),
  });
