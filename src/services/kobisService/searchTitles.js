import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { KOBIS_APIS } from "../../utils/constants.js";
import { customDateTimeHelper } from "../../helpers/index.js";
/**
 * searchTitles for kobis api
 * @param details
 */
export const searchTitles = async (type, searchText, page, limit, language = "en") => {
  let API_URL = "";
  const searchParams = { key: envs.KOBIS_API_KEY };
  searchParams.movieNm = searchText;
  searchParams.curPage = page;
  searchParams.itemPerPage = limit;
  if (type == "movie") {
    API_URL = KOBIS_APIS.SEARCH_MOVIE_API_URL;
  }
  const searchResult = { total_records: 0, total_pages: 0, page: page, limit: limit, results: [] };
  if (type != "movie") {
    return searchResult;
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
      if (results.data && results.data.movieListResult) {
        return results.data.movieListResult;
      } else {
        return [];
      }
    } else {
      return [];
    }
  });

  if (result && result.movieList && result.movieList.length > 0) {
    searchResult.total_records = result.totCnt;
    searchResult.total_pages = result.totCnt > 0 ? Math.ceil(result.totCnt / limit) : 0;
    searchResult.page = page;
    searchResult.limit = limit;
    if (type == "movie") {
      const movieResults = [];
      for (const eachData of result.movieList) {
        if (eachData) {
          const searchData = {
            kobis_id: eachData.movieCd,
            title: language == "ko" ? eachData.movieNm : eachData.movieNmEn,
            original_title: "",
            release_date: eachData.openDt
              ? await customDateTimeHelper.getFormatedDateFromString(eachData.openDt)
              : "",
            overview: "",
            poster_image: "",
            year: eachData.prdtYear,
          };
          movieResults.push(searchData);
        }
      }
      searchResult.results = movieResults;
    }
  }
  return searchResult;
};
