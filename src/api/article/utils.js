import fromPairs from 'lodash/fromPairs';
import omit from 'lodash/omit';

import { getImageUrl } from 'services/fibery/getters';
import { TOPIC_SLUGS } from 'constants/topic';
import { DEFAULT_COLOR, DEFAULT_THEME } from './article.model';

const IMAGE_TYPE_REGEX = /(horizontal|page|vertical)/;

const mapCover = ({ color, theme, files = [] }) => {
  const images = files.reduce((acc, { name, secret }) => {
    const [type] = IMAGE_TYPE_REGEX.exec(name) || [];

    if (type) {
      acc[type] = getImageUrl(secret);
    }

    return acc;
  }, {});
  return { images, color: color || DEFAULT_COLOR, theme: theme || DEFAULT_THEME };
};

const mapTagContent = tag => {
  if (!tag.image) {
    return tag;
  }
  const [{ secret } = {}] = tag.image.files;
  return { ...tag, image: getImageUrl(secret) };
};

const mapTags = data =>
  TOPIC_SLUGS.reduce(
    (acc, topic) =>
      acc.concat(
        data[topic].map(({ slug, ...content }) => ({
          slug,
          content: mapTagContent(content),
          topic: {
            // FIXME
            _id: topic,
            slug: topic,
          },
        }))
      ),
    []
  );

// filter out locales without `slug`
const filterLocales = o => fromPairs(Object.entries(o).filter(([_, v]) => v && v.slug));

// `fibery` -> `wir` mapper
export const mapFiberyArticle = ({ cover, locales, ...rest }) => ({
  ...omit(rest, TOPIC_SLUGS),
  ...mapCover(cover || {}),
  tags: mapTags(rest),
  locales: filterLocales(locales),
  // FIXME:
  articleId: rest.fiberyId,
  active: true,
});
