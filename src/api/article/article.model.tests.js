import { expect } from 'chai';

import 'db/connect';
import Article from './article.model';
import ArticleType from './type.model';

describe('Article model', async () => {
  try {
    const articleTypeData = { name: 'test' };
    const articleType = new ArticleType(articleTypeData);

    it('should save new article type', async () => {
      const result = await articleType.save();
      expect(result.name).to.equal(articleTypeData.name);
    });

    const articleData = {
      title: 'Test',
      subtitle: 'Subtest.',
      text: {
        eng: 'Hi!:)',
        bel: 'Здароў!:)',
      },
      slug: 'slug',
    };

    it('should save new article', async () => {
      const type = await ArticleType.findOne(articleTypeData);
      // eslint-disable-next-line no-underscore-dangle
      const article = new Article({ ...articleData, type: type._id });
      const result = await article.save();
      expect(result.title).to.equal(articleData.title);
      expect(result.subtitle).to.equal(articleData.subtitle);
      expect(result.slug).to.equal(articleData.slug);
    });

    it('should select article by slug', async () => {
      const result = await Article.findOne({ slug: articleData.slug });
      expect(result.slug).to.equal(articleData.slug);
      expect(result.title).to.equal(articleData.title);
      expect(result.subtitle).to.equal(articleData.subtitle);
    });

    it('should remove article', async () => {
      await Article.remove({ slug: articleData.slug });
      const result = await Article.findOne({ slug: articleData.slug });
      expect(result).to.be.null; // eslint-disable-line no-unused-expressions
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    it('should work without error', () => {
      expect(err).to.be.a(undefined);
    });
  } finally {
    await ArticleType.remove({ name: 'test' });
  }
});
