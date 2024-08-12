import * as url from "url";
/**
 * getYouTubeIdFromUrls
 * used to get the id from youtube url
 * input array or string
 * @urls - youtube urls type as per input type
 * @return - array/string depend on input type
 */

export const getYouTubeIdFromUrls = async (urls) => {
  if (typeof urls === "string") {
    let youtubeUrls = urls;
    let youtubeId = "";
    const parsedUrl = url.parse(youtubeUrls);
    if (parsedUrl.host === "www.youtube.com" || parsedUrl.host === "youtube.com") {
      const queryParams = new URLSearchParams(parsedUrl.query);
      if (queryParams.has("v")) {
        youtubeId = queryParams.get("v");
      }
    } else if (parsedUrl.host === "youtu.be") {
      // For short URLs like 'https://youtu.be/VIDEO_ID'
      youtubeId = parsedUrl.pathname.substr(1); // Remove the leading '/'
    }
    return youtubeId; // URL is not a valid YouTube video URL
  } else if (Array.isArray(urls)) {
    let youtubeUrls = urls;
    let videoIds = [];
    if (youtubeUrls.length > 0) {
      for (const eachUrl of youtubeUrls) {
        let youtubeId = "";
        const parsedUrl = url.parse(eachUrl);
        if (parsedUrl.host === "www.youtube.com" || parsedUrl.host === "youtube.com") {
          const queryParams = new URLSearchParams(parsedUrl.query);
          if (queryParams.has("v")) {
            youtubeId = queryParams.get("v");
          }
        } else if (parsedUrl.host === "youtu.be") {
          // For short URLs like 'https://youtu.be/VIDEO_ID'
          youtubeId = parsedUrl.pathname.substr(1); // Remove the leading '/'
        }
        if (youtubeId) {
          videoIds.push(youtubeId);
        }
      }
    }
    return videoIds;
  } else {
    return "";
  }
};
