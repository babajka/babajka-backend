import fromPairs from 'lodash/fromPairs';
import omit from 'lodash/omit';

import { getImageUrl } from 'services/fibery/getters';
import { parseSoundcloudUrl } from 'services/soundcloud';
import parseYoutubeUrl from 'lib/utils/parseYoutubeUrl';
import { TOPIC_SLUGS } from 'constants/topic';
import { DEFAULT_COLOR } from 'utils/joi/color';

import Article from './article.model';

const IMAGE_TYPE_REGEX = /(horizontal|page|vertical)/;
const BRAND_LOGO_REGEX = /(black|white)/;
const DEFAULT_COVERS = { vertical: null, horizontal: null };
const TEMP_VIDEO_URL = 'https://www.youtube.com/watch?v=2nV-ryyyZWs';
const TEMP_AUDIO_URL = 'https://soundcloud.com/dillonfrancis/fix-me';

const matchImages = (regex, files, initial = {}) =>
  files.reduce(
    (acc, { name, secret }) => {
      const [type] = regex.exec(name) || [];

      if (type) {
        acc[type] = getImageUrl(secret);
      }

      return acc;
    },
    { ...initial }
  );

const mapCover = ({ color, theme, files = [] }) => ({
  images: matchImages(IMAGE_TYPE_REGEX, files, DEFAULT_COVERS),
  color: color || DEFAULT_COLOR,
  theme,
});

const mapImage = image => {
  if (!image) {
    return null;
  }
  const [{ secret } = {}] = image.files;
  return getImageUrl(secret);
};

const mapTagContent = ({ image, diaryImage, ...rest }, topic) => {
  const content = rest;
  // TODO: add `brands`
  if (!['times', 'themes'].includes(topic)) {
    content.image = mapImage(image, topic);
  }
  if (topic === 'personalities') {
    content.diaryImage = mapImage(diaryImage, topic);
  }
  if (topic === 'brands') {
    content.images = matchImages(BRAND_LOGO_REGEX, image.files || []);
  }
  if (image && image.color) {
    content.color = image.color;
  }
  if (image && image.theme) {
    content.theme = image.theme;
  }
  return content;
};

export const getMapTag = topic => ({ slug, fiberyId, fiberyPublicId, ...content }) => ({
  slug,
  fiberyId,
  fiberyPublicId,
  content: mapTagContent(content, topic),
  topic: {
    // FIXME
    _id: topic,
    slug: topic,
  },
  topicSlug: topic,
});

const mapTags = data =>
  TOPIC_SLUGS.reduce((acc, topic) => acc.concat(data[topic].map(getMapTag(topic))), []);

const mapCollection = c => {
  if (!c || !c.cover) {
    return c;
  }
  const [{ secret } = {}] = c.cover.files;
  return { ...c, cover: getImageUrl(secret) };
};

const mapVideo = ({ url }) => {
  if (!url) {
    // eslint-disable-next-line no-param-reassign
    url = TEMP_VIDEO_URL;
  }
  const id = parseYoutubeUrl(url);
  return { platform: 'youtube', id, url };
};

const mapAudio = async ({ url }) => {
  if (!url) {
    // eslint-disable-next-line no-param-reassign
    url = TEMP_AUDIO_URL;
  }
  const id = await parseSoundcloudUrl(url);
  return { platform: 'soundcloud', id, url };
};

// filter out locales without `slug`
const mapLocales = o =>
  fromPairs(
    Object.entries(o)
      .filter(([_, v]) => v && v.slug)
      // change `text` from `null` to `{}`
      .map(([k, v]) => [k, { ...v, text: v.text || {} }])
  );

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
export const mapFiberyArticle = async ({
  cover,
  collection,
  locales,
  video,
  audio,
  publishAt,
  keywords,
  ...rest
}) => ({
  ...omit(rest, TOPIC_SLUGS),
  ...mapCover(cover || {}),
  collection: mapCollection(collection),
  tags: mapTags(rest),
  locales: mapLocales(locales),
  video: video && mapVideo(video),
  audio: audio && (await mapAudio(audio)),
  // FIXME:
  articleId: rest.fiberyId,
  active: true,
  type: getType({ video, audio }),
  publishAt: publishAt && new Date(publishAt),
  keywords: keywords || ' ',
});

export const getArticle = async data => {
  const { fiberyId } = data;
  const article = await Article.findOneAndUpdate({ fiberyId }, data);
  return article || Article(data);
};
