import fs from 'fs';
import commandLineArgs from 'command-line-args';

const optionDefinitions = [
  { name: 'secretPath', type: String },
  { name: 'imagesDir', type: String },
  { name: 'staticDir', type: String },
  // Arguments below are for helper db scripts.
  { name: 'userEmail', type: String },
  { name: 'userRole', type: String },
  { name: 'newPassword', type: String },
];

const args = commandLineArgs(optionDefinitions, { partial: true });
const {
  secretPath,
  imagesDir = 'images',
  staticDir = 'static',
  userEmail,
  userRole,
  newPassword,
} = args;

export const AUDIO_SUBDIR = '/audio';
export const audioDir = `${staticDir}${AUDIO_SUBDIR}`;
export const rssDir = `${staticDir}/rss`;

[imagesDir, staticDir, audioDir, rssDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

export { secretPath, imagesDir, staticDir, userEmail, userRole, newPassword };
