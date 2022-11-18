import HttpError from 'node-http-error';
import HttpStatus from 'http-status-codes';
import fetch from 'node-fetch';

export const makeExternalRequest = async (url, method, bodyObj, headers) => {
  const options = {
    method,
    body: JSON.stringify(bodyObj),
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new HttpError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'failed to perform external HTTP request'
    );
  }

  return response.json();
};
