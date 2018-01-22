export const sendJson = (res, status = 200) => data => res.status(status).json(data);
