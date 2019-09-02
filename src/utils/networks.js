import parseYoutubeUrl from 'lib/utils/parseYoutubeUrl';
import { ValidationError } from './validation';

// Keys of the object are all supported video plarforms.
// Values are functions checking if ID of the video is (potentially) valid.
export const VIDEO_PLATFORMS = {
  youtube: id => /^[a-zA-Z0-9_-]{11}$/.test(id),
};

export const parseVideoUrl = videoUrl => {
  const videoId = parseYoutubeUrl(videoUrl);
  if (!videoId) {
    throw new ValidationError('errors.badVideoUrl');
  }
  return { platform: 'youtube', videoId, videoUrl };
};
