import fromPairs from 'lodash/fromPairs';
import omit from 'lodash/omit';

import { getImageUrl } from 'services/fibery/getters';
import { parseSoundcloudUrl } from 'services/soundcloud';
import parseYoutubeUrl from 'lib/utils/parseYoutubeUrl';
import { TOPIC_SLUGS } from 'constants/topic';

import Article, { DEFAULT_COLOR, DEFAULT_THEME } from './article.model';

const IMAGE_TYPE_REGEX = /(horizontal|page|vertical)/;
// TODO: remove
const TAG_TEMP_IMAGE = 'https://images.8tracks.com/cover/i/000/799/185/Fixme-8293.jpg';
const ARTICLE_TEMP_COVER = 'https://i.ytimg.com/vi/DoO36MjbFTk/maxresdefault.jpg';
const TEMP_VIDEO_URL = 'https://www.youtube.com/watch?v=2nV-ryyyZWs';
const TEMP_AUDIO_URL = 'https://soundcloud.com/dillonfrancis/fix-me';

const mapCover = ({ color, theme, files = [] }) => {
  let images = files.reduce((acc, { name, secret }) => {
    const [type] = IMAGE_TYPE_REGEX.exec(name) || [];

    if (type) {
      acc[type] = getImageUrl(secret);
    }

    return acc;
  }, {});

  // FIXME:
  if (!files.length) {
    images = {
      horizontal: ARTICLE_TEMP_COVER,
      vertical: ARTICLE_TEMP_COVER,
      page: ARTICLE_TEMP_COVER,
    };
  }

  return { images, color: color || DEFAULT_COLOR, theme: theme || DEFAULT_THEME };
};

const mapTagContent = (data, topic) => {
  if (!data.image) {
    if (['times', 'themes'].includes(topic)) {
      return data;
    }
    return { ...data, image: TAG_TEMP_IMAGE };
  }
  const { files, color } = data.image;
  const [{ secret } = {}] = files;

  const content = { ...data, image: getImageUrl(secret) || TAG_TEMP_IMAGE };
  if (color) {
    content.color = color;
  }
  return content;
};

const mapTags = data =>
  TOPIC_SLUGS.reduce(
    (acc, topic) =>
      acc.concat(
        data[topic].map(({ slug, fiberyId, fiberyPublicId, ...content }) => ({
          slug,
          fiberyId,
          fiberyPublicId,
          content: mapTagContent(content, topic),
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
  if (!c || !c.cover) {
    return c;
  }
  const [{ secret } = {}] = c.cover.files;
  return { ...c, cover: getImageUrl(secret) || TAG_TEMP_IMAGE };
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
export const mapFiberyArticle = async ({ cover, collection, locales, video, audio, ...rest }) => ({
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
});

export const getArticle = async data => {
  const { fiberyId } = data;
  const article = await Article.findOne({ fiberyId });
  return article || Article(data);
};
