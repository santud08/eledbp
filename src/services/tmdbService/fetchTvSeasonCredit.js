import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";

/**
 * fetchTvSeasonCredit
 * fetch the tv season credit list
 * @param tmdbId - tmdb/tv id
 * @param seasonNo - season number
 * * @param type - cast/crew or blank means all
 * @param language - language
 */
export const fetchTvSeasonCredit = async (tmdbId, seasonNo, type, language = "en") => {
  try {
    const searchParams = { api_key: envs.TMDB_API_KEY, language: language };
    const API_URL = `${TMDB_APIS.TVSHOW_DETAILS_API_URL}/${tmdbId}/season/${seasonNo}/credits`;

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
      let seasonEpisodeResults = {};
      if (type && result[type] && result[type].length > 0) {
        for (const eachData of result[type]) {
          if (eachData) {
            if (type == "cast") {
              seasonEpisodeResults[type] = seasonEpisodeResults[type] || [];
              const seasonCreditObj = {
                cast_name: eachData.name,
                character_name: eachData.character,
                job: eachData.known_for_department,
                tmdb_id: eachData.id,
                is_guest: "n",
                poster: eachData.profile_path
                  ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachData.profile_path}`
                  : "",
              };
              seasonEpisodeResults[type].push(seasonCreditObj);
            } else {
              seasonEpisodeResults[type] = seasonEpisodeResults[type] || [];
              const seasonCreditObj = {
                cast_name: eachData.name,
                job: eachData.job,
                poster: eachData.profile_path
                  ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachData.profile_path}`
                  : "",
                tmdb_id: eachData.id,
              };
              seasonEpisodeResults[type].push(seasonCreditObj);
            }
          }
        }
      } else {
        seasonEpisodeResults["cast"] = [];
        if (result["cast"] && result["cast"].length > 0) {
          for (const eachData of result["cast"]) {
            if (eachData) {
              const seasonCreditObj = {
                cast_name: eachData.name,
                character_name: eachData.character,
                job: eachData.known_for_department,
                is_guest: "n",
                poster: eachData.profile_path
                  ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachData.profile_path}`
                  : "",
                tmdb_id: eachData.id,
              };
              seasonEpisodeResults["cast"].push(seasonCreditObj);
            }
          }
        }
        seasonEpisodeResults["crew"] = [];
        if (result["crew"] && result["crew"].length > 0) {
          for (const eachData of result["crew"]) {
            if (eachData) {
              const seasonCreditObj = {
                cast_name: eachData.name,
                job: eachData.job,
                poster: eachData.profile_path
                  ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachData.profile_path}`
                  : "",
                tmdb_id: eachData.id,
              };
              seasonEpisodeResults["crew"].push(seasonCreditObj);
            }
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
