import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { YOUTUBE_APIS } from "../../utils/constants.js";
import { generalHelper } from "../../helpers/index.js";

/**
 * checkYouTubeThumbnails
 * check the youtube thumbnail present or not
 * @param youtubeUrl
 * @param returnVal- false/true on this thumb image url return
 */
export const checkYouTubeThumbnails = async (youtubeUrl, returnVal = false) => {
  try {
    const videoId = await generalHelper.getYouTubeIdFromUrls(youtubeUrl);
    if (!videoId) {
      return returnVal === true ? "" : false;
    } else {
      let searchParams = { key: envs.YOUTUBE_API_KEY, id: videoId, part: "snippet" };

      let API_URL = `${YOUTUBE_APIS.VIDEO_API_URL}`;

      const agent = new https.Agent({
        rejectUnauthorized: false,
      });
      const axiosConfig = {
        method: "get",
        url: `${API_URL}`,
        headers: {
          accept: "application/json",
          "Content-Type": "application/json;charset=utf-8",
        },
        httpsAgent: agent,
        params: searchParams,
      };
      const result = await axios(axiosConfig).then((results) => {
        if (results) {
          if (results.data) {
            // console.log(results.data);
            return results.data;
          } else {
            return {};
          }
        } else {
          return {};
        }
      });
      let searchResult = "";
      if (result && result.items && result.items.length > 0) {
        const video = result.items[0];
        if (video && video.snippet && video.snippet.thumbnails) {
          const thumbnails = video.snippet.thumbnails;
          console.log("Thumbnail URL:", thumbnails.default.url);
          searchResult = thumbnails.default.url;
        } else {
          searchResult = "";
          console.log("No thumbnail found for this video.");
        }
      }
      if (returnVal === true) {
        return searchResult;
      } else {
        return !searchResult ? false : true;
      }
    }
  } catch (error) {
    console.log(error);
    return returnVal === true ? "" : false;
  }
};
