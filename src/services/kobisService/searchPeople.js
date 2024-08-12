import axios from "axios";
import https from "https";
import { envs } from "../../config/index.js";
import { KOBIS_APIS } from "../../utils/constants.js";

/**
 * searchPeople for kobis api
 * @param details
 */
export const searchPeople = async (searchText, page, limit, language = "en") => {
  const API_URL = KOBIS_APIS.SEARCH_PEOPLE_API_URL;
  const searchParams = { key: envs.KOBIS_API_KEY };
  searchParams.peopleNm = searchText;
  searchParams.curPage = page;
  searchParams.itemPerPage = limit;

  const searchResult = { total_records: 0, total_pages: 0, page: page, limit: limit, results: [] };

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
      if (results.data && results.data.peopleListResult) {
        return results.data.peopleListResult;
      } else {
        return [];
      }
    } else {
      return [];
    }
  });

  if (result && result.peopleList && result.peopleList.length > 0) {
    searchResult.total_records = result.totCnt;
    searchResult.total_pages = result.totCnt > 0 ? Math.ceil(result.totCnt / limit) : 0;
    searchResult.page = page;
    searchResult.limit = limit;

    const peopleResults = [];
    for (const eachData of result.peopleList) {
      if (eachData) {
        const searchData = {
          kobis_id: eachData.peopleCd,
          people_name:
            language == "en" && eachData.movieNmEn != "" ? eachData.movieNmEn : eachData.peopleNm,
          role_name: eachData.repRoleNm,
          birth_day: "",
          profile_image: "",
          film_name: eachData.filmoNames,
        };
        peopleResults.push(searchData);
      }
    }
    searchResult.results = peopleResults;
  }
  return searchResult;
};
