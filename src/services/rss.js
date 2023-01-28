import fs from 'fs';
import RSS from 'rss';

import Article, { getDefaultArticleQuery } from 'api/article/article.model';
import { getSomeLocale } from 'api/article/utils';
import { Tag } from 'api/tag';
import { mapTagsByTopic, mapToString } from 'api/tag/utils';
import { rssDir } from 'utils/args';

const RSS_ARTICLES_FILENAME = `${rssDir}/articles.rss.xml`;
const RSS_PODCASTS_FILENAME = `${rssDir}/podcasts.rss.xml`;

const HOST = 'https://wir.by';
const EMAIL = 'wir.help@gmail.com';
const ITUNES_CATEGORY = 'Education';
const ITUNES_SUBCATEGORY = 'Courses';
const ITUNES_AUTHOR = 'Wir.by';
const ITUNES_OWNER = 'Wir Team';
const DESCRIPTION =
  'Асветніцкая пляцоўка пра беларускую і сусветную культуру з артыкуламі, лекцыямі даследчыкаў, гульнямі і спецпраектамі';
const COVER =
  'https://res.cloudinary.com/wir-by/image/upload/f_auto,q_auto/v1588427207/production/meta/preview-square-compressed.png';

const getRssOptions = options => ({
  title: 'Wir.by — Беларуская і сусветная культура',
  description: DESCRIPTION,
  site_url: HOST,
  generator: HOST,
  image_url: COVER,
  copyright: `© Wir.by, ${new Date().getFullYear()}`,
  managingEditor: `${EMAIL} (${ITUNES_OWNER})`,
  webMaster: 'wir.development@gmail.com (Wir Dev Team)',
  language: 'be',
  categories: [ITUNES_CATEGORY, ITUNES_SUBCATEGORY],
  ...options,
});

const generatePodcastsFeed = async () => {
  const audioArticles = await Article.customQuery({
    query: {
      ...getDefaultArticleQuery(),
      type: 'audio',
      audio: { $exists: true },
    },
    sort: { publishAt: 'desc' },
  });

  const feed = new RSS(
    getRssOptions({
      feed_url: `${HOST}/rss/podcasts/`,
      custom_namespaces: {
        itunes: 'http://www.itunes.com/dtds/podcast-1.0.dtd',
        googleplay: 'http://www.google.com/schemas/play-podcasts/1.0',
      },
      custom_elements: [
        { 'itunes:author': ITUNES_AUTHOR },
        { 'googleplay:author': ITUNES_AUTHOR },
        { 'itunes:summary': DESCRIPTION },
        {
          'itunes:owner': [{ 'itunes:name': ITUNES_OWNER }, { 'itunes:email': EMAIL }],
        },
        { 'itunes:image': { _attr: { href: COVER } } },
        { 'googleplay:image': { _attr: { href: COVER } } },
        {
          'itunes:category': [
            {
              _attr: {
                text: ITUNES_CATEGORY,
              },
            },
            {
              'itunes:category': {
                _attr: {
                  text: ITUNES_SUBCATEGORY,
                },
              },
            },
          ],
        },
        { 'itunes:explicit': 'no' },
      ],
    })
  );

  audioArticles.forEach(article => {
    const localized = getSomeLocale(article);
    const { collection } = article;
    const { source, mimeType: type, size, duration } = article.audio;
    const { podcast } = article.images;
    const { slug, subtitle } = localized;
    let { title } = localized;

    if (!source) {
      console.error(`[generatePodcastsFeed]: ${slug} article missing audio source`);
      return;
    }
    const url = `${HOST}/article/${slug}/`;
    const { themes = [], authors = [] } = mapTagsByTopic(article.tags);
    const [author] = mapToString(authors);

    const podcastCover = podcast || (collection && collection.podcastCover);
    const image = podcastCover ? `${HOST}${podcastCover}` : COVER;

    if (collection) {
      title = `${title} (${collection.name.be}, #${collection.articleIndex + 1})`;
    }

    feed.item({
      title,
      description: subtitle,
      url,
      categories: mapToString(themes, 'en'),
      author,
      date: article.publishAt,
      enclosure: { url: `${HOST}${source}`, type, size },
      custom_elements: [
        { 'itunes:author': author || ITUNES_AUTHOR },
        { 'itunes:subtitle': subtitle },
        {
          'itunes:image': {
            _attr: { href: image },
          },
        },
        { 'itunes:duration': duration },
      ],
    });
  });

  return feed.xml();
};

const generateArticlesFeed = async () => {
  const categories = mapToString(await Tag.find({ topicSlug: 'themes' }), 'en');
  const articles = await Article.customQuery({
    query: getDefaultArticleQuery(),
    sort: { publishAt: 'desc' },
  });

  const feed = new RSS(
    getRssOptions({
      feed_url: `${HOST}/rss/`,
      categories,
    })
  );

  articles.forEach(article => {
    const localized = getSomeLocale(article);
    const { page, horizontal } = article.images;
    const { title, slug, subtitle } = localized;
    const url = `${HOST}/article/${slug}/`;

    const { themes = [], authors = [] } = mapTagsByTopic(article.tags);
    const [author] = mapToString(authors);

    feed.item({
      title,
      description: subtitle,
      url,
      categories: mapToString(themes, 'en'),
      author,
      date: article.publishAt,
      enclosure: { type: 'image/png', url: `${HOST}${page || horizontal}` },
    });
  });

  return feed.xml();
};

const saveArticlesFeed = rss => fs.promises.writeFile(RSS_ARTICLES_FILENAME, rss);
const savePodcastsFeed = rss => fs.promises.writeFile(RSS_PODCASTS_FILENAME, rss);

export default {
  generateArticlesFeed,
  generatePodcastsFeed,
  saveArticlesFeed,
  savePodcastsFeed,
};
