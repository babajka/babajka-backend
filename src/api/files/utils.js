import config from 'config';
import { getFileUrl } from 'services/fibery/getters';

const { host, token } = config.services.fibery;

export const getFilesHeaders = secret => ({
  url: `https://${host}${getFileUrl(secret)}`,
  headers: { Authorization: `Token ${token}` },
});
