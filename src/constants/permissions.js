export const user = [];
export const author = [...user, 'canCreateArticle'];
export const contentManager = [...author, 'canManageArticles'];
export const admin = [...contentManager, 'canManageUsers'];

/*
TODO: new field in User model
  permissions: Array of strings
  change initDb method to set permissions from roles ['user', 'author', 'contentManager', 'admin']
 */
