import fs from 'fs';
import RSS from 'rss';

import Article, { DEFAULT_ARTICLE_QUERY } from 'api/article/article.model';
import { Tag } from 'api/tag';
import { mapTagsByTopic, mapToString } from 'api/tag/utils';
import { rssDir } from 'utils/args';

export const RSS_FEED_FILENAME = `${rssDir}/articles.rss.xml`;

// FIXE
const HOST = 'https://beta.wir.by';

const getRssOptions = ({ categories }) => ({
  title: 'Wir.by',
  description:
    'Асветніцкая пляцоўка пра беларускую і сусветную культуру з артыкуламі, лекцыямі даследчыкаў, гульнямі і спецпраектамі',
  feed_url: `${HOST}/rss/`,
  site_url: HOST,
  generator: HOST,
  image_url: 'https://res.cloudinary.com/wir-by/image/upload/v1550513082/logo/W.png',
  copyright: `© Wir.by, ${new Date().getFullYear()}`,
  categories,
  managingEditor: 'hello@wir.by (Wir Team)',
  webMaster: 'ivan@wir.by (Ivan Pazhitnykh)',
  language: 'be',
});

export const generateRssFeed = async () => {
  const categories = mapToString(await Tag.find({ topicSlug: 'themes' }), 'en');
  const articles = await Article.customQuery({
    query: DEFAULT_ARTICLE_QUERY(),
    sort: { publishAt: 'desc' },
  });

  const feed = new RSS(getRssOptions({ categories }));

  articles.forEach(article => {
    const localized = article.locales.be || Object.values(article.locales)[0];
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
      enclosure: {
        url: `${HOST}${page || horizontal}`,
        type: 'image/png',
      },
    });
  });

  return feed.xml();
};

export const saveRssFeed = rss => fs.promises.writeFile(RSS_FEED_FILENAME, rss);
