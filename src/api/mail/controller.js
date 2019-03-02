import config from 'config';

import { MailProxy } from 'services/mail';

// Creates new entry in the mailng list or updates an existing one.
export const updateEmailAddressStatus = (req, res, next) => {
  const mailProxy = new MailProxy(config.services);
  mailProxy.sendUpdate(req, res, next);
};
