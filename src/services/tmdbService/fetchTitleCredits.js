import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";

/**
 * fetchTitleCredits
 * fetch the tv/movie credit list
 * @param type - tv/movie
 * @param tmdbId - tmdb/tv id/movie id
 * @param listType - cast/crew or blank means all
 * @param language - language
 */
export const fetchTitleCredits = async (type, tmdbId, listType = null, language = "en") => {
  try {
    let API_URL = "";
    const searchParams = { api_key: envs.TMDB_API_KEY, language: language };
    if (type == "movie") {
      API_URL = `${TMDB_APIS.MOVIE_DETAILS_API_URL}/${tmdbId}/credits`;
    } else if (type == "tv") {
      API_URL = `${TMDB_APIS.TVSHOW_DETAILS_API_URL}/${tmdbId}/credits`;
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
      let creditResults = {};
      if (listType && result[listType] && result[listType].length > 0) {
        for (const eachData of result[listType]) {
          if (eachData) {
            if (listType == "cast") {
              creditResults[listType] = creditResults[listType] || [];
              const creditObj = {
                cast_name: eachData.name,
                character_name: eachData.character,
                job: eachData.known_for_department,
                is_guest: "n",
                poster: eachData.profile_path
                  ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachData.profile_path}`
                  : "",
                list_order: eachData.order,
                tmdb_id: eachData.id,
              };
              creditResults[listType].push(creditObj);
            } else {
              creditResults[listType] = creditResults[listType] || [];
              const creditObj = {
                cast_name: eachData.name,
                job: eachData.job,
                poster: eachData.profile_path
                  ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachData.profile_path}`
                  : "",
                list_order: eachData.order,
                tmdb_id: eachData.id,
              };
              creditResults[listType].push(creditObj);
            }
          }
        }
      } else {
        creditResults["cast"] = [];
        if (result["cast"] && result["cast"].length > 0) {
          for (const eachData of result["cast"]) {
            if (eachData) {
              const creditObj = {
                cast_name: eachData.name,
                character_name: eachData.character,
                job: eachData.known_for_department,
                is_guest: "n",
                poster: eachData.profile_path
                  ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachData.profile_path}`
                  : "",
                list_order: eachData.order,
                tmdb_id: eachData.id,
              };
              creditResults["cast"].push(creditObj);
            }
          }
        }
        creditResults["crew"] = [];
        if (result["crew"] && result["crew"].length > 0) {
          for (const eachData of result["crew"]) {
            if (eachData) {
              const creditObj = {
                cast_name: eachData.name,
                job: eachData.job,
                poster: eachData.profile_path
                  ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachData.profile_path}`
                  : "",
                list_order: eachData.order,
                tmdb_id: eachData.id,
              };
              creditResults["crew"].push(creditObj);
            }
          }
        }
      }
      searchResult.results = { id: result.id, ...creditResults };
    }
    return searchResult;
  } catch (error) {
    return { results: {} };
  }
};
