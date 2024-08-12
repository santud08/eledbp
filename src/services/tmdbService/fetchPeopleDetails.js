import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";

/**
 * fetchPeopleDetails
 * @param details
 */
export const fetchPeopleDetails = async (tmdbId, language = "en") => {
  try {
    const API_URL = `${TMDB_APIS.PEOPLE_DETAILS_API_URL}/${tmdbId}`;
    const searchParams = { api_key: envs.TMDB_API_KEY, language: language };

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
      const peopleResults = {};
      peopleResults.tmdb_id = result.id;
      peopleResults.people_name = result.name;
      peopleResults.birth_day = result.birthday;
      peopleResults.death_day = result.deathday;
      peopleResults.role_name = result.known_for_department;
      peopleResults.profile_image = result.profile_path
        ? `${TMDB_APIS.IMAGES.secure_base_url}original${result.profile_path}`
        : "";
      peopleResults.aka =
        result.also_known_as &&
        result.also_known_as != null &&
        result.also_known_as != "undefined" &&
        result.also_known_as.length > 0
          ? result.also_known_as.toString()
          : "";
      delete result.id;
      delete result.profile_path;
      delete result.birthday;
      delete result.deathday;
      delete result.known_for_department;
      delete result.name;
      searchResult.results = { ...peopleResults, ...result };
    }
    return searchResult;
  } catch (error) {
    return { results: {} };
  }
};
