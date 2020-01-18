import { Router } from 'express';
import RSS from 'rss';

import Article, { DEFAULT_ARTICLE_QUERY } from 'api/article/article.model';
import { Tag } from 'api/tag';
import { mapTagsByTopic, mapToString } from 'api/tag/utils';

// FIXE
const HOST = 'https://beta.wir.by';

const rssFeed = async ({ user }, res, _next) => {
  const categories = mapToString(await Tag.find({ topicSlug: 'themes' }), 'en');

  const feed = new RSS({
    title: 'Wir.by',
    description:
      'Асветніцкая пляцоўка пра беларускую і сусветную культуру з артыкуламі, лекцыямі даследчыкаў, гульнямі і спецпраектамі',
    // FIXME:
    // feed_url: `${HOST}/rss/`,
    feed_url: 'https://api.wir.by/api/rss/next',
    site_url: HOST,
    generator: HOST,
    // FIXME:
    image_url:
      'https://res.cloudinary.com/wir-by/image/upload/c_scale,w_250,f_auto,q_auto/v1550513082/logo/W.png',
    copyright: `© Wir.by, ${new Date().getFullYear()}`,
    categories,
    managingEditor: 'hello@wir.by (Wir Team)',
    webMaster: 'ivan@wir.by (Ivan Pazhitnykh)',
    language: 'be',
  });

  const articles = await Article.customQuery({
    query: DEFAULT_ARTICLE_QUERY(user),
    user,
    sort: { publishAt: 'desc' },
  });

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

  res.contentType('application/xml');
  return res.send(feed.xml({ indent: true }));
};

const router = Router();
router.get('/next', rssFeed);
export default router;
