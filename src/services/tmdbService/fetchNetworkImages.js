import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";

/**
 * fetchNetworkImages
 * @param details
 */
export const fetchNetworkImages = async (networkId, language = "en") => {
  try {
    const searchParams = { api_key: envs.TMDB_API_KEY, language: language };

    const API_URL = `${TMDB_APIS.TV_NETWORK_IMAGE_API_URL}/${networkId}/images`;

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
    return await axios(axiosConfig).then((results) => {
      if (results) {
        if (results.data) {
          return results.data;
        } else {
          return null;
        }
      } else {
        return null;
      }
    });
  } catch (error) {
    return null;
  }
};
