/* eslint-disable import/prefer-default-export */

export const sendJson = (res, status = 200) => data => res.status(status).json(data);
