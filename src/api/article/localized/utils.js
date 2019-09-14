import isEmpty from 'lodash/isEmpty';

import { ValidationError } from 'utils/validation';
import { mapIds } from 'utils/getters';

import LocalizedArticle, { validateLocalization } from './model';

const validate = locales => {
  const errors = locales.reduce((acc, cur) => {
    const err = validateLocalization(cur);
    if (err) {
      acc[cur.locale] = err;
    }
    return acc;
  }, {});
  if (!isEmpty(errors)) {
    throw new ValidationError({ locales: errors });
  }
};

const update = locales =>
  Promise.all(
    // Q: why not `findOneAndUpdate`?
    locales.map(({ articleId, locale, ...rest }) =>
      LocalizedArticle.updateOne({ articleId, locale }, rest, {
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }).exec()
    )
  );

export const updateLocales = async (data, metadata, articleId) => {
  const locales = Object.entries(data).map(([locale, lData]) => ({
    ...lData,
    articleId,
    locale,
    metadata,
  }));
  validate(locales);
  await update(locales);
  return LocalizedArticle.find({ articleId }).then(mapIds);
};
