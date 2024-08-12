import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";

/**
 * fetchTitleImdbId
 * get the title IMDB id by tmdb id
 * @param type - movie/tv
 * @param tmdbId - tmdb id
 * @param language
 */
export const fetchTitleImdbId = async (type, tmdbId, language = "en") => {
  try {
    let API_URL = "";
    const searchParams = { api_key: envs.TMDB_API_KEY, language: language };
    if (type == "movie") {
      API_URL = `${TMDB_APIS.MOVIE_DETAILS_API_URL}/${tmdbId}/external_ids`;
    } else if (type == "tv") {
      API_URL = `${TMDB_APIS.TVSHOW_DETAILS_API_URL}/${tmdbId}/external_ids`;
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
      searchResult.results = {
        tmdb_id: tmdbId,
        imdb_id: result.imdb_id && result.imdb_id != "undefined" ? result.imdb_id : "",
      };
    }
    return searchResult;
  } catch (error) {
    return { results: {} };
  }
};
