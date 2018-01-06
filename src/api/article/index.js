import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';
import * as controller from './controller';
import Article from './article.model';
import ArticleBrand from './brand.model';

const router = Router();

router.get('/', controller.getAllArticles);
router.post('/', requireAuth, verifyPermission('canCreateArticle'), controller.createArticle);
router.get('/:slug', controller.getOneArticle);
router.put('/:slug', requireAuth, verifyPermission('canCreateArticle'), controller.updateArticle);
router.delete(
  '/:slug',
  requireAuth,
  verifyPermission('canCreateArticle'),
  controller.removeArticle
);

router.get('/brands', controller.getAllBrands);

/* router.get('/collections/', controller.getAllCollections);
router.get('/collections/:slug', controller.getOneCollection);
router.post(
  '/collections/',
  requireAuth,
  verifyPermission('canCreateArticle'),
  controller.createCollection
);
router.put(
  '/collections/:slug',
  requireAuth,
  verifyPermission('canCreateArticle'),
  controller.updateCollection
);
router.delete(
  '/collections/:slug',
  requireAuth,
  verifyPermission('canCreateArticle'),
  controller.removeCollection
); */

export { Article, ArticleBrand };
export default router;
