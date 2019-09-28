import fs from 'fs';
import commandLineArgs from 'command-line-args';

const optionDefinitions = [
  { name: 'secretPath', type: String },
  { name: 'imagesDir', type: String },
];

const { secretPath, imagesDir = 'images' } = commandLineArgs(optionDefinitions, { partial: true });

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

export { secretPath, imagesDir };
