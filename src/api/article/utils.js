import fromPairs from 'lodash/fromPairs';
import omit from 'lodash/omit';

import { getImageUrl } from 'services/fibery/getters';
import { parseSoundcloudUrl } from 'services/soundcloud';
import parseYoutubeUrl from 'lib/utils/parseYoutubeUrl';
import { TOPIC_SLUGS } from 'constants/topic';

import Article, { DEFAULT_COLOR, DEFAULT_THEME } from './article.model';

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
        data[topic].map(({ slug, fiberyId, fiberyPublicId, ...content }) => ({
          slug,
          fiberyId,
          fiberyPublicId,
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

const mapCollection = c => {
  if (!c.cover) {
    return c;
  }
  const [{ secret } = {}] = c.cover.files;
  return { ...c, cover: getImageUrl(secret) };
};

const mapVideo = ({ url }) => {
  const id = parseYoutubeUrl(url);
  return { platform: 'youtube', id, url };
};

const mapAudio = async ({ url }) => {
  const id = await parseSoundcloudUrl(url);
  return { platform: 'soundcloud', id, url };
};

// filter out locales without `slug`
const filterLocales = o => fromPairs(Object.entries(o).filter(([_, v]) => v && v.slug));

const getType = ({ video, audio }) => {
  if (video) {
    return 'video';
  }
  if (audio) {
    return 'audio';
  }
  return 'text';
};

// `fibery` -> `wir` mapper
export const mapFiberyArticle = async ({ cover, collection, locales, video, audio, ...rest }) => ({
  ...omit(rest, TOPIC_SLUGS),
  ...mapCover(cover || {}),
  collection: mapCollection(collection),
  tags: mapTags(rest),
  locales: filterLocales(locales),
  video: video && mapVideo(video),
  audio: audio && (await mapAudio(audio)),
  // FIXME:
  articleId: rest.fiberyId,
  active: true,
  type: getType({ video, audio }),
});

export const getArticle = async data => {
  const { fiberyId } = data;
  const article = await Article.findOne({ fiberyId });
  return article || Article(data);
};
