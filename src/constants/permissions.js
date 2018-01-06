export const user = [];
export const author = [...user, 'canCreateArticle'];
export const contentManager = [...author, 'canManageArticles'];
export const admin = [...contentManager, 'canManageUsers'];
