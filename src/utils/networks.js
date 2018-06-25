import { ValidationError } from './validation';

// Keys of the object are all supported video plarforms.
// Values are functions checking if ID of the video is (potentially) valid.
export const VIDEO_PLATFORMS = {
  youtube: id => /^[a-zA-Z0-9_-]{11}$/.test(id),
};

export const VIDEO_PLATFORMS_LIST = Object.keys(VIDEO_PLATFORMS);

const YOUTUBE_VIDEO_URL = /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/;

export const parseVideoUrl = videoUrl => {
  const youtubeMatch = YOUTUBE_VIDEO_URL.exec(videoUrl);
  if (youtubeMatch) {
    return { platform: 'youtube', videoId: youtubeMatch[1], videoUrl };
  }
  throw new ValidationError('errors.badVideoUrl');
};
