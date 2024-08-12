import { youtubeService } from "../index.js";

/**
 * getFormatedYoutubeDetails
 * get the youtube formated details
 * @param youtubeUrl
 * @return Object with details
 */
export const getFormatedYoutubeDetails = async (youtubeUrl) => {
  try {
    if (!youtubeUrl) {
      return null;
    } else {
      const videoDetails = await youtubeService.fetchYouTubeDetails(youtubeUrl);
      if (videoDetails && videoDetails.id) {
        let searchResult = {};
        if (videoDetails.snippet && videoDetails.snippet.thumbnails) {
          searchResult.video_thumb =
            videoDetails.snippet.thumbnails.high && videoDetails.snippet.thumbnails.high.url
              ? videoDetails.snippet.thumbnails.high.url
              : "";
        }
        if (videoDetails.contentDetails && videoDetails.contentDetails.duration) {
          searchResult.video_duration = videoDetails.contentDetails.duration;
        }
        if (videoDetails.statistics && videoDetails.statistics.viewCount) {
          searchResult.view_count = videoDetails.statistics.viewCount;
        }
        return searchResult;
      } else {
        return null;
      }
    }
  } catch (error) {
    console.log(error);
    return null;
  }
};
