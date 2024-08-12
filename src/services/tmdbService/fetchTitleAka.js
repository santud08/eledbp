import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { TMDB_APIS } from "../../utils/constants.js";
import { languageService } from "../../services/index.js";

/**
 * fetchTitleAka
 * get the title aka
 * @param type - movie/tv
 * @param tmdbId - tmdb id
 * @param language
 */
export const fetchTitleAka = async (type, tmdbId, language = "en") => {
  try {
    let API_URL = "";
    const searchParams = { api_key: envs.TMDB_API_KEY, language: language };
    if (type == "movie") {
      API_URL = `${TMDB_APIS.MOVIE_DETAILS_API_URL}/${tmdbId}/alternative_titles`;
    } else if (type == "tv") {
      API_URL = `${TMDB_APIS.TVSHOW_DETAILS_API_URL}/${tmdbId}/alternative_titles`;
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

    const searchResult = { results: { aka: "", all_aka: "", list: [] } };
    if (result) {
      let results = [];
      if (type == "movie") {
        results = result.titles && result.titles.length > 0 ? result.titles : [];
      } else if (type == "tv") {
        results = result.results && result.results.length > 0 ? result.results : [];
      }
      if (results && results.length > 0) {
        const isoLan = await languageService.getIsoCode(language);
        if (isoLan) {
          const getAka = results.filter(function (value) {
            return value.iso_3166_1 == isoLan;
          });
          searchResult.results = { aka: getAka && getAka.length > 0 ? getAka[0].title : "" };
        }
        const allAka = [];
        results.map((aka) => {
          allAka.push(aka.title);
        });
        searchResult.results.list = allAka;
        searchResult.results.all_aka = "";
        if (allAka && allAka.length > 0) searchResult.results.all_aka = allAka.toString();
      }
    }
    return searchResult;
  } catch (error) {
    return { results: { aka: "", all_aka: "", list: [] } };
  }
};
