import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";

/**
 * fetchTvSeasonEpisodeDetails
 * fetch the tv season episode details
 * @param tmdbId - tmdb/tv id
 * @param seasonNo - season number
 * @param episodeNo - episode number
 * @param language - language
 */
export const fetchTvSeasonEpisodeDetails = async (tmdbId, seasonNo, episodeNo, language = "en") => {
  try {
    const searchParams = { api_key: envs.TMDB_API_KEY, language: language };
    const API_URL = `${TMDB_APIS.TVSHOW_DETAILS_API_URL}/${tmdbId}/season/${seasonNo}/episode/${episodeNo}`;

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
      const seasonEpisodeResults = {};
      seasonEpisodeResults.episode_name = result.name;
      seasonEpisodeResults.episode_number = result.episode_number;
      seasonEpisodeResults.season_number = result.season_number;
      seasonEpisodeResults.overview = result.overview;
      seasonEpisodeResults.release_date = result.air_date;
      seasonEpisodeResults.poster_image = result.still_path
        ? `${TMDB_APIS.IMAGES.secure_base_url}original${result.still_path}`
        : "";
      searchResult.results = seasonEpisodeResults;
    }
    return searchResult;
  } catch (error) {
    return { results: {} };
  }
};