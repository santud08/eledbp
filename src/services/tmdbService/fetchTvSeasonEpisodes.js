import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";

/**
 * fetchTvSeasonEpisodes
 * fetch the tv season episode list
 * @param tmdbId - tmdb/tv id
 * @param seasonNo - season number
 * @param language - language
 */
export const fetchTvSeasonEpisodes = async (tmdbId, seasonNo, language = "en") => {
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
      let seasonEpisodeResults = [];
      if (result.episodes && result.episodes.length > 0) {
        for (const eachData of result.episodes) {
          if (eachData) {
            const seasonEpisodeObj = {
              episode_name: eachData.name,
              episode_number: eachData.episode_number,
              season_number: eachData.season_number,
              release_date: eachData.air_date,
              overview: eachData.overview,
              poster_image: eachData.still_path
                ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachData.still_path}`
                : "",
            };
            seasonEpisodeResults.push(seasonEpisodeObj);
          }
        }
      }
      searchResult.results = seasonEpisodeResults;
    }
    return searchResult;
  } catch (error) {
    return { results: {} };
  }
};
