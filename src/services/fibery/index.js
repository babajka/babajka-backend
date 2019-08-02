import Fibery from 'fibery-unofficial';

import config from 'config';
import { ValidationError } from 'utils/validation';

import { getArticlePublicId, addAppName } from './utils';
import { FIBERY_DEFAULT } from './query';

const fibery = new Fibery(config.services.fibery);

const getArticleData = async url => {
  const publicId = getArticlePublicId(url);
  if (!publicId) {
    throw new ValidationError({ url: 'invalid' });
  }

  const [article] = await fibery.entity.query(
    {
      'q/from': addAppName('Article'),
      'q/select': FIBERY_DEFAULT,
      'q/where': ['=', 'fibery/public-id', '$id'],
      'q/limit': 1,
    },
    {
      $id: publicId,
    }
  );

  return article;
};

export { getArticleData };
