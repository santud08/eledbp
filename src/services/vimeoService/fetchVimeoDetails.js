import axios from "axios";
import https from "https";
import { VIMEO_APIS } from "../../utils/constants.js";
import { generalHelper } from "../../helpers/index.js";

/**
 * fetchVimeoDetails
 * check the vimeo details
 * @param vimeoUrl
 */
export const fetchVimeoDetails = async (vimeoUrl) => {
  try {
    const videoId = await generalHelper.getVimeoVideoId(vimeoUrl);
    let searchResult = {};
    if (videoId) {
      let API_URL = `${VIMEO_APIS.VIDEO_API_URL.replace("_:ID", videoId)}`;

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
      };
      const result = await axios(axiosConfig).then((results) => {
        if (results) {
          if (results.data) {
            return results.data;
          } else {
            return {};
          }
        } else {
          return {};
        }
      });
      if (result && result.length > 0) {
        if (result[0] && result[0] != null && result[0] != "undefined") {
          searchResult = result[0];
        } else {
          searchResult = {};
          console.log("No details found for this video.");
        }
      }
    }
    return searchResult;
  } catch (error) {
    console.log(error);
    return {};
  }
};
