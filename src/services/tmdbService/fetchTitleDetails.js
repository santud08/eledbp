import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";
/**
 * fetchTitleDetails
 * @param details
 */
export const fetchTitleDetails = async (type, tmdbId, language = "en") => {
  try {
    let API_URL = "";
    const searchParams = { api_key: envs.TMDB_API_KEY, language: language };
    if (type == "movie") {
      API_URL = `${TMDB_APIS.MOVIE_DETAILS_API_URL}/${tmdbId}`;
    } else if (type == "tv") {
      API_URL = `${TMDB_APIS.TVSHOW_DETAILS_API_URL}/${tmdbId}`;
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
    const searchResult = { results: {} };
    if (result) {
      if (type == "movie") {
        const movieResults = {};
        movieResults.tmdb_id = result.id;
        movieResults.backdrop_path = result.backdrop_path
          ? `${TMDB_APIS.IMAGES.secure_base_url}original${result.backdrop_path}`
          : "";
        movieResults.poster_image = result.poster_path
          ? `${TMDB_APIS.IMAGES.secure_base_url}original${result.poster_path}`
          : "";
        delete result.id;
        delete result.backdrop_path;
        delete result.poster_path;
        searchResult.results = { ...movieResults, ...result };
      } else if (type == "tv") {
        const tvResults = {};
        tvResults.tmdb_id = result.id;
        tvResults.title = result.name;
        tvResults.original_title = result.original_name;
        tvResults.release_date = result.first_air_date;
        tvResults.release_date_to =
          result.status.toLowerCase() == "ended" ? result.last_air_date : "";
        tvResults.backdrop_path = result.backdrop_path
          ? `${TMDB_APIS.IMAGES.secure_base_url}original${result.backdrop_path}`
          : "";
        tvResults.poster_image = result.poster_path
          ? `${TMDB_APIS.IMAGES.secure_base_url}original${result.poster_path}`
          : "";
        delete result.id;
        delete result.first_air_date;
        delete result.poster_path;
        delete result.name;
        delete result.original_name;
        delete result.backdrop_path;
        searchResult.results = { ...tvResults, ...result };
      }
    }
    return searchResult;
  } catch (error) {
    return { results: {} };
  }
};
