import set from 'lodash/set';
import identity from 'lodash/identity';

import { map } from 'utils/func';
import { lowerFirst } from 'utils/formatting';

// https://regex101.com/r/nsTMgf/1
const FIELD_REGEX = /.+\/([^-\n]+)(?:-(.+))?/;

const DEFAULT_MAPPING = {
  'fibery/id': 'fiberyId',
  'fibery/public-id': 'fiberyPublicId',
  'fibery/content-type': 'contentType',
};

const defaultMapper = (key, lang = '') => (lang ? `${key}.${lang}` : key);

export const toWirFormat = ({
  mapping = {},
  mapper = defaultMapper,
  formatters = {},
  ignore = [],
} = {}) => o =>
  o &&
  Object.entries(o).reduce((acc, [field, value]) => {
    const [_, key = field, lang] = FIELD_REGEX.exec(field) || [];
    if (ignore.includes(key)) {
      return acc;
    }
    const newKey = DEFAULT_MAPPING[field] || mapping[key] || mapper(lowerFirst(key), lang);
    if (newKey) {
      const format = formatters[newKey] || identity;
      set(acc, newKey, format(value));
    }
    return acc;
  }, {});

export const formatEnum = o => o['enum/name'];

export const IMAGE_FORMATTER = toWirFormat({
  formatters: {
    files: map(toWirFormat()),
  },
});

export const TAG_FORMATTER = toWirFormat({
  mapping: { name: 'slug', Avatar: 'image', Logo: 'image', 'Diary Author Avatar': 'diaryImage' },
  formatters: {
    image: IMAGE_FORMATTER,
    diaryImage: IMAGE_FORMATTER,
  },
});

export const TAGS_FORMATTER = map(TAG_FORMATTER);
