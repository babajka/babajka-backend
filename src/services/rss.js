import fs from 'fs';
import RSS from 'rss';

import Article, { DEFAULT_ARTICLE_QUERY } from 'api/article/article.model';
import { getSomeLocale } from 'api/article/utils';
import { Tag } from 'api/tag';
import { mapTagsByTopic, mapToString } from 'api/tag/utils';
import { rssDir } from 'utils/args';

const RSS_ARTICLES_FILENAME = `${rssDir}/articles.rss.xml`;
const RSS_PODCASTS_FILENAME = `${rssDir}/podcasts.rss.xml`;

// FIXME
const HOST = 'https://wir.by';
const description =
  'Асветніцкая пляцоўка пра беларускую і сусветную культуру з артыкуламі, лекцыямі даследчыкаў, гульнямі і спецпраектамі';
const cover = 'https://res.cloudinary.com/wir-by/image/upload/v1550513082/logo/W.png';

const getRssOptions = options => ({
  title: 'Wir.by',
  description,
  site_url: HOST,
  generator: HOST,
  image_url: cover,
  copyright: `© Wir.by, ${new Date().getFullYear()}`,
  managingEditor: 'hello@wir.by (Wir Team)',
  webMaster: 'ivan@wir.by (Ivan Pazhitnykh)',
  language: 'be',
  ...options,
});

const generatePodcastsFeed = async () => {
  const audioArticles = await Article.customQuery({
    query: {
      ...DEFAULT_ARTICLE_QUERY(),
      type: 'audio',
      audio: { $exists: true },
    },
    sort: { publishAt: 'desc' },
  });

  const itunesAuthor = 'Wir.by';
  const itunesTitle = 'Wir.by Podcasts';

  const feed = new RSS(
    getRssOptions({
      feed_url: `${HOST}/rss/podcasts/`,
      custom_namespaces: {
        itunes: 'http://www.itunes.com/dtds/podcast-1.0.dtd',
        googleplay: 'http://www.google.com/schemas/play-podcasts/1.0',
      },
      // FIXME:
      custom_elements: [
        { 'itunes:subtitle': itunesTitle },
        { 'itunes:author': itunesAuthor },
        { 'googleplay:author': itunesAuthor },
        { 'itunes:summary': description },
        {
          'itunes:owner': [{ 'itunes:name': 'Wir Team' }, { 'itunes:email': 'hello@wir.by' }],
        },
        { 'itunes:image': { _attr: { href: cover } } },
        { 'googleplay:image': { _attr: { href: cover } } },
        { 'itunes:category': [{ _attr: { text: 'Education' } }] },
      ],
    })
  );

  audioArticles.forEach(article => {
    const localized = getSomeLocale(article);
    const { source, mimeType: type, size, duration } = article.audio;
    const { horizontal } = article.images;
    const { title, slug, subtitle } = localized;
    if (!source) {
      console.error(`[generatePodcastsFeed]: ${slug} article missing audio source`);
      return;
    }
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
      enclosure: { url: `${HOST}${source}`, type, size },
      custom_elements: [
        { 'itunes:author': author || itunesAuthor },
        { 'itunes:subtitle': subtitle },
        { 'itunes:image': { _attr: { href: `${HOST}${horizontal}` } } },
        { 'itunes:duration': duration },
      ],
    });
  });

  return feed.xml();
};

const generateArticlesFeed = async () => {
  const categories = mapToString(await Tag.find({ topicSlug: 'themes' }), 'en');
  const articles = await Article.customQuery({
    query: DEFAULT_ARTICLE_QUERY(),
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
