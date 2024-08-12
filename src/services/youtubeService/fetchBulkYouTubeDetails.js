import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { YOUTUBE_APIS } from "../../utils/constants.js";
import { generalHelper } from "../../helpers/index.js";

/**
 * fetchBulkYouTubeDetails
 * check the youtube details with multiple
 * @param youtubeUrls - the youtube ids -in array
 * @param raw- use the return youtube return all result or formated result which we inn in our prject- boolean
 */
export const fetchBulkYouTubeDetails = async (
  youtubeUrls,
  part = "snippet,contentDetails,statistics,status",
  raw = false,
) => {
  try {
    const videoIds = await generalHelper.getYouTubeIdFromUrls(youtubeUrls);
    if (videoIds.length > 0) {
      let searchParams = { key: envs.YOUTUBE_API_KEY, id: videoIds.join(","), part: part };

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
      let searchResults = {};
      if (result && result.items && result.items.length > 0) {
        if (raw) {
          searchResults = result.items;
        } else {
          for (const videoDetails of result.items) {
            if (videoDetails && videoDetails.id) {
              let formatedObject = { youtube_id: videoDetails.id };
              if (videoDetails.snippet && videoDetails.snippet.thumbnails) {
                formatedObject.video_thumb =
                  videoDetails.snippet.thumbnails.high && videoDetails.snippet.thumbnails.high.url
                    ? videoDetails.snippet.thumbnails.high.url
                    : "";
              }
              if (videoDetails.contentDetails && videoDetails.contentDetails.duration) {
                formatedObject.video_duration = videoDetails.contentDetails.duration;
              }
              if (videoDetails.statistics && videoDetails.statistics.viewCount) {
                formatedObject.view_count = videoDetails.statistics.viewCount;
              }
              searchResults[videoDetails.id] = formatedObject;
            }
          }
        }
      }

      return searchResults;
    } else {
      return {};
    }
  } catch (error) {
    console.log(error);
    return {};
  }
};
