import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";
import { customDateTimeHelper } from "../../helpers/index.js";

/**
 * fetchTitleDetailsImdbId & people details also
 * @param details
 */
export const fetchTitleDetailsImdbId = async (type, imdbId, language = "en") => {
  try {
    let API_URL = `${TMDB_APIS.FIND_BY_ID_API_URL}/${imdbId}`;
    const searchParams = {
      api_key: envs.TMDB_API_KEY,
      language: language,
      external_source: "imdb_id",
    };
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
      if (type == "movie" && result.movie_results && result.movie_results.length > 0) {
        for (const eachRow of result.movie_results) {
          searchResult.results = searchResult.results || [];
          const movieResults = {};
          if (eachRow) {
            movieResults.tmdb_id = eachRow.id;
            movieResults.backdrop_path = eachRow.backdrop_path
              ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachRow.backdrop_path}`
              : "";
            movieResults.poster_image = eachRow.poster_path
              ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachRow.poster_path}`
              : "";
            movieResults.year = eachRow.release_date
              ? await customDateTimeHelper.changeDateFormat(eachRow.release_date, "YYYY")
              : "";
            delete eachRow.id;
            delete eachRow.backdrop_path;
            delete eachRow.poster_path;
            searchResult.results.push({ ...movieResults, ...eachRow });
          }
        }
      } else if (type == "tv" && result.tv_results && result.tv_results.length > 0) {
        for (const eachRow of result.tv_results) {
          searchResult.results = searchResult.results || [];
          const tvResults = {};
          if (eachRow) {
            tvResults.tmdb_id = eachRow.id;
            tvResults.title = eachRow.name;
            tvResults.original_title = eachRow.original_name;
            tvResults.release_date = eachRow.first_air_date;
            tvResults.backdrop_path = eachRow.backdrop_path
              ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachRow.backdrop_path}`
              : "";
            tvResults.poster_image = eachRow.poster_path
              ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachRow.poster_path}`
              : "";
            tvResults.year = eachRow.first_air_date
              ? await customDateTimeHelper.changeDateFormat(eachRow.first_air_date, "YYYY")
              : "";
            delete eachRow.id;
            delete eachRow.first_air_date;
            delete eachRow.poster_path;
            delete eachRow.name;
            delete eachRow.original_name;
            delete eachRow.backdrop_path;
            searchResult.results.push({ ...tvResults, ...eachRow });
          }
        }
      } else if (type == "people" && result.person_results && result.person_results.length > 0) {
        for (const eachRow of result.person_results) {
          searchResult.results = searchResult.results || [];
          const peopleResults = {};
          if (eachRow) {
            peopleResults.tmdb_id = eachRow.id;
            peopleResults.people_name = eachRow.name;
            peopleResults.original_people_name = eachRow.original_name;
            peopleResults.birth_day = "";
            peopleResults.death_day = "";
            peopleResults.role_name = eachRow.known_for_department;
            peopleResults.profile_image = eachRow.profile_path
              ? `${TMDB_APIS.IMAGES.secure_base_url}original${eachRow.profile_path}`
              : "";
            delete eachRow.id;
            delete eachRow.known_for_department;
            delete eachRow.profile_path;
            delete eachRow.name;
            delete eachRow.original_name;
            searchResult.results.push({ ...peopleResults, ...eachRow });
          }
        }
      }
    }
    return searchResult;
  } catch (error) {
    return { results: {} };
  }
};
