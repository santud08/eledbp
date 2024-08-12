import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";

/**
 * fetchTitleImages
 * @param details
 */
export const fetchTitleImages = async (type, tmdbId, language = "en") => {
  try {
    let API_URL = "";
    let searchParams = {};
    if (language) {
      searchParams = { api_key: envs.TMDB_API_KEY, language: language };
    } else {
      searchParams = { api_key: envs.TMDB_API_KEY };
    }
    //

    if (type == "movie") {
      API_URL = `${TMDB_APIS.MOVIE_DETAILS_API_URL}/${tmdbId}/images`;
    } else if (type == "tv") {
      API_URL = `${TMDB_APIS.TVSHOW_DETAILS_API_URL}/${tmdbId}/images`;
    }

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
          return results.data;
        } else {
          return [];
        }
      } else {
        return [];
      }
    });
    const searchResult = {};
    if (result) {
      if (type == "movie") {
        delete result.id;
        delete result.logos;
        searchResult.results = result;
      } else if (type == "tv") {
        delete result.id;
        delete result.logos;
        searchResult.results = result;
      }
    }
    return searchResult;
  } catch (error) {
    return { results: {} };
  }
};
