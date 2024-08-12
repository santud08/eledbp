import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";
/**
 * fetchTmdbCountries
 * @param details
 */
export const fetchTmdbCountries = async (language = "en") => {
  try {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const axiosConfig = {
      method: "get",
      url: `${TMDB_APIS.COUNTRY_API_URL}?api_key=${envs.TMDB_API_KEY}&language=${language}`,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json;charset=utf-8",
      },
      httpsAgent: agent,
    };
    return axios(axiosConfig).then((results) => {
      if (results) {
        if (results.data) {
          return results.data;
        } else {
          return [];
        }
      } else {
        return [];
      }
    });
  } catch (error) {
    return [];
  }
};
