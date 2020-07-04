import fs from 'fs';
import commandLineArgs from 'command-line-args';

const optionDefinitions = [
  { name: 'secret-path', type: String },
  { name: 'images-dir', type: String },
  { name: 'static-dir', type: String },
  // Arguments below are for helper db scripts.
  { name: 'user-email', type: String },
  { name: 'user-role', type: String },
  { name: 'new-password', type: String },
];

const args = commandLineArgs(optionDefinitions, { partial: true });
const {
  'secret-path': secretPath,
  'images-dir': imagesDir = 'images',
  'static-dir': staticDir = 'static',
  'user-email': userEmail,
  'user-role': userRole,
  'new-password': newPassword,
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
