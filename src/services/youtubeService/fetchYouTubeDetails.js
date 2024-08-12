import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { YOUTUBE_APIS } from "../../utils/constants.js";
import { generalHelper } from "../../helpers/index.js";

/**
 * fetchYouTubeDetails
 * check the youtube details
 * @param youtubeUrl
 * @param part- snippet,contentDetails,statistics,status
 */
export const fetchYouTubeDetails = async (
  youtubeUrl,
  part = "snippet,contentDetails,statistics,status",
) => {
  try {
    const videoId = await generalHelper.getYouTubeIdFromUrls(youtubeUrl);

    let searchParams = { key: envs.YOUTUBE_API_KEY, id: videoId, part: part };

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
    let searchResult = {};
    if (result && result.items && result.items.length > 0) {
      if (result.items[0] && result.items[0] != null && result.items[0] != "undefined") {
        searchResult = result.items[0];
      } else {
        searchResult = {};
        console.log("No details found for this video.");
      }
    }
    return searchResult;
  } catch (error) {
    console.log(error);
    return {};
  }
};
