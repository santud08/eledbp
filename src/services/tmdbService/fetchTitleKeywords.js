import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";

/**
 * fetchTitleKeywords
 * @param details
 */
export const fetchTitleKeywords = async (type, tmdbId, language = "en") => {
  try {
    let API_URL = "";
    const searchParams = { api_key: envs.TMDB_API_KEY, language: language };
    if (type == "movie") {
      API_URL = `${TMDB_APIS.MOVIE_DETAILS_API_URL}/${tmdbId}/keywords`;
    } else if (type == "tv") {
      API_URL = `${TMDB_APIS.TVSHOW_DETAILS_API_URL}/${tmdbId}/keywords`;
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
    if (result && type == "movie") {
      searchResult.results = { id: result.id, keywords: result.keywords };
    }
    if (result && type == "tv") {
      searchResult.results = { id: result.id, keywords: result.results };
    }
    return searchResult;
  } catch (error) {
    return { results: {} };
  }
};
