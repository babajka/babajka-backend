import set from 'lodash/set';
import identity from 'lodash/identity';

import { map } from 'utils/func';
import { lowerFirst, snakeToCamel } from 'utils/formatting';

import { CONSTRUCTOR_BLOCKS } from './constants';

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
    theme: formatEnum,
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

const getCellContent = row => {
  const {
    // type: table_row
    content: [
      {
        // type: table_cell
        content: tableCell,
      },
    ],
  } = row;

  // type: heading, type: paragraph -> to array of it content
  return tableCell.reduce((acc, { content }) => acc.concat(content), []);
};

const getTextCellContent = row => {
  const [
    {
      // type: text
      text: textContent,
    },
  ] = getCellContent(row);
  return textContent.toLowerCase();
};

const getEntityListCellContent = row =>
  getCellContent(row).reduce((acc, obj) => {
    if (obj.type !== 'entity') {
      return acc;
    }
    acc.push(obj.attrs.id);
    return acc;
  }, []);

const CONTENT_GETTERS = {
  text: getTextCellContent,
  entities: getEntityListCellContent,
};

const processDocumentConstructorBlock = block => {
  if (block.type !== 'table') {
    return null;
  }
  const resolvedBlock = {};
  const [rowName, rowParams, rowContent] = block.content;

  const blockName = getTextCellContent(rowName);
  if (!Object.keys(CONSTRUCTOR_BLOCKS).includes(blockName)) {
    throw new Error(`block with invalid name: ${blockName}`);
  }
  resolvedBlock.type = snakeToCamel(blockName);

  const paramsType = CONSTRUCTOR_BLOCKS[blockName].params;
  if (rowParams && paramsType) {
    resolvedBlock.params = CONTENT_GETTERS[paramsType](rowParams);
  }

  if (rowContent && blockName !== 'diary' && blockName !== 'banner') {
    resolvedBlock.entities = getEntityListCellContent(rowContent);
  }

  return resolvedBlock;
};

export const processDocumentConstructor = rawDocumentContent =>
  rawDocumentContent.map(processDocumentConstructorBlock).filter(Boolean);
