import { ValidationError } from './validation';

// Keys of the object are all supported video plarforms.
// Values are functions checking if ID of the video is (potentially) valid.
export const VIDEO_PLATFORMS = {
  youtube: id => /^[a-zA-Z0-9_-]{11}$/.test(id),
};

const YOUTUBE_URL_REGEX = /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/;

export const parseVideoUrl = videoUrl => {
  const match = YOUTUBE_URL_REGEX.exec(videoUrl);
  if (!match) {
    throw new ValidationError('errors.badVideoUrl');
  }
  const [_, videoId] = match;
  return { platform: 'youtube', videoId, videoUrl };
};
