import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';

import authorRoutes from 'api/article/author';
import brandRoutes from 'api/article/brand';
import collectionRoutes from 'api/article/collection';
import localeRoutes from 'api/article/localized';

import * as controller from './controller';

import Article from './article.model';
import ArticleBrand from './brand/model';
import ArticleCollection from './collection/model';
import LocalizedArticle from './localized/model';

const router = Router();

router.use('/authors', authorRoutes);
router.use('/brands', brandRoutes);
router.use('/collections', collectionRoutes);

router.use('/localize', localeRoutes);

router.get('/', controller.getAll);
router.post('/', requireAuth, verifyPermission('canCreateArticle'), controller.create);
// slugOrId parameter below either contains ID of an Article or a slug of any Article Localization.
router.get('/:slugOrId', controller.getOne);
router.put('/:slugOrId', requireAuth, verifyPermission('canCreateArticle'), controller.update);
router.delete('/:slugOrId', requireAuth, verifyPermission('canCreateArticle'), controller.remove);

export { Article, ArticleBrand, ArticleCollection, LocalizedArticle };
export default router;
