/* eslint-disable import/prefer-default-export */

export const sendJson = (res, status) => data => res.status(status || 200).json(data);
