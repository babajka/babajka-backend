import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';

import brandRoutes from 'api/article/brand';
import collectionRoutes from 'api/article/collection';
import * as controller from './controller';
import Article from './article.model';
import ArticleBrand from './brand/model';
import ArticleCollection from './collection/model';

const router = Router();

router.use('/brands', brandRoutes);
router.use('/collections', collectionRoutes);

router.get('/', controller.getAll);
router.post('/', requireAuth, verifyPermission('canCreateArticle'), controller.create);
router.get('/:slug', controller.getOne);
router.put('/:slug', requireAuth, verifyPermission('canCreateArticle'), controller.update);
router.delete('/:slug', requireAuth, verifyPermission('canCreateArticle'), controller.remove);

export { Article, ArticleBrand, ArticleCollection };
export default router;
