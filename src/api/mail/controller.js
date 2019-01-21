import { sendJson } from 'utils/api';
import config from 'config';
import HttpError from 'node-http-error';
import HttpStatus from 'http-status-codes';

const Mailchimp = require('mailchimp-api-v3');
const md5 = require('md5');

export const getEmailAddressHash = emailAddress => md5(emailAddress.trim().toLowerCase());

export const updateEmailAddressStatus = (req, res, next) => {
  const { apiKey, listId } = config.mail.mailchimp;
  const mailchimp = new Mailchimp(apiKey);
  const { emailAddress, userStatus, language } = req.body;

  try {
    if (!(emailAddress && userStatus && language))
      throw new HttpError(
        HttpStatus.BAD_REQUEST,
        'emailAddress, userStatus and language must be specified.'
      );

    const memberURL = `lists/${listId}/members/${getEmailAddressHash(emailAddress)}`;
    mailchimp
      .put(memberURL, { email_address: emailAddress, status: userStatus, language })
      .then(response => {
        sendJson(res)({
          message: { userStatus: response.status, language: response.language },
        });
      })
      .catch(err => {
        next(err);
      });
  } catch (err) {
    next(err);
  }
};

export default updateEmailAddressStatus;
