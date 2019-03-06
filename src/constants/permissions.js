// A description of permissions we're using aroung the project:
// * canCreateArticle - the one with this permission is treated as an Author:
//    he/she can create new articles and edit those for which he/she is an author.
// * canManageArticles - the one with this permission is a contentManager:
//    he/she can edit and remove existing articles bun CAN NOT create new.
// * canManageUsers - the one with this permission can create, edit and remove
//    and view the full list of users existing.

export const user = {};
export const author = { ...user, canCreateArticle: true };
export const contentManager = { ...author, canManageArticles: true };
export const admin = { ...contentManager, canManageUsers: true };
