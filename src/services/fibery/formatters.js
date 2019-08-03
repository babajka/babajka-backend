import get from 'lodash/get';
import set from 'lodash/set';
import identity from 'lodash/identity';

import { lowerFirst } from 'utils/formatting';

// https://regex101.com/r/nsTMgf/1
const FIELD_REGEX = /.+\/([^-\n]+)(?:-(.+))?/;

const DEFAULT_MAPPING = {
  'fibery/id': 'fiberyId',
  'fibery/public-id': 'fiberyPublicId',
};

const defaultMapper = (key, lang = '') => (lang ? `${key}.${lang}` : key);

export const toWirFormat = (mapping = {}, mapper = defaultMapper, formatters = {}) => o =>
  Object.entries(o).reduce((acc, [field, value]) => {
    const [_, key, lang] = FIELD_REGEX.exec(field) || [];
    // `get` allow to ignore fields with `false` value in `mapping`
    const newKey = DEFAULT_MAPPING[field] || get(mapping, key, mapper(lowerFirst(key), lang));
    if (newKey) {
      const format = formatters[newKey] || identity;
      set(acc, newKey, format(value));
    }
    return acc;
  }, {});
