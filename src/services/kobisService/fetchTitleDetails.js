import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { KOBIS_APIS } from "../../utils/constants.js";
import { customDateTimeHelper } from "../../helpers/index.js";

/**
 * fetchTitleDetails for kobis api
 * @param details
 */
export const fetchTitleDetails = async (type, kobisId, language = "en") => {
  try {
    if (type != "movie") {
      return { results: {} };
    }
    let API_URL = "";
    const searchParams = { key: envs.KOBIS_API_KEY };
    searchParams.movieCd = kobisId;
    if (type == "movie") {
      API_URL = KOBIS_APIS.GET_MOVIE_DETAILS_API_URL;
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
        if (results.data && results.data.movieInfoResult) {
          return results.data.movieInfoResult;
        } else {
          return [];
        }
      } else {
        return [];
      }
    });
    const searchResult = {};
    if (result && result.movieInfo) {
      if (type == "movie" && result.movieInfo.movieCd) {
        const movieResults = {};
        movieResults.source = result.source;
        movieResults.kobis_id = result.movieInfo.movieCd;
        movieResults.title =
          language == "en" ? result.movieInfo.movieNmEn : result.movieInfo.movieNm;
        movieResults.original_title = result.movieInfo.movieNmOg;
        movieResults.year = result.movieInfo.prdtYear;
        movieResults.runtime = result.movieInfo.showTm;
        movieResults.release_date = result.movieInfo.openDt
          ? await customDateTimeHelper.getFormatedDateFromString(result.movieInfo.openDt)
          : "";

        delete result.movieInfo.movieCd;
        delete result.movieInfo.movieNmOg;
        delete result.movieInfo.movieNmEn;
        delete result.movieInfo.movieNm;
        delete result.movieInfo.prdtYear;
        delete result.movieInfo.showTm;
        delete result.movieInfo.openDt;
        delete result.movieInfo.openDt;
        searchResult.results = { ...movieResults, ...result.movieInfo };
        return searchResult;
      } else {
        return { results: {} };
      }
    } else {
      return { results: {} };
    }
  } catch (error) {
    return { results: {} };
  }
};
