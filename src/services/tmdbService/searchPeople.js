import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";

/**
 * searchPeople
 * @param details
 */
export const searchPeople = async (searchText, page, language = "en") => {
  const API_URL = TMDB_APIS.SEARCH_PEOPLE_API_URL;
  const searchParams = { api_key: envs.TMDB_API_KEY, language: language };
  searchParams.query = searchText;
  searchParams.page = page;

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
  if (result && result.results && result.results.length > 0) {
    searchResult.total_records = result.total_results;
    searchResult.total_pages = result.total_pages;
    searchResult.page = page;

    const peopleResults = [];
    for (const eachData of result.results) {
      if (eachData) {
        const searchData = {
          tmdb_id: eachData.id,
          people_name: eachData.name,
          role_name: eachData.known_for_department,
          birth_day: "",
          profile_image: eachData.profile_path
            ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachData.profile_path}`
            : "",
        };
        peopleResults.push(searchData);
      }
    }
    searchResult.results = peopleResults;
  }
  return searchResult;
};
