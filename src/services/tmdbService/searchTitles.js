import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";
import { customDateTimeHelper } from "../../helpers/index.js";

/**
 * searchTitles
 * @param details
 */
export const searchTitles = async (type, searchText, page, language = "en") => {
  let API_URL = "";
  const searchParams = { api_key: envs.TMDB_API_KEY, language: language };
  searchParams.query = searchText;
  searchParams.page = page;
  if (type == "movie") {
    API_URL = TMDB_APIS.SEARCH_MOVIE_API_URL;
  } else if (type == "tv") {
    API_URL = TMDB_APIS.SEARCH_TVSHOW_API_URL;
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
  if (result && result.results && result.results.length > 0) {
    searchResult.total_records = result.total_results;
    searchResult.total_pages = result.total_pages;
    searchResult.page = page;
    if (type == "movie") {
      const movieResults = [];
      for (const eachData of result.results) {
        if (eachData) {
          const searchData = {
            tmdb_id: eachData.id,
            title: eachData.title,
            original_title: eachData.original_title,
            release_date: eachData.release_date,
            overview: eachData.overview,
            poster_image: eachData.poster_path
              ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachData.poster_path}`
              : "",
            year: eachData.release_date
              ? await customDateTimeHelper.changeDateFormat(eachData.release_date, "YYYY")
              : "",
          };
          movieResults.push(searchData);
        }
      }
      searchResult.results = movieResults;
    } else if (type == "tv") {
      const tvResults = [];
      for (const eachData of result.results) {
        if (eachData) {
          const searchData = {
            tmdb_id: eachData.id,
            title: eachData.name,
            original_title: eachData.original_name,
            release_date: eachData.first_air_date,
            overview: eachData.overview,
            poster_image: eachData.poster_path
              ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachData.poster_path}`
              : "",
            year: eachData.first_air_date
              ? await customDateTimeHelper.changeDateFormat(eachData.first_air_date, "YYYY")
              : "",
          };
          tvResults.push(searchData);
        }
      }
      searchResult.results = tvResults;
    }
  }
  return searchResult;
};
