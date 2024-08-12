import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";

/**
 * fetchTvSeasonDetails
 * fetch the tv season details
 * @param tmdbId - tmdb/tv id
 * @param seasonNo - season number
 * @param language - language
 */

export const fetchTvSeasonDetails = async (tmdbId, seasonNo, language = "en") => {
  try {
    const searchParams = { api_key: envs.TMDB_API_KEY, language: language };
    const API_URL = `${TMDB_APIS.TVSHOW_DETAILS_API_URL}/${tmdbId}/season/${seasonNo}`;

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
    const searchResult = { results: {} };
    if (result) {
      const seasonResults = {};
      seasonResults.season_number = result.season_number;
      seasonResults.season_name = result.name;
      seasonResults.overview = result.overview;
      seasonResults.no_of_episode =
        result.episodes && result.episodes.length > 0 ? result.episodes.length : 0;
      seasonResults.release_date = result.air_date;
      seasonResults.poster_image = result.poster_path
        ? `${TMDB_APIS.IMAGES.secure_base_url}original${result.poster_path}`
        : "";
      searchResult.results = seasonResults;
    }
    return searchResult;
  } catch (error) {
    return { results: {} };
  }
};
