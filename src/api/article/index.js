import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';

import brandRoutes from 'api/article/brand';
import collectionRoutes from 'api/article/collection';
import dataRoutes from 'api/article/localized';

import * as controller from './controller';

import Article from './article.model';
import ArticleBrand from './brand/model';
import ArticleCollection from './collection/model';
import LocalizedArticle from './localized/model';

const router = Router();

router.use('/brands', brandRoutes);
router.use('/collections', collectionRoutes);

router.use('/localize', dataRoutes);

router.get('/', controller.getAll);
router.post('/', requireAuth, verifyPermission('canCreateArticle'), controller.create);
// slug parameter below is any of Article slugs (any localization).
router.get('/:slug', controller.getOne);
router.put('/:slug', requireAuth, verifyPermission('canCreateArticle'), controller.update);
router.delete('/:slug', requireAuth, verifyPermission('canCreateArticle'), controller.remove);

export { Article, ArticleBrand, ArticleCollection, LocalizedArticle };
export default router;
