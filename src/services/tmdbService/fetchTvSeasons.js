import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";

/**
 * fetchTvSeasons
 * season list of a tv
 * @param tmdbId
 * @param language
 */
export const fetchTvSeasons = async (tmdbId, language = "en") => {
  try {
    const searchParams = { api_key: envs.TMDB_API_KEY, language: language };

    const API_URL = `${TMDB_APIS.TVSHOW_DETAILS_API_URL}/${tmdbId}`;

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
    const searchResult = { results: [] };
    if (result && result.seasons && result.seasons.length > 0) {
      let seasonResults = [];
      for (const eachData of result.seasons) {
        if (eachData) {
          const seasonObj = {
            season_number: eachData.season_number,
            season_name: eachData.name,
            no_of_episode: eachData.episode_count,
            release_date: eachData.air_date,
          };
          seasonResults.push(seasonObj);
        }
      }
      searchResult.results = seasonResults;
    }

    return searchResult;
  } catch (error) {
    return { results: [] };
  }
};
