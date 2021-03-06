import { Router } from 'express';

import { requireAuth, verifyPermission } from 'auth';
import { requireFieldsAny } from 'utils/validation';

import * as controller from './controller';

import Article, { queryUnpublished } from './article.model';
import ArticleCollection from './collection/model';
import LocalizedArticle from './localized/model';

const router = Router();

router.get('/', controller.getAll);
// slugOrId parameter below either contains ID of an Article or a slug of any Article Localization.
router.get('/:slugOrId', controller.getOne);

router.post(
  '/fibery/preview',
  requireAuth,
  requireFieldsAny('url', 'fiberyPublicId'),
  controller.fiberyPreview
);

router.post(
  '/fibery/import',
  requireAuth,
  verifyPermission('canCreateArticle'),
  requireFieldsAny('url', 'fiberyPublicId'),
  controller.fiberyImport
);

export { Article, ArticleCollection, LocalizedArticle, queryUnpublished };
export default router;
