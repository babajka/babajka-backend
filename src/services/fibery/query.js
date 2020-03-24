import { addAppName, mapAppNameLocales, mapAppName } from './utils';
import { DOC_SECRET_NAME } from './constants';

export const FIBERY_DEFAULT = ['fibery/id', 'fibery/public-id'];

export const ARTICLE_FIELDS = ['Keywords', 'Publication Time'];

export const ARTICLE_LOC_FIELDS = ['Title', 'Subtitle', 'Slug'];

export const ENUM = ['enum/name', 'fibery/rank'];

export const STATE = { 'workflow/state': ENUM };

export const FILES = {
  'Files/Files': {
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

const COLOR_THEME = [
  addAppName('Color'),
  {
    [addAppName('Theme')]: ENUM,
  },
];
const IMAGE = FIBERY_DEFAULT.concat(FILES);
const LOC_PERS_IMAGE_FIELDS = IMAGE.concat(COLOR_THEME);

const TAGS_IMAGES = {
  Authors: {
    'user/Avatar': IMAGE,
  },
  Brands: {
    'user/Logo': IMAGE,
  },
  Personalities: {
    'user/Avatar': LOC_PERS_IMAGE_FIELDS,
    'user/Diary Author Avatar': IMAGE,
  },
  Locations: {
    'user/Image': LOC_PERS_IMAGE_FIELDS,
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
  Podcast: [addAppName('SoundCloud Link'), FILES],
  Cover: COLOR_THEME.concat(FILES),
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

export const DOCUMENT_VIEW = {
  'q/from': 'fibery/view',
  'q/select': FIBERY_DEFAULT.concat('fibery/meta'),
  'q/limit': 1,
  'q/where': ['=', 'fibery/public-id', '$id'],
};
