import fs from 'fs';

export const isFileExist = async path => {
  try {
    await fs.promises.access(path, fs.constants.R_OK);
  } catch (err) {
    return false;
  }
  return true;
};
