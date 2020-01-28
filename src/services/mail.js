import Mailchimp from 'mailchimp-api-v3';

import { getMD5Hash, sendJson } from 'utils/api';

// Proxy class for mail server.
export class MailProxy {
  constructor(mailConfig) {
    const { apiKey, listId } = mailConfig.mailchimp;
    this.mailchimp = new Mailchimp(apiKey);
    this.listId = listId;
  }

  // Updates/creates an entry of 'emailAddress' in the mailing list:
  // - If 'emailAddress' is in the mailing list,
  // updates its status (subscribed/unsubscribed) and preferred language.
  // - If 'emailAddress' is not in the mailing list,
  // creates new entry with the given status and preferred language.
  //
  // Returns status and preferred language of the updated/created entry.
  sendUpdate(req, res, next) {
    const { emailAddress, userStatus, language } = req.body;
    const memberURL = `lists/${this.listId}/members/${getMD5Hash(
      emailAddress.trim().toLowerCase()
    )}`;
    this.mailchimp
      .put(memberURL, { email_address: emailAddress, status: userStatus, language })
      .then(mailRes => {
        sendJson(res)({
          userStatus: mailRes.status,
          language: mailRes.language,
          emailAddress: mailRes.email_address,
        });
      })
      .catch(next);
  }
}
